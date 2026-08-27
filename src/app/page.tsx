'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import initialData from '@/lib/initialData.json';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, Users, DollarSign, TrendingUp, Activity, CheckCircle, ArrowRight, Layers } from 'lucide-react';

export default function DashboardPage() {
  const [cases] = useState(initialData.casesData || []);
  const [pmCases] = useState(initialData.pmData || []);

  const totalCasesCount = cases.length;
  const totalAmount = cases.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  const totalPool = cases.reduce((acc, c) => acc + (c.forPool || 0), 0);
  const totalBalance = cases.reduce((acc, c) => acc + (c.balance || 0), 0);
  
  // Total PF summary June 2026
  const totalGrossPF = 13198484.50;
  const totalORCasesGross = 7884620.00;
  const totalSharingGross = 7305277.56;
  const medicalShare = 3652638.78;
  const nonMedicalShare = 3652638.78;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              PHILHEALTH ACPN ACTIVE
            </span>
            <span className="text-xs text-slate-500">Period: JUNE / AUGUST 2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Cebu Provincial Hospital - Balamban</h1>
          <p className="text-sm text-slate-500">Auto Credit Payment Notice (ACPN) & Doctor PF Sharing Dashboard</p>
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
            View All Cases
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total OR Cases</span>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCasesCount.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Active claims processed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total PF Amount</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₱{totalGrossPF.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Master PF Gross pool</p>
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
          <p className="text-xs text-amber-600 font-medium mt-1">20% / 35% / 50% retained pool</p>
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
            <h2 className="text-lg font-bold">50% For Medical Pool</h2>
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
            <h2 className="text-lg font-bold">50% For Non-Medical Pool</h2>
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

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/upload" className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 mt-3">PDF Auto-Extraction</h3>
          <p className="text-xs text-slate-500 mt-1">Upload PHIC ACPN PDF (e.g. CPH.BALAMBAN 8.1.26-PF.pdf) to extract claims instantly.</p>
        </Link>

        <Link href="/departments" className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
              <Layers className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 mt-3">Department Formulas</h3>
          <p className="text-xs text-slate-500 mt-1">Manage Pain Management, NICU hours, HEMO minutes, Pedia-IM, and BTL team splits.</p>
        </Link>

        <Link href="/doctor-summary" className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 mt-3">Doctor PF & 20% WTax</h3>
          <p className="text-xs text-slate-500 mt-1">Generate official doctor payslips, 20% withholding tax records, and payout reports.</p>
        </Link>
      </div>
    </div>
  );
}