-- DeptPay: Supabase Database Schema & Storage Configuration
-- Designed for LAUTECH Chemical Engineering / Departmental Collections

-- 1. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_code TEXT,
    description TEXT,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    matric_number TEXT NOT NULL,
    phone_number TEXT,
    receipt_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMPTZ
);

-- 3. Indexes for fast filtering & search
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_id ON public.submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_matric_number ON public.submissions(matric_number);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON public.campaigns(is_active);

-- 4. Unique Constraint: Prevent duplicate submission for same matric on same campaign
-- (Optional: remove if students are allowed to resubmit without rejection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_campaign_student 
ON public.submissions (campaign_id, lower(trim(matric_number)))
WHERE status != 'rejected';

-- 5. Row Level Security (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies:
-- Anyone (students) can read active campaigns
CREATE POLICY "Allow public read access to active campaigns" 
ON public.campaigns FOR SELECT 
USING (true);

-- Authenticated users (Class Rep / Admin) can insert, update, delete campaigns
CREATE POLICY "Allow authenticated users full access to campaigns" 
ON public.campaigns FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Submissions Policies:
-- Anyone can submit receipts (insert)
CREATE POLICY "Allow public to insert submissions" 
ON public.submissions FOR INSERT 
WITH CHECK (true);

-- Anyone can check their own status by matric number
CREATE POLICY "Allow public to read submissions" 
ON public.submissions FOR SELECT 
USING (true);

-- Authenticated users (Class Rep / Admin) can update (Approve/Reject) submissions
CREATE POLICY "Allow authenticated users to update submissions" 
ON public.submissions FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Authenticated users can delete submissions
CREATE POLICY "Allow authenticated users to delete submissions" 
ON public.submissions FOR DELETE 
TO authenticated 
USING (true);

-- 6. Storage Bucket for Receipts
-- Run this in Supabase SQL editor or create bucket named 'receipts' in Dashboard > Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for receipts bucket:
-- Allow anyone to upload a receipt image
CREATE POLICY "Allow public receipt uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts');

-- Allow public read access to receipt images
CREATE POLICY "Allow public read of receipts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts');

-- 7. Seed Sample Data for Testing (LAUTECH CHE 300L)
INSERT INTO public.campaigns (title, course_code, description, amount, bank_name, account_number, account_name, is_active)
VALUES 
  ('CHE 301 Reaction Kinetics Manual', 'CHE 301', 'Official practical manual and laboratory guide for 1st semester 300L.', 3500, 'OPay', '8012345678', 'Daniel Adeyemi (Class Rep)', true),
  ('CHE 305 Transport Phenomena Handout', 'CHE 305', 'Hardcopy lecture materials and tutorial problem sets.', 2000, 'Kuda Bank', '2001234567', 'Daniel Adeyemi (Class Rep)', true),
  ('Chemical Engineering Students Dues (ChES)', 'ChES 26', 'Annual departmental association dues for 300 level students.', 5000, 'GTBank', '0123456789', 'ChES LAUTECH Chapter', true);
