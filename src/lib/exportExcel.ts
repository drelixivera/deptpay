import * as XLSX from 'xlsx';
import type { Submission } from '../types';

export function exportSubmissionsToExcel(submissions: Submission[], campaignTitle: string) {
  // Filter to approved or current view
  const formattedData = submissions.map((sub, index) => ({
    'S/N': index + 1,
    'Matric Number': sub.matric_number,
    'Full Name': sub.full_name,
    'Payment Item': sub.campaign?.title || campaignTitle,
    'Amount (NGN)': sub.campaign?.amount || 0,
    'Phone / WhatsApp': sub.phone_number || 'N/A',
    'Status': sub.status.toUpperCase(),
    'Submission Date': new Date(sub.created_at).toLocaleDateString('en-GB'),
    'Approval Date': sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('en-GB') : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 6 },   // S/N
    { wch: 15 },  // Matric
    { wch: 28 },  // Full Name
    { wch: 32 },  // Payment Item
    { wch: 14 },  // Amount
    { wch: 16 },  // Phone
    { wch: 12 },  // Status
    { wch: 15 },  // Submission Date
    { wch: 15 },  // Approval Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Students');

  const safeFilename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Official_List.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
