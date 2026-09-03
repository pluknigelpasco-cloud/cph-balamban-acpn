'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { computeDoctorSummary } from '@/lib/computationEngine';
import { fetchAllCases } from '@/lib/dataService';
import { Search, Download, Printer, UserCheck, ShieldCheck, FileText, CheckCircle2, ChevronRight, X, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { exportDoctorSummaryToPdf, exportDoctorSummaryToExcel } from '@/lib/exportUtils';
import OfficialLetterhead from '@/components/OfficialLetterhead';
import Link from 'next/link';

export default function DoctorSummaryPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorForSlip, setSelectedDoctorForSlip] = useState<any | null>(null);
  const [signatories, setSignatories] = useState({
    preparedByName: 'EDILOU',
    preparedByTitle: 'Billing & Claims In-Charge',
    chiefOfHospitalName: 'OLIVIA A. DANDAN, MD., MPH',
    chiefOfHospitalTitle: 'Chief of Hospital II'
  });

  const loadData = async () => {
    const data = await fetchAllCases();
    setCases(data);

    const savedSig = localStorage.getItem('cph_hospital_signatories');
    if (savedSig) {
      try { setSignatories(JSON.parse(savedSig)); } catch (e) {}
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDoctorRole = user?.role === 'doctor';
  const loggedInDoctorName = user?.doctorName || '';

  // Filter cases strictly by active month
  const targetCases = useMemo(() => {
    return cases.filter(c => selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month);
  }, [cases, selectedMonth]);

  const allDoctorSummaries = useMemo(() => {
    return computeDoctorSummary(targetCases);
  }, [targetCases]);

  // If logged in as Doctor, only display that doctor's summary
  const visibleDoctors = useMemo(() => {
    if (isDoctorRole && loggedInDoctorName) {
      const match = allDoctorSummaries.filter(d => d.doctorName.toLowerCase().includes(loggedInDoctorName.toLowerCase()));
      if (match.length > 0) return match;
      return [{
        doctorName: loggedInDoctorName,
        specialty: 'Attending Physician',
        totalCases: 0,
        grossPf: 0,
        wtax20: 0,
        netPf: 0
      }];
    }
    return allDoctorSummaries;
  }, [allDoctorSummaries, isDoctorRole, loggedInDoctorName]);

  const filteredDoctors = useMemo(() => {
    return visibleDoctors.filter(d =>
      d.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visibleDoctors, searchTerm]);

  const totalGrossAll = visibleDoctors.reduce((a, b) => a + b.grossPf, 0);
  const totalTaxAll = visibleDoctors.reduce((a, b) => a + b.wtax20, 0);
  const totalNetAll = visibleDoctors.reduce((a, b) => a + b.netPf, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isDoctorRole ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {isDoctorRole ? 'MY CONFIDENTIAL PAYSLIP' : 'DOCTOR PF SHARING & TAXES'}
            </span>
            <span className="text-xs text-slate-500">Period: <strong className="text-emerald-700">{selectedMonth}</strong></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isDoctorRole ? 'My Professional Fee & 20% WTax' : 'Doctor PF & 20% Withholding Tax Summary'}
          </h1>
          <p className="text-sm text-slate-500">
            {isDoctorRole
              ? 'Official monthly breakdown of your verified claims and net payable professional fee.'
              : 'Official monthly summary of Gross PF earned, 20% creditable tax withholding, and Net PF payable.'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isDoctorRole && (
            <>
              <button
                disabled={visibleDoctors.length === 0}
                onClick={() => exportDoctorSummaryToPdf(visibleDoctors, selectedMonth)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF Report
              </button>
              <button
                disabled={visibleDoctors.length === 0}
                onClick={() => exportDoctorSummaryToExcel(visibleDoctors, selectedMonth)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isDoctorRole ? 'My Total Gross PF' : 'Total Gross Doctor PF'}
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">₱{totalGrossAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sum of all earned shares</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            {isDoctorRole ? 'My 20% Withholding Tax' : 'Total 20% Withholding Tax'}
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1">₱{totalTaxAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Official 20% tax deduction</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            {isDoctorRole ? 'My Net PF Payable' : 'Total Net PF Payable'}
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₱{totalNetAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">Net amount disbursed to doctors</p>
        </div>
      </div>

      {/* Doctor Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {!isDoctorRole && (
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search physician name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredDoctors.length}</strong> active physicians
            </span>
          </div>
        )}

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-center w-12">#</th>
              <th className="p-3">Doctor / Physician Name</th>
              <th className="p-3">Designation / Role</th>
              <th className="p-3 text-center">Verified Cases</th>
              <th className="p-3 text-right">Gross PF (₱)</th>
              <th className="p-3 text-right text-amber-700">Less: 20% WTax (₱)</th>
              <th className="p-3 text-right text-emerald-700">Net PF Payable (₱)</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDoctors.map((doc, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-50 text-emerald-700">🩺</span>
                  {doc.doctorName}
                </td>
                <td className="p-3 text-slate-600">{doc.specialty}</td>
                <td className="p-3 text-center font-mono font-medium text-slate-700">{doc.totalCases}</td>
                <td className="p-3 text-right font-semibold text-slate-900">
                  ₱{doc.grossPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right font-medium text-amber-700">
                  ₱{doc.wtax20.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right font-bold text-emerald-700">
                  ₱{doc.netPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedDoctorForSlip(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Printable Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Doctor Payslip Modal with Official LETTERHEAD NEW 2026 */}
      {selectedDoctorForSlip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print-modal-backdrop">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 print-container">
            {/* Modal Screen Top Bar (Hidden in Print) */}
            <div className="no-print flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Official PhilHealth Payslip Voucher
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href="/settings"
                  className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                >
                  <SettingsIcon className="w-3.5 h-3.5" /> Edit Signatories
                </Link>
                <button
                  onClick={() => setSelectedDoctorForSlip(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official LETTERHEAD NEW 2026 Header with Official Logos */}
            <OfficialLetterhead />

            {/* Official Document Sub-Header Placed Below Letterhead Line */}
            <div className="text-center my-2.5">
              <h3 className="inline-block text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                PHILHEALTH PROFESSIONAL FEE (ACPN) COMPENSATION VOUCHER
              </h3>
            </div>

            {/* Doctor & Period Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Physician Name:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDoctorForSlip.doctorName}</p>
                <p className="text-[11px] text-slate-600 font-medium">{selectedDoctorForSlip.specialty}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Period Covered:</span>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">{selectedMonth}</p>
                <p className="text-[11px] text-slate-600 font-mono">Verified Claims: {selectedDoctorForSlip.totalCases} cases</p>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-xs border border-slate-300 rounded overflow-hidden mb-6">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-3 text-left">Particulars / Compensation Breakdown</th>
                  <th className="p-3 text-right">Amount (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    Gross Professional Fee (PF) Share
                    <span className="block text-[10px] text-slate-500 font-normal">Base earned share from verified PhilHealth ACPN cases</span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 font-mono text-sm">
                    ₱{selectedDoctorForSlip.grossPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-amber-50/40 text-amber-900">
                  <td className="p-3 font-semibold">
                    Less: 20% Withholding Tax (Creditable Income Tax)
                    <span className="block text-[10px] text-amber-700 font-normal">Official deduction formula: =Gross PF * 0.20</span>
                  </td>
                  <td className="p-3 text-right font-bold font-mono text-sm text-amber-800">
                    - ₱{selectedDoctorForSlip.wtax20.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-950 border-t-2 border-slate-900 font-black">
                  <td className="p-3 text-sm font-black uppercase tracking-wide">
                    NET PROFESSIONAL FEE PAYABLE
                    <span className="block text-[10px] text-emerald-700 font-normal">Net amount to be disbursed via cheque / bank credit</span>
                  </td>
                  <td className="p-3 text-right font-black font-mono text-base text-emerald-800">
                    ₱{selectedDoctorForSlip.netPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Official Hospital Signatories - Loaded Dynamically from Settings */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs mt-4">
              <div>
                <div className="border-b border-slate-400 pb-8"></div>
                <p className="font-bold text-slate-900 mt-1 uppercase">{signatories.preparedByName || user?.name || 'EDILOU'}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{signatories.preparedByTitle || 'Billing & Claims In-Charge'}</p>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-8"></div>
                <p className="font-bold text-slate-900 mt-1">{signatories.chiefOfHospitalName || 'OLIVIA A. DANDAN, MD., MPH'}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{signatories.chiefOfHospitalTitle || 'Chief of Hospital II'}</p>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-8"></div>
                <p className="font-bold text-slate-900 mt-1 uppercase">{selectedDoctorForSlip.doctorName}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Doctor Conforme / Received By</p>
              </div>
            </div>

            {/* Screen Action Buttons (Hidden in Print) */}
            <div className="no-print flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => setSelectedDoctorForSlip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print Official Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}