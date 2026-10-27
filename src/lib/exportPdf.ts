import type { Submission } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportSubmissionsToPDF(
  submissions: Submission[],
  campaignTitle: string,
): Promise<{ ok: true; count: number } | { ok: false; reason: string }> {
  if (!submissions || submissions.length === 0) {
    return { ok: false, reason: 'No approved submissions to export.' };
  }

  // Sort by Matric Number
  const sorted = [...submissions].sort((a, b) =>
    a.matric_number.localeCompare(b.matric_number, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );

  const exportDate = new Date().toLocaleString('en-GB');

  // Initialize PDF (A4 size, portrait)
  const doc = new jsPDF();

  // ---- Header Block ----
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUTECH Chemical Engineering - Official Payment List', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Campaign: ${campaignTitle}`, 14, 28);
  doc.text(`Exported: ${exportDate}`, 14, 34);

  // ---- Prepare Table Data (Only S/N, Matric, and Name) ----
  const tableData = sorted.map((sub, index) => [
    index + 1, // S/N
    sub.matric_number,
    sub.full_name,
  ]);

  // ---- Generate Table ----
  autoTable(doc, {
    startY: 45, // Start table below the header text
    head: [['S/N', 'Matric Number', 'Full Name']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' }, // Emerald Green header
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 }, // S/N
      1: { cellWidth: 50 }, // Matric
      2: { cellWidth: 'auto' }, // Name (takes remaining space)
    },
    // No foot (Total) row.
  });

  // ---- Save File ----
  const safeFilename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Official_List.pdf`;
  doc.save(safeFilename);

  return { ok: true, count: sorted.length };
}