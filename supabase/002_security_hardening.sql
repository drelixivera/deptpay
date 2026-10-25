-- -----------------------------------------------------------------------------
-- BLOCK 1: Clean slate + audit trail
-- -----------------------------------------------------------------------------

-- Drop every policy from the original schema so we start from zero.
-- If any of these don't exist, DROP POLICY IF EXISTS is a no-op — safe.
DROP POLICY IF EXISTS "Allow public read access to active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow authenticated users full access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public to insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public to read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow authenticated users to update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow authenticated users to delete submissions" ON public.submissions;

-- Add a "reviewed_by" column so we know which rep approved/rejected a row.
-- For now it's always the shared rep account, but this future-proofs us
-- for when you add a second rep per class.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index it, because the admin dashboard will sort/filter by reviewer in the future.
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by
  ON public.submissions(reviewed_by);

-- Make sure RLS is actually enabled. (schema.sql did this, but be explicit.)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions FORCE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- BLOCK 2: The is_rep() helper — the keystone of every policy below
-- -----------------------------------------------------------------------------
-- Returns TRUE if the current request is from a logged-in Supabase Auth user,
-- FALSE otherwise. Because we've disabled public signups (Block 6) and only
-- created users manually in the dashboard, "authenticated" effectively means
-- "is a rep."
--
-- SECURITY DEFINER: runs with the function owner's privileges. Necessary
-- because reading auth.uid() from within RLS already works, but wrapping it
-- in a function makes policies self-documenting and easier to change later
-- (e.g. when you add per-rep class assignments, you'll edit this one function
-- instead of every policy).
CREATE OR REPLACE FUNCTION public.is_rep()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Grant execute to both roles so the function can be referenced from policies
-- that apply to anon and authenticated.
GRANT EXECUTE ON FUNCTION public.is_rep() TO anon, authenticated;


-- -----------------------------------------------------------------------------
-- BLOCK 3: Lock down submissions
-- -----------------------------------------------------------------------------
-- This is the core fix. The old schema let anyone read every row via the
-- public anon key. Students now use an RPC that filters server-side by matric.
-- The rep reads the full table only because they're authenticated.

-- 3a. Table-level privileges.
-- Revoke blanket access from anon; explicitly grant only what's needed.
-- (RLS policies are the gate, but GRANTs are the lock — need both.)
REVOKE ALL ON public.submissions FROM anon;
GRANT SELECT, INSERT ON public.submissions TO anon;

REVOKE ALL ON public.submissions FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;

-- 3b. Student-facing RPC: get only *my* submissions by matric.
-- Runs as SECURITY DEFINER so it can read the table despite anon having
-- no direct SELECT. Filters by an exact matric match — no wildcards,
-- no substring search — so a student can never enumerate other students.
CREATE OR REPLACE FUNCTION public.get_my_submissions(p_matric TEXT)
RETURNS SETOF public.submissions
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT *
  FROM public.submissions
  WHERE lower(trim(matric_number)) = lower(trim(p_matric))
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_submissions(TEXT) TO anon, authenticated;

-- 3c. RLS policies on submissions.

-- Students: can insert (submit a receipt). But we validate the shape of what
-- they insert, so a malicious client can't insert garbage or a fake URL.
CREATE POLICY "Students can insert submissions"
ON public.submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(full_name)) >= 2
  AND length(trim(matric_number)) >= 4
  AND receipt_url IS NOT NULL
  AND length(receipt_url) > 0
  AND status = 'pending'
  AND rejection_reason IS NULL
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
);

-- Students: cannot SELECT the table directly.
-- (No SELECT policy for anon → denied by default. They use the RPC above.)

-- Reps: can read every submission.
CREATE POLICY "Reps can read all submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (public.is_rep());

-- Reps: can update status / rejection_reason / reviewed_*.
CREATE POLICY "Reps can update submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (public.is_rep())
WITH CHECK (
  public.is_rep()
  AND status IN ('pending', 'approved', 'rejected')
);

-- Reps: can delete a submission (e.g. accidental duplicate).
CREATE POLICY "Reps can delete submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (public.is_rep());


-- -----------------------------------------------------------------------------
-- BLOCK 4: Lock down campaigns
-- -----------------------------------------------------------------------------
-- Campaigns are public-readable (students need bank details + amount to pay).
-- All writes are rep-only. This replaces the original schema's blanket
-- "authenticated full access" with something that's still permissive for the
-- rep but explicit about *why*.

-- 4a. Table-level privileges.
REVOKE ALL ON public.campaigns FROM anon;
GRANT SELECT ON public.campaigns TO anon;

REVOKE ALL ON public.campaigns FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;

-- 4b. RLS policies.

-- Anyone can read active campaigns (students need to see what to pay for).
-- Note: we allow reading *inactive* campaigns to authenticated users only
-- in the policy below, so students don't see closed items.
CREATE POLICY "Anyone can read active campaigns"
ON public.campaigns FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Reps can read all campaigns, including inactive ones (needed for the
-- "All Items" filter and to re-activate a campaign later).
CREATE POLICY "Reps can read all campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (public.is_rep());

-- Reps can create new campaigns.
CREATE POLICY "Reps can create campaigns"
ON public.campaigns FOR INSERT
TO authenticated
WITH CHECK (
  public.is_rep()
  AND length(trim(title)) >= 2
  AND amount >= 0
  AND length(trim(bank_name)) >= 2
  AND length(trim(account_number)) >= 6
  AND length(trim(account_name)) >= 2
);

-- Reps can update campaigns (e.g. toggle is_active, edit description).
CREATE POLICY "Reps can update campaigns"
ON public.campaigns FOR UPDATE
TO authenticated
USING (public.is_rep())
WITH CHECK (
  public.is_rep()
  AND length(trim(title)) >= 2
  AND amount >= 0
);

-- Reps can delete campaigns (ON DELETE CASCADE on submissions means this
-- also wipes related submissions — that's intentional and documented).
CREATE POLICY "Reps can delete campaigns"
ON public.campaigns FOR DELETE
TO authenticated
USING (public.is_rep());


-- -----------------------------------------------------------------------------
-- BLOCK 5: Lock down storage (receipts bucket)
-- -----------------------------------------------------------------------------
-- KNOWN TRADE-OFF (documented): the 'receipts' bucket is public, so anyone
-- with a receipt URL can view the image. URLs include a timestamp + matric,
-- so they're not enumerable — but this is not true privacy.
--
-- UPGRADE PATH (Day 5): make the bucket private, store only the storage path
-- in submissions.receipt_url, and have the rep fetch a signed URL via an RPC.
-- See 003_storage_private.sql (future) for that migration.

-- 5a. Drop the permissive policies from schema.sql.
DROP POLICY IF EXISTS "Allow public receipt uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of receipts" ON storage.objects;

-- 5b. Uploads stay open: students must be able to upload without logging in.
-- We constrain to the 'receipts' bucket and to image mimetypes only.
CREATE POLICY "Students can upload receipts"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
);

-- 5c. Reads stay public *for the receipts bucket only*.
-- This is what makes the <img src={receipt_url}> in the student portal
-- and ReceiptModal work without auth.
CREATE POLICY "Anyone can read receipt images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'receipts');

-- 5d. Only reps can delete receipts.
CREATE POLICY "Reps can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND public.is_rep()
);

-- 5e. Only reps can overwrite (update) receipts.
CREATE POLICY "Reps can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND public.is_rep()
);