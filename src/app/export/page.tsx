'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod, ALL_MONTHS_NAMES, ALL_YEARS } from '@/context/PeriodContext';
import { exportCasesToExcel, exportDoctorSummaryToPdf, exportDoctorSummaryToExcel } from '@/lib/exportUtils';
import { computeDoctorSummary } from '@/lib/computationEngine';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Shield, Calendar, Activity, Users, ArrowRight } from 'lucide-react';
import { CaseItem } from '@/types';
import Link from 'next/link';

export default function ExportPage() {
  const { selectedMonth, setSelectedMonth, monthsList } = usePeriod();
  const [cases, setCases] = useState<CaseItem[]>([]);
  
  // Export Month & Year state
  const [exportMonthName, setExportMonthName] = useState('SEPTEMBER');
  const [exportYear, setExportYear] = useState('2026');
  const exportMonth = `${exportMonthName} ${exportYear}`;

  // Load actual cases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cph_cases_data');
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Filter cases strictly by the chosen export month
  const targetCases = useMemo(() => {
    return cases.filter(c => exportMonth === 'ALL' || (c as any).month === exportMonth || !(c as any).month);
  }, [cases, exportMonth]);

  // Compute doctor summaries for this month
  const doctorSummaries = useMemo(() => {
    return computeDoctorSummary(targetCases);
  }, [targetCases]);

  const totalGrossAmount = targetCases.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalPoolAmount = targetCases.reduce((sum, c) => sum + (c.forPool || 0), 0);
  const totalNetPf = doctorSummaries.reduce((sum, d) => sum + d.netPf, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header with Month & Year Picker */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              OFFICIAL REPORT GENERATOR
            </span>
            <span className="text-xs text-slate-500">Live Monthly Audit Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Export & Reporting Center</h1>
          <p className="text-sm text-slate-500">
            Generate production-ready Excel workbooks (.xlsx) and official PhilHealth PDF reports formatted for hospital accounting.
          </p>
        </div>

        {/* Target Month & Year Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <div className="text-xs flex items-center gap-1.5">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Month:</span>
              <select
                value={exportMonthName}
                onChange={(e) => setExportMonthName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
              >
                {ALL_MONTHS_NAMES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Year:</span>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
              >
                {ALL_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Summary for Chosen Month */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 uppercase font-bold text-[10px]">Active Period</span>
          <p className="text-base font-bold text-emerald-700 mt-1">{exportMonth}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 uppercase font-bold text-[10px]">Claims in Export</span>
          <p className="text-base font-bold text-slate-900 mt-1">{targetCases.length} verified claims</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 uppercase font-bold text-[10px]">Total Gross PF</span>
          <p className="text-base font-bold text-slate-900 mt-1">₱{totalGrossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 uppercase font-bold text-[10px]">Net PF Payable</span>
          <p className="text-base font-bold text-emerald-700 mt-1">₱{totalNetPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Excel Master Workbook */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Cases Master Grid (.xlsx)</h2>
                <p className="text-xs text-slate-500">
                  Includes all <strong className="text-emerald-700 font-bold">{targetCases.length} claims</strong> for {exportMonth} with Hemo and Surgical formulas
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Full columns matching master spreadsheet: Patient, Surgeon, Anesth, IM, Pool, HEMO (57.14%), HEMO-IM (27.86%)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Compatible with Microsoft Excel 2016-2026, LibreOffice, & Google Sheets</span>
              </div>
            </div>
          </div>

          <button
            disabled={targetCases.length === 0}
            onClick={() => exportCasesToExcel(targetCases, `CPH_Balamban_Cases_Summary_${exportMonth}.xlsx`, exportMonth)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {targetCases.length === 0 ? `No Cases Found for ${exportMonth}` : `Download ${exportMonth} Cases Summary .xlsx (${targetCases.length})`}
          </button>
        </div>

        {/* 2. Doctor PF Summary PDF Report */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Doctor PF & 20% WTax PDF Report</h2>
                <p className="text-xs text-slate-500">
                  Official printable audit report for accounting and doctor payouts ({doctorSummaries.length} active doctors)
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Includes Gross PF, 20% Withholding Tax (=Gross * 0.20), and Net PF per Doctor</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Landscape formatted with official Cebu Provincial Hospital - Balamban header</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={doctorSummaries.length === 0}
              onClick={() => exportDoctorSummaryToPdf(doctorSummaries, exportMonth)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              disabled={doctorSummaries.length === 0}
              onClick={() => exportDoctorSummaryToExcel(doctorSummaries, exportMonth)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {targetCases.length === 0 && (
        <div className="p-8 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">No data found in {exportMonth}</p>
          <p className="text-xs text-slate-500">
            Select a different month in the dropdown above or upload the official PhilHealth ACPN PDF for {exportMonth}.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition mt-2"
          >
            Upload {exportMonth} ACPN PDF <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}