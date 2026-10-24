import { supabase, isSupabaseConfigured } from './supabase';
import type { Campaign, Submission, SubmissionStatus } from '../types';
import { INITIAL_CAMPAIGNS, INITIAL_SUBMISSIONS } from './mockData';

const LOCAL_STORAGE_KEY_CAMPAIGNS = 'deptpay_campaigns_v1';
const LOCAL_STORAGE_KEY_SUBMISSIONS = 'deptpay_submissions_v1';

// Initialize localStorage fallback
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

// 1. Fetch all campaigns
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

// 2. Create a new campaign
export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
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

// 3. Toggle Campaign Status
export async function toggleCampaignStatus(id: string, is_active: boolean): Promise<void> {
  if (!isSupabaseConfigured) {
    const list = getLocalCampaigns().map(c => c.id === id ? { ...c, is_active } : c);
    saveLocalCampaigns(list);
    return;
  }
  const { error } = await supabase
    .from('campaigns')
    .update({ is_active })
    .eq('id', id);

  if (error) throw error;
}

// 4. Fetch Submissions (for Admin Dashboard)
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
    return getLocalSubmissions();
  }
  return data || [];
}

// 5. Check Student Submissions by Matric Number
export async function getSubmissionsByMatric(matric: string): Promise<Submission[]> {
  const normalizedMatric = matric.trim().toLowerCase();
  
  if (!isSupabaseConfigured) {
    const subs = getLocalSubmissions();
    const camps = getLocalCampaigns();
    const campMap = new Map(camps.map(c => [c.id, c]));

    return subs
      .filter(s => s.matric_number.trim().toLowerCase() === normalizedMatric)
      .map(s => ({ ...s, campaign: campMap.get(s.campaign_id) }));
  }

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      campaign:campaigns(*)
    `)
    .ilike('matric_number', normalizedMatric)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 6. Submit a Receipt
export async function submitReceipt(
  campaignId: string,
  fullName: string,
  matricNumber: string,
  phoneNumber: string,
  receiptFile: File
): Promise<Submission> {
  // Compress image on mobile/browser to save data and bandwidth
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

  let receiptUrl = '';

  if (!isSupabaseConfigured) {
    // In mock mode, convert image to Base64 or object URL for local storage demo
    receiptUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(compressedFile);
    });

    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      campaign_id: campaignId,
      full_name: fullName.trim(),
      matric_number: matricNumber.trim().toUpperCase(),
      phone_number: phoneNumber.trim(),
      receipt_url: receiptUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const current = getLocalSubmissions();
    saveLocalSubmissions([newSub, ...current]);
    return newSub;
  }

  // Live Supabase Storage Upload
  const fileExt = receiptFile.name.split('.').pop();
  const fileName = `${Date.now()}_${matricNumber.replace(/\//g, '_')}.${fileExt}`;
  const filePath = `receipts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, compressedFile);

  if (uploadError) {
    throw new Error(`Receipt upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath);

  receiptUrl = publicUrlData.publicUrl;

  const { data, error: insertError } = await supabase
    .from('submissions')
    .insert([
      {
        campaign_id: campaignId,
        full_name: fullName.trim(),
        matric_number: matricNumber.trim().toUpperCase(),
        phone_number: phoneNumber.trim(),
        receipt_url: receiptUrl,
        status: 'pending',
      },
    ])
    .select(`
      *,
      campaign:campaigns(*)
    `)
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('A receipt has already been submitted for this matric number under this item.');
    }
    throw insertError;
  }

  return data;
}

// 7. Update Submission Status (Approve / Reject)
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

  const { error } = await supabase
    .from('submissions')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
      reviewed_at: reviewedAt,
    })
    .eq('id', submissionId);

  if (error) throw error;
}
