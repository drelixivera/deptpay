import type { Submission } from '../types';

/**
 * Export approved submissions to an Excel file.
 * Returns a result object so the caller can decide what toast to show.
 *
 * The caller is responsible for filtering to approved rows only — this
 * function does not fall back to any other status. If you pass it pending
 * rows, they will appear in the file. Filter before calling.
 */
export async function exportSubmissionsToExcel(
  submissions: Submission[],
  campaignTitle: string,
): Promise<{ ok: true; count: number } | { ok: false; reason: string }> {
  if (!submissions || submissions.length === 0) {
    return { ok: false, reason: 'No approved submissions to export.' };
  }

  // Dynamically load XLSX only when the user clicks the export button.
  const XLSX = await import('xlsx');

  // Sort by Matric Number for lecturers (e.g. 20/4001, 20/4002...).
  const sorted = [...submissions].sort((a, b) =>
    a.matric_number.localeCompare(b.matric_number, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );

  const totalAmount = sorted.reduce(
    (sum, s) => sum + (s.campaign?.amount || 0),
    0,
  );

  const exportDate = new Date().toLocaleString('en-GB');

  // ---- Data rows ----------------------------------------------------------
  const formattedData = sorted.map((sub, index) => ({
    'S/N': index + 1,
    'Matric Number': sub.matric_number,
    'Full Name': sub.full_name,
    'Payment Item': sub.campaign?.title || campaignTitle,
    'Amount (NGN)': sub.campaign?.amount || 0,
    'Phone / WhatsApp': sub.phone_number || 'N/A',
    Status: sub.status.toUpperCase(),
    'Submission Date': new Date(sub.created_at).toLocaleDateString('en-GB'),
    'Approval Date': sub.reviewed_at
      ? new Date(sub.reviewed_at).toLocaleDateString('en-GB')
      : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData, {
    origin: 'A7', // leave rows 1-6 for the header block
  } as any);

  // ---- Header block (rows 1-5) -------------------------------------------
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [campaignTitle],
      ['Department of Chemical Engineering • CHE 300L • LAUTECH'],
      [''],
      [`Total Collected: ₦${totalAmount.toLocaleString()}`],
      [`Total Approved Students: ${sorted.length}`],
      [`Exported: ${exportDate}`],
    ],
    { origin: 'A1' },
  );

  // Merge the title across all columns for a clean look.
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // row 1 (title)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // row 2 (subtitle)
  ];

  // ---- Column widths ------------------------------------------------------
  worksheet['!cols'] = [
    { wch: 6 },  // S/N
    { wch: 16 }, // Matric
    { wch: 30 }, // Full Name
    { wch: 34 }, // Payment Item
    { wch: 15 }, // Amount
    { wch: 18 }, // Phone
    { wch: 14 }, // Status
    { wch: 16 }, // Submission Date
    { wch: 16 }, // Approval Date
  ];

  // ---- Totals row at the bottom ------------------------------------------
  const bottomRowIndex = 7 + formattedData.length; // 6 header rows + 1 for col headers
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [
        '',
        '',
        '',
        'TOTAL',
        totalAmount,
        '',
        '',
        '',
        '',
      ],
    ],
    { origin: `A${bottomRowIndex}` },
  );

  // Bold the total row (XLSX doesn't support rich styling natively, but
  // the label alone makes it stand out in any spreadsheet app).
  worksheet[`D${bottomRowIndex}`] = {
    t: 's',
    v: 'TOTAL',
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Students');

  const safeFilename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Official_List.xlsx`;
  XLSX.writeFile(workbook, safeFilename);

  return { ok: true, count: sorted.length };
}