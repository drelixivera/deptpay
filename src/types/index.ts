export interface ClassInfo {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  class_id: string;
  role: string;
}

export interface Campaign {
  id: string;
  class_id: string; // <-- NEW
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
  class_id: string; // <-- NEW
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