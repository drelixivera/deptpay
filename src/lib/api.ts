import { supabase, isSupabaseConfigured } from './supabase';
import type { Campaign, Submission, SubmissionStatus } from '../types';
import { INITIAL_CAMPAIGNS, INITIAL_SUBMISSIONS } from './mockData';

const LOCAL_STORAGE_KEY_CAMPAIGNS = 'deptpay_campaigns_v1';
const LOCAL_STORAGE_KEY_SUBMISSIONS = 'deptpay_submissions_v1';

// -----------------------------------------------------------------------------
// Normalization
// -----------------------------------------------------------------------------

// Collapse separators and whitespace so "20-4102", "20 / 4102", "20/4102"
// all become "20/4102". Used everywhere we touch a matric number.
export function normalizeMatric(matric: string): string {
  return matric.replace(/\D/g, '');
}

// -----------------------------------------------------------------------------
// Auth (rep only)
// -----------------------------------------------------------------------------

export async function signInRep(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutRep() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export async function getCurrentRep() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// -----------------------------------------------------------------------------
// Demo-mode (localStorage) helpers
// -----------------------------------------------------------------------------

function getLocalCampaigns(): Campaign[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY_CAMPAIGNS);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
  }
  return JSON.parse(data);
}

function getLocalSubmissions(): Submission[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY_SUBMISSIONS);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }
  return JSON.parse(data);
}

function saveLocalSubmissions(subs: Submission[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY_SUBMISSIONS, JSON.stringify(subs));
}

function saveLocalCampaigns(camps: Campaign[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY_CAMPAIGNS, JSON.stringify(camps));
}

// -----------------------------------------------------------------------------
// Campaigns
// -----------------------------------------------------------------------------

export async function getCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured) {
    return getLocalCampaigns();
  }
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns from Supabase:', error);
    return getLocalCampaigns();
  }
  return data || [];
}

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'created_at'>
): Promise<Campaign> {
  if (!isSupabaseConfigured) {
    const newCamp: Campaign = {
      ...campaign,
      id: 'camp-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = getLocalCampaigns();
    saveLocalCampaigns([newCamp, ...current]);
    return newCamp;
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleCampaignStatus(id: string, is_active: boolean): Promise<void> {
  if (!isSupabaseConfigured) {
    const list = getLocalCampaigns().map(c => (c.id === id ? { ...c, is_active } : c));
    saveLocalCampaigns(list);
    return;
  }
  const { error } = await supabase
    .from('campaigns')
    .update({ is_active })
    .eq('id', id);

  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Submissions — reading
// -----------------------------------------------------------------------------

// Student-facing: fetch only *this* matric's submissions via the RPC.
export async function getMySubmissions(matric: string): Promise<Submission[]> {
  const normalized = normalizeMatric(matric);

  if (!isSupabaseConfigured) {
    const subs = getLocalSubmissions();
    const camps = getLocalCampaigns();
    const campMap = new Map(camps.map(c => [c.id, c]));

    return subs
      .filter(s => normalizeMatric(s.matric_number) === normalized)
      .map(s => ({ ...s, campaign: campMap.get(s.campaign_id) }));
  }

  const { data, error } = await supabase.rpc('get_my_submissions', {
    p_matric: normalized,
  });

  if (error) throw error;

  const camps = await getCampaigns();
  const campMap = new Map(camps.map(c => [c.id, c]));

  return (data || []).map((s: Submission) => ({
    ...s,
    campaign: campMap.get(s.campaign_id),
  }));
}

// Kept as a thin alias so StudentPortal's existing import keeps working.
export async function getSubmissionsByMatric(matric: string): Promise<Submission[]> {
  return getMySubmissions(matric);
}

// Rep-facing: fetch all submissions (or one campaign's worth).
export async function getSubmissions(campaignId?: string): Promise<Submission[]> {
  if (!isSupabaseConfigured) {
    const subs = getLocalSubmissions();
    const camps = getLocalCampaigns();
    const campMap = new Map(camps.map(c => [c.id, c]));

    let filtered = subs.map(s => ({
      ...s,
      campaign: campMap.get(s.campaign_id),
    }));

    if (campaignId && campaignId !== 'all') {
      filtered = filtered.filter(s => s.campaign_id === campaignId);
    }
    return filtered;
  }

  let query = supabase
    .from('submissions')
    .select(`
      *,
      campaign:campaigns(*)
    `)
    .order('created_at', { ascending: false });

  if (campaignId && campaignId !== 'all') {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching submissions from Supabase:', error);
    return [];
  }
  return data || [];
}

// -----------------------------------------------------------------------------
// Submissions — writing
// -----------------------------------------------------------------------------

export async function submitReceipt(
  campaignId: string,
  fullName: string,
  matricNumber: string,
  phoneNumber: string,
  receiptFile: File
): Promise<Submission> {
  const cleanMatric = normalizeMatric(matricNumber);

  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
  };
  let compressedFile = receiptFile;
  try {
    const imageCompression = (await import('browser-image-compression')).default;
    compressedFile = await imageCompression(receiptFile, options);
  } catch (err) {
    console.warn('Image compression skipped, uploading original:', err);
  }

  if (!isSupabaseConfigured) {
    const receiptUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(compressedFile);
    });

    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      campaign_id: campaignId,
      full_name: fullName.trim(),
      matric_number: cleanMatric,
      phone_number: phoneNumber.trim(),
      receipt_url: receiptUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const current = getLocalSubmissions();
    saveLocalSubmissions([newSub, ...current]);
    return newSub;
  }

  const fileExt = receiptFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}_${cleanMatric.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, compressedFile);

  if (uploadError) {
    throw new Error(`Receipt upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);

  const receiptUrl = publicUrlData.publicUrl;

    // Before inserting the new one, find if there is an existing pending submission
  // for this same student and same campaign.
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('matric_number', cleanMatric)
    .eq('status', 'pending')
    .maybeSingle();

  // If they already have a pending one, let's reject it automatically.
  if (existing) {
    await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        rejection_reason: 'Replaced by a new upload from the student.',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  }

  // Now insert the new one
  const { error: insertError } = await supabase
    .from('submissions')
    .insert([
      {
        campaign_id: campaignId,
        full_name: fullName.trim(),
        matric_number: cleanMatric,
        phone_number: phoneNumber.trim(),
        receipt_url: receiptUrl,
        status: 'pending',
      },
    ]);

  if (insertError) {
    throw insertError;
  }

  const created = await getMySubmissions(cleanMatric);
  const match = created.find(s => s.receipt_url === receiptUrl);

  if (!match) {
    throw new Error(
      'Submission saved, but could not fetch it back. Use "Track Status" to confirm.'
    );
  }

  return match;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  rejectionReason?: string
): Promise<void> {
  const reviewedAt = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const list = getLocalSubmissions().map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          status,
          rejection_reason: status === 'rejected' ? rejectionReason : undefined,
          reviewed_at: reviewedAt,
        };
      }
      return s;
    });
    saveLocalSubmissions(list);
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const reviewedBy = userData?.user?.id ?? null;

  const { error } = await supabase
    .from('submissions')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
      reviewed_at: reviewedAt,
      reviewed_by: reviewedBy,
    })
    .eq('id', submissionId);

  if (error) throw error;
}