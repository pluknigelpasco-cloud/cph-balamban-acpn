'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { computeDoctorSummary } from '@/lib/computationEngine';
import { fetchAllCases, pushLocalDataToCloud, autoMigrateLocalDataToCloud } from '@/lib/dataService';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, Users, DollarSign, TrendingUp, Activity, ArrowRight, Calendar, Stethoscope, FileText, CheckCircle2, RefreshCw, Cloud, CloudUpload, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsSyncing(true);
    await autoMigrateLocalDataToCloud();
    const data = await fetchAllCases();
    setCases(data);
    setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Uploading and syncing data with Supabase Cloud Database...');
    const res = await pushLocalDataToCloud();
    const freshData = await fetchAllCases();
    setCases(freshData);
    setIsSyncing(false);
    setSyncStatusMessage(`✓ Successfully synchronized ${freshData.length} cases to Cloud! All browsers and devices are now updated.`);
    setTimeout(() => setSyncStatusMessage(null), 5000);
  };

  const isDoctorRole = user?.role === 'doctor';
  const doctorName = user?.doctorName || '';

  // Filter actual cases by active month
  const currentMonthCases = useMemo(() => {
    return cases.filter(c => {
      const matchesMonth = selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month;
      if (!isDoctorRole) return matchesMonth;
      const matchesDoc = (c.surgeon && c.surgeon.includes(doctorName)) ||
                         (c.anesth && c.anesth.includes(doctorName)) ||
                         (c.imPediaGp && c.imPediaGp.includes(doctorName));
      return matchesMonth && matchesDoc;
    });
  }, [cases, selectedMonth, isDoctorRole, doctorName]);

  // Doctor Personal Summary
  const doctorSummary = useMemo(() => {
    if (!isDoctorRole) return null;
    const summaries = computeDoctorSummary(cases.filter(c => selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month));
    return summaries.find(s => s.doctorName.includes(doctorName)) || {
      doctorName,
      specialty: 'Attending Physician',
      totalCases: currentMonthCases.length,
      grossPf: 0,
      wtax20: 0,
      netPf: 0
    };
  }, [isDoctorRole, cases, doctorName, selectedMonth, currentMonthCases]);

  // Admin computations
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
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isDoctorRole ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {isDoctorRole ? 'DOCTOR PERSONAL PORTAL' : 'PHILHEALTH ACPN ACTIVE'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              MONTH: {selectedMonth}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 flex items-center gap-1 border border-sky-200">
              <Cloud className="w-3 h-3 text-sky-600" />
              Supabase Cloud Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isDoctorRole ? `Welcome, ${doctorName || user?.name}` : 'Cebu Provincial Hospital - Balamban'}
          </h1>
          <p className="text-sm text-slate-500">
            {isDoctorRole
              ? `Personal Professional Fee & Compensation Summary for ${selectedMonth}`
              : `Auto Credit Payment Notice (ACPN) & Doctor PF Sharing Dashboard | Logged in as ${user?.name} (${user?.role})`
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCloudSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold shadow-sm transition"
            title="Sync all cases with Supabase Cloud Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Cloud Database'}
          </button>

          {!isDoctorRole && (
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <UploadCloud className="w-4 h-4" />
              Upload ACPN PDF
            </Link>
          )}

          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isDoctorRole ? `My Cases (${totalCasesCount})` : `View Cases (${totalCasesCount})`}
          </Link>
        </div>
      </div>

      {/* Cloud Sync Notification Banner */}
      {syncStatusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{syncStatusMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      {isDoctorRole ? (
        // DOCTOR PERSONAL KPI CARDS
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Handled Cases</span>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{totalCasesCount} cases</p>
            <p className="text-xs text-slate-500 mt-1">Cases assigned to you in {selectedMonth}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Gross PF Share</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ₱{(doctorSummary?.grossPf || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Your total earned before tax</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Less: 20% WTax</span>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-2">
              ₱{(doctorSummary?.wtax20 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-1">Withholding tax (=Gross * 0.20)</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">My Net PF Payable</span>
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">
              ₱{(doctorSummary?.netPf || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-1">Official take-home amount</p>
          </div>
        </div>
      ) : (
        // ADMIN KPI CARDS
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
      )}

      {/* Doctor Action Box or Admin Breakdown */}
      {isDoctorRole ? (
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-xl shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                CONFIDENTIAL COMPENSATION SUMMARY
              </span>
              <h2 className="text-xl font-bold mt-2">Personal Payslip & Compensation for {selectedMonth}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                All cases, departmental shares, and tax withholdings computed specifically for <strong className="text-emerald-400">{doctorName}</strong>.
              </p>
            </div>
            <Link
              href="/doctor-summary"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition shrink-0"
            >
              <FileText className="w-4 h-4" /> View & Print My Payslip
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Total Handled</span>
              <p className="text-base font-bold text-white mt-0.5">{totalCasesCount} Claims</p>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Gross PF</span>
              <p className="text-base font-bold text-white mt-0.5">₱{(doctorSummary?.grossPf || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-emerald-900/40 p-3 rounded-lg border border-emerald-700/50">
              <span className="text-emerald-400 text-[10px] uppercase font-bold">Net Take-Home</span>
              <p className="text-base font-extrabold text-emerald-300 mt-0.5">₱{(doctorSummary?.netPf || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      ) : (
        // Admin Breakdown Banner
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
      )}
    </div>
  );
}