'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { recalculateCase, OFFICIAL_EXCEL_REMARKS } from '@/lib/computationEngine';
import { exportCasesToExcel } from '@/lib/exportUtils';
import { OFFICIAL_DOCTORS_ROSTER, sanitizeDoctorName } from '@/lib/acpnParser';
import { fetchAllCases, saveCasesToCloud, deleteCaseFromCloud, clearMonthCasesFromCloud } from '@/lib/dataService';
import { Search, Download, Plus, Archive, Trash2, RotateCcw, UploadCloud, ChevronLeft, ChevronRight, Activity, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CasesPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const loadData = async () => {
    setIsSyncing(true);
    const data = await fetchAllCases();
    const sanitized = data.map(c => recalculateCase({
      ...c,
      surgeon: sanitizeDoctorName(c.surgeon || ''),
      anesth: sanitizeDoctorName(c.anesth || ''),
      imPediaGp: sanitizeDoctorName(c.imPediaGp || '')
    }));
    setCases(sanitized);
    setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedRemark, setSelectedRemark] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const isDoctorRole = user?.role === 'doctor';
  const doctorName = user?.doctorName || '';

  // Clean deduplicated doctor options
  const doctorOptions = useMemo(() => {
    const set = new Set<string>(OFFICIAL_DOCTORS_ROSTER);
    cases.forEach(c => {
      if (c.surgeon && c.surgeon.length > 3 && !/Page|\d+/i.test(c.surgeon)) set.add(c.surgeon);
      if (c.anesth && c.anesth.length > 3 && !/Page|\d+/i.test(c.anesth)) set.add(c.anesth);
      if (c.imPediaGp && c.imPediaGp.length > 3 && !/Page|\d+/i.test(c.imPediaGp)) set.add(c.imPediaGp);
    });
    return Array.from(set).sort();
  }, [cases]);

  // Exact 19 Official Excel Remarks
  const remarkOptions = OFFICIAL_EXCEL_REMARKS;

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesMonth = selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month;
      const matchesArchive = showArchived ? (c as any).isArchived : !(c as any).isArchived;
      const matchesDoctorRole = !isDoctorRole || (c.surgeon && c.surgeon.includes(doctorName)) || (c.anesth && c.anesth.includes(doctorName)) || (c.imPediaGp && c.imPediaGp.includes(doctorName));

      const matchesSearch =
        searchTerm === '' ||
        (c.patientName && c.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.itemNo && c.itemNo.includes(searchTerm)) ||
        (c.remarks && c.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.surgeon && c.surgeon.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.anesth && c.anesth.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDoctor =
        selectedDoctor === 'ALL' ||
        c.surgeon === selectedDoctor ||
        c.anesth === selectedDoctor ||
        (c.imPediaGp && c.imPediaGp.includes(selectedDoctor));

      const matchesRemark =
        selectedRemark === 'ALL' ||
        c.remarks?.toLowerCase() === selectedRemark.toLowerCase();

      return matchesMonth && matchesArchive && matchesDoctorRole && matchesSearch && matchesDoctor && matchesRemark;
    });
  }, [cases, selectedMonth, showArchived, isDoctorRole, doctorName, searchTerm, selectedDoctor, selectedRemark]);

  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  const updateAndPersist = async (updatedCases: CaseItem[]) => {
    setCases(updatedCases);
    await saveCasesToCloud(updatedCases);
  };

  const handleUpdateRow = (id: string, field: keyof CaseItem, value: any) => {
    const updated = cases.map(item => {
      if (item.id === id) {
        const itemUpdated = { ...item, [field]: value };
        return recalculateCase(itemUpdated);
      }
      return item;
    });
    updateAndPersist(updated);
  };

  const handleToggleArchive = (id: string) => {
    const updated = cases.map(c => c.id === id ? { ...c, isArchived: !(c as any).isArchived } as any : c);
    updateAndPersist(updated);
  };

  const handleDeleteCase = async (id: string) => {
    if (confirm('Delete this case?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      await deleteCaseFromCloud(id);
    }
  };

  const handleResetMonthCases = async () => {
    if (confirm(`Are you sure you want to clear cases for ${selectedMonth} ONLY?\n(Cases in other months will remain untouched.)`)) {
      if (selectedMonth === 'ALL') {
        setCases([]);
        await clearMonthCasesFromCloud('ALL');
      } else {
        const remaining = cases.filter(c => (c as any).month !== selectedMonth);
        setCases(remaining);
        await clearMonthCasesFromCloud(selectedMonth);
      }
    }
  };

  const handleAddNewCase = (customRemark = '1D') => {
    const isHemoCase = customRemark.toLowerCase() === 'hemo';
    const newCase = recalculateCase({
      id: `case-${Date.now()}`,
      itemNo: (cases.length + 1).toString(),
      patientName: isHemoCase ? 'HEMO PATIENT' : 'NEW PATIENT',
      surgeon: isHemoCase ? 'Indo' : OFFICIAL_DOCTORS_ROSTER[0],
      anesth: '',
      imPediaGp: isHemoCase ? 'Delos Santos/Tawasil' : '',
      remarks: customRemark,
      totalAmount: isHemoCase ? 1750 : 10000,
    });
    const updated = [{ ...newCase, month: selectedMonth === 'ALL' ? 'SEPTEMBER 2026' : selectedMonth, isArchived: false } as any, ...cases];
    updateAndPersist(updated);
  };

  const sumTotalAmount = filteredCases.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  const sumForPool = filteredCases.reduce((acc, c) => acc + (c.forPool || 0), 0);
  const sumSurgeonShare = filteredCases.reduce((acc, c) => acc + (c.surgeonShare || 0), 0);
  const sumAnesthShare = filteredCases.reduce((acc, c) => acc + (c.anesthShare || 0), 0);
  const sumHemoShare = filteredCases.reduce((acc, c) => acc + (c.hemo || 0), 0);
  const sumHemoImShare = filteredCases.reduce((acc, c) => acc + (c.hemoIm || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md">
                PERIOD: {selectedMonth}
              </span>
              {showArchived && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-md">
                  ARCHIVED VIEW
                </span>
              )}
              <button
                onClick={loadData}
                title="Refresh Cloud Sync"
                className="p-1 text-slate-400 hover:text-emerald-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Cases Master Grid & Cloud Database</h1>
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-emerald-600">{filteredCases.length}</span> claims for <strong className="text-slate-800">{selectedMonth}</strong> ({remarkOptions.length} distinct Excel remark types).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {filteredCases.length > 0 && (
              <button
                onClick={handleResetMonthCases}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold border border-rose-200 transition"
                title={`Clear ${selectedMonth} cases`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear {selectedMonth} Cases
              </button>
            )}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showArchived ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived ? 'Active Cases' : 'Archived'}
            </button>
            <button
              onClick={() => handleAddNewCase('Hemo')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Activity className="w-4 h-4" /> + Add Hemo Case
            </button>
            <button
              onClick={() => handleAddNewCase('1D')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> + Add OR Case
            </button>
            <button
              onClick={() => exportCasesToExcel(filteredCases, `CPH_Balamban_Cases_${selectedMonth}.xlsx`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" /> Export .XLSX
            </button>
          </div>
        </div>

        {/* Filter Bar with exactly 19 Excel Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient, doctor, remark, #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedRemark}
              onChange={(e) => setSelectedRemark(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
            >
              <option value="ALL">🔍 All Excel Remarks (19 Types)</option>
              {remarkOptions.map((rem) => (
                <option key={rem} value={rem}>
                  {rem === 'Hemo' ? '🫘 Hemo (Hemodialysis)' :
                   rem === 'C/S' ? '👶 C/S (Cesarean)' :
                   rem === 'NICU' ? '🍼 NICU' :
                   rem === 'ICU' ? '🏥 ICU' :
                   rem === 'PM' ? '❤️ PM (Pain Management)' :
                   rem === 'BTL' ? '👥 BTL' :
                   rem === 'FP' ? '👥 FP (Family Planning)' :
                   rem === '49080' ? '💊 49080 (35% Pool)' :
                   rem === '1D' ? '📋 1D Case' :
                   rem === 'Dental' ? '🦷 Dental' :
                   rem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Doctors ({doctorOptions.length})</option>
              {doctorOptions.map((doc) => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            Filtered Total: <span className="font-bold text-slate-900 ml-1">₱{sumTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {filteredCases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Cases Grid is Clean & Ready for {selectedMonth}</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload your official PhilHealth ACPN PDF or click "+ Add Hemo Case" / "+ Add OR Case" to populate cases.
            </p>
            <div className="flex gap-2 pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                <UploadCloud className="w-4 h-4" /> Upload {selectedMonth} ACPN PDF
              </Link>
              <button
                onClick={() => handleAddNewCase('Hemo')}
                className="px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-semibold transition"
              >
                + Add Hemo Case
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-r border-slate-800 w-12 text-center">#</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[170px]">NAME OF PATIENT</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[130px]">SURGEON</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[130px]">ANESTH</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[140px]">IM / PEDIA / GP</th>
                  <th className="p-2.5 border-r border-slate-800 w-28 text-center">REMARK</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[95px] bg-slate-800">TOTAL AMOUNT</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[85px] text-amber-300">FOR POOL</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[85px]">BALANCE</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-emerald-300">SURGEON (100%/70%)</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-sky-300">ANESTH (30%)</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[95px] text-purple-300 bg-purple-950/40">HEMO (57.14%)</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[95px] text-indigo-300 bg-indigo-950/40">HEMO-IM (27.86%)</th>
                  <th className="p-2.5 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedCases.map((item, idx) => {
                  const globalRowIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isHemoRow = (item.remarks || '').toLowerCase().includes('hemo');

                  return (
                    <tr key={item.id} className={`transition ${isHemoRow ? 'bg-purple-50/30 hover:bg-purple-50/60' : 'hover:bg-emerald-50/40'}`}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500 font-bold bg-slate-50">
                        {globalRowIndex}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                        <input
                          type="text"
                          value={item.patientName}
                          onChange={(e) => handleUpdateRow(item.id, 'patientName', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.surgeon}
                          onChange={(e) => handleUpdateRow(item.id, 'surgeon', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.anesth}
                          onChange={(e) => handleUpdateRow(item.id, 'anesth', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">
                        <input
                          type="text"
                          value={item.imPediaGp}
                          onChange={(e) => handleUpdateRow(item.id, 'imPediaGp', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <select
                          value={item.remarks || '1D'}
                          onChange={(e) => handleUpdateRow(item.id, 'remarks', e.target.value)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer border ${
                            isHemoRow ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            item.remarks === 'C/S' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                            item.remarks === '49080' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {OFFICIAL_EXCEL_REMARKS.map(rem => (
                            <option key={rem} value={rem}>{rem}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50">
                        <input
                          type="number"
                          value={item.totalAmount}
                          onChange={(e) => handleUpdateRow(item.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5 font-bold"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-amber-700 font-medium">
                        ₱{item.forPool?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-semibold text-slate-800">
                        ₱{item.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">
                        {item.surgeonShare ? `₱${item.surgeonShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-sky-700">
                        {item.anesthShare ? `₱${item.anesthShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-purple-700 bg-purple-50/40">
                        {item.hemo ? `₱${item.hemo.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-indigo-700 bg-indigo-50/40">
                        {item.hemoIm ? `₱${item.hemoIm.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleToggleArchive(item.id)}
                            className="p-1 text-slate-400 hover:text-amber-600"
                            title={(item as any).isArchived ? 'Restore' : 'Archive'}
                          >
                            {(item as any).isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCase(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary Row */}
        {filteredCases.length > 0 && (
          <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
            <div className="flex items-center gap-4">
              <div>Total Claims: <span className="text-emerald-400 font-bold">{filteredCases.length}</span> ({selectedMonth})</div>
              
              <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-0.5 text-slate-300 disabled:text-slate-600 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-0.5 text-slate-300 disabled:text-slate-600 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <span>Gross: <span className="text-emerald-400">₱{sumTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Pool: <span className="text-amber-400">₱{sumForPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Surgeons: <span className="text-emerald-400">₱{sumSurgeonShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Anesth: <span className="text-sky-400">₱{sumAnesthShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              {sumHemoShare > 0 && (
                <span>HEMO (57.14%): <span className="text-purple-400">₱{sumHemoShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              )}
              {sumHemoImShare > 0 && (
                <span>HEMO-IM (27.86%): <span className="text-indigo-400">₱{sumHemoImShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}