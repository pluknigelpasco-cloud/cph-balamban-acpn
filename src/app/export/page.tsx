'use client';

import React from 'react';
import initialData from '@/lib/initialData.json';
import { exportCasesToExcel, exportDoctorSummaryToPdf } from '@/lib/exportUtils';
import { computeDoctorSummary } from '@/lib/computationEngine';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Shield } from 'lucide-react';
import { CaseItem } from '@/types';

export default function ExportPage() {
  const cases = initialData.casesData as CaseItem[];
  const doctors = computeDoctorSummary(cases);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Export & Reporting Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate production-ready Excel workbooks (.xlsx) and official PhilHealth PDF reports formatted exactly as submitted to hospital administration and accounting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Excel Master Workbook (.xlsx)</h2>
              <p className="text-xs text-slate-500">Includes all {cases.length} cases, formulas, pool deductions, and balances</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full sheet with columns A to AD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Compatible with Microsoft Excel, LibreOffice, & Google Sheets</span>
            </div>
          </div>

          <button
            onClick={() => exportCasesToExcel(cases)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Download Complete Cases Summary .xlsx
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Doctor PF & 20% WTax PDF Report</h2>
              <p className="text-xs text-slate-500">Formal printable audit report for accounting and doctor payouts</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>Includes Gross PF, 20% WTax, and Net PF per Doctor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>Landscape formatted with official CPH Balamban headers</span>
            </div>
          </div>

          <button
            onClick={() => exportDoctorSummaryToPdf(doctors)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Download Doctor PF Summary PDF
          </button>
        </div>
      </div>
    </div>
  );
}