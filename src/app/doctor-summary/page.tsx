'use client';

import React, { useState, useMemo } from 'react';
import initialData from '@/lib/initialData.json';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem, DoctorSummaryItem } from '@/types';
import { computeDoctorSummary } from '@/lib/computationEngine';
import { exportDoctorSummaryToPdf } from '@/lib/exportUtils';
import { Search, Download, Printer, Users, DollarSign, FileText, Calendar } from 'lucide-react';

export default function DoctorSummaryPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases] = useState<CaseItem[]>(initialData.casesData as CaseItem[]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorForSlip, setSelectedDoctorForSlip] = useState<DoctorSummaryItem | null>(null);

  const isDoctorRole = user?.role === 'doctor';
  const doctorName = user?.doctorName || '';

  // Compute doctor summaries
  const doctorSummaries = useMemo(() => {
    return computeDoctorSummary(cases);
  }, [cases]);

  // Filtered summaries
  const filteredDoctors = useMemo(() => {
    return doctorSummaries.filter(d => {
      const matchesDoctorRole = !isDoctorRole || d.doctorName.includes(doctorName);
      const matchesSearch = d.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDoctorRole && matchesSearch;
    });
  }, [doctorSummaries, isDoctorRole, doctorName, searchTerm]);

  const totalGross = filteredDoctors.reduce((acc, d) => acc + d.grossPf, 0);
  const totalWtax = filteredDoctors.reduce((acc, d) => acc + d.wtax20, 0);
  const totalNet = filteredDoctors.reduce((acc, d) => acc + d.netPf, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> PERIOD: {selectedMonth}
            </span>
            <span className="text-xs text-slate-500">Official Withholding Tax (20%) Deduction</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Doctor Professional Fee (PF) Summary</h1>
          <p className="text-sm text-slate-500">
            Calculated compensation with 20% Withholding Tax deduction (<span className="font-mono text-emerald-700">=Gross * 0.20</span>) and Net PF Payable (<span className="font-mono text-emerald-700">=Gross - Tax</span>).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDoctorSummaryToPdf(filteredDoctors, selectedMonth)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Download {selectedMonth} PDF Report
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross PF ({selectedMonth})</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">₱{totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 mt-1">Total earned before tax deduction</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">20% Withholding Tax</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">₱{totalWtax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-amber-600 mt-1">Tax withheld (=Gross * 0.20)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Net PF Payable ({selectedMonth})</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₱{totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-emerald-600 mt-1">Net payable to doctors</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search doctor name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Doctor Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-white font-semibold">
            <tr>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 min-w-[200px]">Doctor Name</th>
              <th className="p-3 min-w-[150px]">Specialty / Role</th>
              <th className="p-3 text-center">Cases</th>
              <th className="p-3 text-right">Gross PF</th>
              <th className="p-3 text-right text-amber-300">20% WTax</th>
              <th className="p-3 text-right text-emerald-300 font-bold">Net PF (Payable)</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDoctors.map((doc, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="p-3 font-bold text-slate-900">{doc.doctorName}</td>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Printable Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Doctor Payslip Modal with Active Month */}
      {selectedDoctorForSlip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">CEBU PROVINCIAL HOSPITAL - BALAMBAN</h3>
                <p className="text-xs text-slate-500">Official PhilHealth PF Sharing Payslip ({selectedMonth})</p>
              </div>
              <button
                onClick={() => setSelectedDoctorForSlip(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">{selectedDoctorForSlip.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialty:</span>
                <span className="text-slate-700">{selectedDoctorForSlip.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Period:</span>
                <span className="font-bold text-emerald-800">{selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Cases Handled:</span>
                <span className="font-bold text-slate-900">{selectedDoctorForSlip.totalCases} cases</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-100 py-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Gross PF Share:</span>
                <span className="font-bold text-slate-900">₱{selectedDoctorForSlip.grossPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Less: 20% Withholding Tax:</span>
                <span className="font-bold">- ₱{selectedDoctorForSlip.wtax20.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-emerald-700 pt-2 border-t border-slate-200">
                <span>Net PF Amount Payable:</span>
                <span>₱{selectedDoctorForSlip.netPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" /> Print Payslip
              </button>
              <button
                onClick={() => setSelectedDoctorForSlip(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}