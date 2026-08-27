import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CaseItem, DoctorSummaryItem } from '@/types';

export function exportCasesToExcel(cases: CaseItem[], fileName = 'CPH_BALAMBAN_CASES_SUMMARY.xlsx', period = 'JUNE 2026') {
  const wb = XLSX.utils.book_new();

  const headers = [
    '#',
    'NAME OF PATIENT',
    'SURGEON',
    'ANESTH',
    'IM / PEDIA / GP',
    'REMARK',
    'TOTAL AMOUNT',
    'FOR POOL',
    'BALANCE',
    'SURGEON (100%/70%)',
    'ANESTH (30%)',
    'HEMO (57.14%)',
    'HEMO-IM (27.86%)',
    'MONTH'
  ];

  const dataRows = cases.map((c, idx) => [
    idx + 1,
    c.patientName || '',
    c.surgeon || '',
    c.anesth || '',
    c.imPediaGp || '',
    c.remarks || '',
    c.totalAmount || 0,
    c.forPool || 0,
    c.balance || 0,
    c.surgeonShare || 0,
    c.anesthShare || 0,
    c.hemo || 0,
    c.hemoIm || 0,
    (c as any).month || period
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, `${period} CASES`);

  XLSX.writeFile(wb, fileName);
}

export function exportDoctorSummaryToExcel(doctors: DoctorSummaryItem[], period = 'JUNE 2026') {
  const wb = XLSX.utils.book_new();

  const headers = [
    '#',
    'Doctor Name',
    'Specialty / Role',
    'Total Handled Cases',
    'Gross PF Share (PHP)',
    '20% Withholding Tax (PHP)',
    'Net PF Payable (PHP)'
  ];

  const dataRows = doctors.map((d, i) => [
    i + 1,
    d.doctorName,
    d.specialty,
    d.totalCases,
    d.grossPf,
    d.wtax20,
    d.netPf
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'DOCTOR PF SUMMARY');

  XLSX.writeFile(wb, `CPH_Balamban_Doctor_PF_Summary_${period}.xlsx`);
}

export function exportDoctorSummaryToPdf(doctors: DoctorSummaryItem[], period = 'JUNE 2026') {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('CEBU PROVINCIAL HOSPITAL - BALAMBAN', 14, 15);
  doc.setFontSize(12);
  doc.text(`PHILHEALTH PROFESSIONAL FEE (PF) SUMMARY & 20% WTAX - ${period}`, 14, 23);

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
    head: [['#', 'Doctor Name', 'Role / Department', 'Cases', 'Gross PF', '20% WTax', 'Net PF Payable']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 9 }
  });

  doc.save(`CPH_Balamban_Doctor_PF_Summary_${period}.pdf`);
}