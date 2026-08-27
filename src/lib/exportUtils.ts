import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CaseItem, DoctorSummaryItem } from '@/types';

export function exportCasesToExcel(cases: CaseItem[], fileName = 'CPH_BALAMBAN_ACPN_CASES_SUMMARY.xlsx') {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Item #', 'Patient Name', 'Surgeon', 'Anesthesiologist', 'IM/Pedia/GP', 'Remarks',
    'Total Amount', 'For Pool', 'Balance', 'Provider Total', 'After Pool & Provider',
    'Pedia Share', 'IM Share', 'After IM/Pedia', 'Surgeon Share (70%/100%)', 'Anesth Share (30%)'
  ];

  const dataRows = cases.map(c => [
    c.itemNo,
    c.patientName,
    c.surgeon,
    c.anesth,
    c.imPediaGp,
    c.remarks,
    c.totalAmount,
    c.forPool,
    c.balance,
    c.providerTotal,
    c.afterPoolProvider,
    c.pedia,
    c.im,
    c.afterImPedia,
    c.surgeonShare,
    c.anesthShare
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'CASES SUMMARY');

  XLSX.writeFile(wb, fileName);
}

export function exportDoctorSummaryToPdf(doctors: DoctorSummaryItem[], period = 'JUNE 2026') {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('CEBU PROVINCIAL HOSPITAL - BALAMBAN', 14, 15);
  doc.setFontSize(12);
  doc.text(`PHILHEALTH PROFESSIONAL FEE (PF) SUMMARY - ${period}`, 14, 23);

  const tableData = doctors.map((d, i) => [
    (i + 1).toString(),
    d.doctorName,
    d.specialty,
    d.totalCases.toString(),
    'PHP ' + d.grossPf.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    'PHP ' + d.wtax20.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    'PHP ' + d.netPf.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  ]);

  (doc as any).autoTable({
    startY: 30,
    head: [['#', 'Doctor Name', 'Role / Department', 'Cases', 'Gross PF', 'WTax (20%)', 'Net PF Payable']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9 }
  });

  doc.save(`CPH_Balamban_Doctor_PF_Summary_${period}.pdf`);
}