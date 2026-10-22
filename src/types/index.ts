export interface Campaign {
  id: string;
  title: string;
  course_code?: string;
  description?: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  deadline?: string;
  is_active: boolean;
  created_at: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  campaign_id: string;
  full_name: string;
  matric_number: string;
  phone_number?: string;
  receipt_url: string;
  status: SubmissionStatus;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  campaign?: Campaign;
}

export interface SubmissionFormData {
  campaign_id: string;
  full_name: string;
  matric_number: string;
  phone_number: string;
  receipt_file: File | null;
}
