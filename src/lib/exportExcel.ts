import type { Submission } from '../types';

export async function exportSubmissionsToExcel(submissions: Submission[], campaignTitle: string): Promise<boolean> {
  if (!submissions || submissions.length === 0) {
    return false;
  }

  // Dynamically load XLSX only when the user clicks the export button
  const XLSX = await import('xlsx');

  // Sort by Matric Number for lecturers (e.g. 20/4001, 20/4002...)
  const sortedSubmissions = [...submissions].sort((a, b) => 
    a.matric_number.localeCompare(b.matric_number, undefined, { numeric: true, sensitivity: 'base' })
  );

  const formattedData = sortedSubmissions.map((sub, index) => ({
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
    { wch: 16 },  // Matric
    { wch: 30 },  // Full Name
    { wch: 34 },  // Payment Item
    { wch: 15 },  // Amount
    { wch: 18 },  // Phone
    { wch: 14 },  // Status
    { wch: 16 },  // Submission Date
    { wch: 16 },  // Approval Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Students');

  const safeFilename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Official_List.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
  return true;
}
