'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, Users, DollarSign, TrendingUp, Activity, ArrowRight, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);

  // Load actual cases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cph_cases_data');
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Filter actual cases by active month
  const currentMonthCases = useMemo(() => {
    return cases.filter(c => {
      return selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month;
    });
  }, [cases, selectedMonth]);

  // Compute 100% dynamic KPIs from actual data
  const totalCasesCount = currentMonthCases.length;
  const totalGrossPF = currentMonthCases.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalPool = currentMonthCases.reduce((sum, c) => sum + (c.forPool || 0), 0);
  const totalSharingGross = currentMonthCases.reduce((sum, c) => sum + (c.balance || 0), 0);
  const medicalShare = totalSharingGross * 0.5;
  const nonMedicalShare = totalSharingGross * 0.5;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              PHILHEALTH ACPN ACTIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              MONTH: {selectedMonth}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Cebu Provincial Hospital - Balamban</h1>
          <p className="text-sm text-slate-500">
            Auto Credit Payment Notice (ACPN) & Doctor PF Sharing Dashboard | Logged in as <strong className="text-slate-800">{user?.name}</strong> ({user?.role})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <UploadCloud className="w-4 h-4" />
            Upload ACPN PDF
          </Link>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            View {selectedMonth} Cases ({totalCasesCount})
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{selectedMonth} Cases</span>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCasesCount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Verified claims in period</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{selectedMonth} Total PF</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₱{totalGrossPF.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Master PF Gross from uploads</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hospital Pool Fund</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₱{totalPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-1">Retained hospital pool</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Sharing Pool</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₱{totalSharingGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-purple-600 font-medium mt-1">Medical + Non-Medical splits</p>
        </div>
      </div>

      {/* Sharing Allocation Breakdown Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">50% For Medical Pool ({selectedMonth})</h2>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              50.00% Share
            </span>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-emerald-400">
            ₱{medicalShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-300 mt-1">Allocated to doctors, surgeons, anesth, pedia, IM, hemo, FP team</p>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Tax rule applied:</span>
            <span className="text-emerald-300 font-semibold">20% Withholding Tax automatically deducted</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-900 to-slate-900 text-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">50% For Non-Medical Pool ({selectedMonth})</h2>
            <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-medium border border-sky-500/30">
              50.00% Share
            </span>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-sky-400">
            ₱{nonMedicalShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-300 mt-1">Hospital staff, administrative, nursing, and support personnel pool</p>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Hospital Facility:</span>
            <span className="text-sky-300 font-semibold">Cebu Provincial Hospital - Balamban</span>
          </div>
        </div>
      </div>

      {totalCasesCount === 0 && (
        <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">No ACPN claims uploaded yet for {selectedMonth}</p>
          <p className="text-xs text-slate-500">
            Upload your official PhilHealth ACPN PDF for {selectedMonth} to view exact amounts, cases, and doctor payouts.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition mt-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload {selectedMonth} ACPN PDF
          </Link>
        </div>
      )}
    </div>
  );
}