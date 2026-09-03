'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { computeDepartmentBreakdowns } from '@/lib/computationEngine';
import { fetchAllCases } from '@/lib/dataService';
import { Layers, Activity, Users, DollarSign, Clock, UserCheck, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function DepartmentsPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [activeTab, setActiveTab] = useState<'hemo' | 'nicu_icu' | 'btl_fp'>('hemo');

  const isDoctorRole = user?.role === 'doctor';

  const loadData = async () => {
    const data = await fetchAllCases();
    setCases(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const targetCases = useMemo(() => {
    return cases.filter(c => selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month);
  }, [cases, selectedMonth]);

  const depts = useMemo(() => {
    return computeDepartmentBreakdowns(targetCases);
  }, [targetCases]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              SPECIALIZED DEPARTMENT FORMULAS
            </span>
            <span className="text-xs text-slate-500">Period: <strong className="text-purple-700">{selectedMonth}</strong></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Department Shares & Pro-Rata Allocations</h1>
          <p className="text-sm text-slate-500">
            Formula breakdown for Hemodialysis (Minutes/Rate), NICU/ICU Pro-rata, and Family Planning Teams.
          </p>
        </div>

        {isDoctorRole && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Read-Only View</span>
          </div>
        )}
      </div>

      {/* Department Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('hemo')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'hemo' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Hemodialysis (Rate per Min Sharing)
        </button>

        <button
          onClick={() => setActiveTab('nicu_icu')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'nicu_icu' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          NICU & ICU (Pro-Rata Hours)
        </button>

        <button
          onClick={() => setActiveTab('btl_fp')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'btl_fp' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          BTL & Family Planning (1/11 Split)
        </button>
      </div>

      {/* 1. HEMODIALYSIS TAB */}
      {activeTab === 'hemo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total Hemo Cases</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{depts.hemoSummary.totalCases} sessions</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total IM Minutes</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{depts.hemoSummary.totalMinutes.toLocaleString()} mins</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total HEMO-IM Pool</span>
              <p className="text-2xl font-bold text-indigo-700 mt-1">₱{depts.hemoSummary.totalHemoImPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm">
              <span className="text-xs font-bold uppercase text-purple-900">Computed Rate per Min</span>
              <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">₱{depts.hemoSummary.ratePerMinute.toFixed(5)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
              Hemodialysis Attending Physician Breakdown (=Minutes * Rate/Min)
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-3">Attending Physician</th>
                  <th className="p-3 text-center">Assigned Minutes</th>
                  <th className="p-3 text-right">Computed Rate</th>
                  <th className="p-3 text-right font-bold text-purple-700">Gross Share (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {depts.hemoPhysicians.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{p.doctorName}</td>
                    <td className="p-3 text-center font-mono">{p.minutes} mins</td>
                    <td className="p-3 text-right font-mono text-slate-500">₱{depts.hemoSummary.ratePerMinute.toFixed(5)}</td>
                    <td className="p-3 text-right font-bold font-mono text-purple-700">₱{p.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. NICU & ICU TAB */}
      {activeTab === 'nicu_icu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Specialist Deduction</span>
              <p className="text-xl font-bold text-slate-900 mt-1">Dr. Kurt Peter Rosell</p>
              <p className="text-xs text-purple-700 font-medium">₱1,000.00 fixed per patient</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total Duty Hours</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{depts.nicuIcuSummary.totalHours} hrs</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Net Pro-Rata Pool</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">₱{depts.nicuIcuSummary.netPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
              NICU & ICU Duty Doctor Hourly Distribution (=Pool * Hours / TotalHours)
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3 text-center">Duty Hours</th>
                  <th className="p-3 text-right">Pro-Rata Percentage</th>
                  <th className="p-3 text-right font-bold text-emerald-700">Allocated Share (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {depts.nicuIcuPhysicians.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{p.doctorName}</td>
                    <td className="p-3 text-center font-mono">{p.hours} hrs</td>
                    <td className="p-3 text-right font-mono text-slate-500">{p.percentage.toFixed(2)}%</td>
                    <td className="p-3 text-right font-bold font-mono text-emerald-700">₱{p.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BTL & FAMILY PLANNING TAB */}
      {activeTab === 'btl_fp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total BTL-FP Pool</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">₱{depts.btlFpSummary.totalPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Active Team Members</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">11 Members (Equal 1/11th Share)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
              Family Planning Team Equal 1/11th Distribution (=TotalPool / 11)
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-3">Team Member Name</th>
                  <th className="p-3 text-center">Division Ratio</th>
                  <th className="p-3 text-right font-bold text-purple-700">Individual Share (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {depts.btlFpPhysicians.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-center font-mono">1/11th</td>
                    <td className="p-3 text-right font-bold font-mono text-purple-700">₱{p.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}