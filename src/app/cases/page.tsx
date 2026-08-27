'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { useAuth } from '@/context/AuthContext';
import { CaseItem } from '@/types';
import { recalculateCase } from '@/lib/computationEngine';
import { exportCasesToExcel } from '@/lib/exportUtils';
import { Search, Download, Plus, Archive, Trash2, RotateCcw, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CasesPage() {
  const { selectedMonth } = usePeriod();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cph_cases_data');
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedRemark, setSelectedRemark] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const isDoctorRole = user?.role === 'doctor';
  const doctorName = user?.doctorName || '';

  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    cases.forEach(c => {
      if (c.surgeon) set.add(c.surgeon);
      if (c.anesth) set.add(c.anesth);
      if (c.imPediaGp) {
        c.imPediaGp.split(/[/;,]/).forEach(p => p.trim() && set.add(p.trim()));
      }
    });
    return Array.from(set).sort();
  }, [cases]);

  const remarkOptions = useMemo(() => {
    const set = new Set<string>();
    cases.forEach(c => {
      if (c.remarks) set.add(c.remarks.trim());
    });
    return Array.from(set).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesMonth = selectedMonth === 'ALL' || (c as any).month === selectedMonth || !(c as any).month;
      const matchesArchive = showArchived ? (c as any).isArchived : !(c as any).isArchived;
      const matchesDoctorRole = !isDoctorRole || (c.surgeon && c.surgeon.includes(doctorName)) || (c.anesth && c.anesth.includes(doctorName)) || (c.imPediaGp && c.imPediaGp.includes(doctorName));

      const matchesSearch =
        searchTerm === '' ||
        (c.patientName && c.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.itemNo && c.itemNo.includes(searchTerm)) ||
        (c.surgeon && c.surgeon.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.anesth && c.anesth.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDoctor =
        selectedDoctor === 'ALL' ||
        c.surgeon === selectedDoctor ||
        c.anesth === selectedDoctor ||
        (c.imPediaGp && c.imPediaGp.includes(selectedDoctor));

      const matchesRemark =
        selectedRemark === 'ALL' ||
        c.remarks === selectedRemark;

      return matchesMonth && matchesArchive && matchesDoctorRole && matchesSearch && matchesDoctor && matchesRemark;
    });
  }, [cases, selectedMonth, showArchived, isDoctorRole, doctorName, searchTerm, selectedDoctor, selectedRemark]);

  // Total pages
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  const updateAndPersist = (updatedCases: CaseItem[]) => {
    setCases(updatedCases);
    localStorage.setItem('cph_cases_data', JSON.stringify(updatedCases));
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

  const handleDeleteCase = (id: string) => {
    if (confirm('Delete this case?')) {
      const updated = cases.filter(c => c.id !== id);
      updateAndPersist(updated);
    }
  };

  // Month-Specific Reset Cases
  const handleResetMonthCases = () => {
    if (confirm(`Are you sure you want to clear cases for ${selectedMonth} ONLY?\n(Cases in other months will remain untouched.)`)) {
      if (selectedMonth === 'ALL') {
        updateAndPersist([]);
      } else {
        const remaining = cases.filter(c => (c as any).month !== selectedMonth);
        updateAndPersist(remaining);
      }
    }
  };

  const handleAddNewCase = () => {
    const newCase = recalculateCase({
      id: `case-${Date.now()}`,
      itemNo: (cases.length + 1).toString(),
      patientName: 'NEW PATIENT',
      surgeon: '',
      anesth: '',
      imPediaGp: '',
      remarks: '1D',
      totalAmount: 10000,
    });
    const updated = [{ ...newCase, month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth, isArchived: false } as any, ...cases];
    updateAndPersist(updated);
  };

  const sumTotalAmount = filteredCases.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  const sumForPool = filteredCases.reduce((acc, c) => acc + (c.forPool || 0), 0);
  const sumSurgeonShare = filteredCases.reduce((acc, c) => acc + (c.surgeonShare || 0), 0);
  const sumAnesthShare = filteredCases.reduce((acc, c) => acc + (c.anesthShare || 0), 0);

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
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Cases Master Grid & Formula Engine</h1>
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-emerald-600">{filteredCases.length}</span> active claims for <strong className="text-slate-800">{selectedMonth}</strong>
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
              onClick={handleAddNewCase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Case
            </button>
            <button
              onClick={() => exportCasesToExcel(filteredCases, `CPH_Balamban_Cases_${selectedMonth}.xlsx`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" /> Export .XLSX
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient, doctor, #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
            />
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

          <div>
            <select
              value={selectedRemark}
              onChange={(e) => setSelectedRemark(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Remarks / Types ({remarkOptions.length})</option>
              {remarkOptions.map((rem) => (
                <option key={rem} value={rem}>{rem}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            Filtered Total: <span className="font-bold text-slate-900 ml-1">₱{sumTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Data Grid with Sequential Numbering (1, 2, 3...) and Pagination */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {filteredCases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Cases Grid is Clean & Ready for {selectedMonth}</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload your official PhilHealth ACPN PDF to populate all claims and automatic sharing formulas for {selectedMonth}.
            </p>
            <div className="flex gap-2 pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                <UploadCloud className="w-4 h-4" /> Upload {selectedMonth} ACPN PDF
              </Link>
              <button
                onClick={handleAddNewCase}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                + Add Manual Case
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-r border-slate-800 w-12 text-center">#</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[170px]">Patient Name</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[130px]">Surgeon</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[130px]">Anesthesiologist</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[130px]">IM / Pedia / GP</th>
                  <th className="p-2.5 border-r border-slate-800 w-20 text-center">Remarks</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[95px] bg-slate-800">Total Amount</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[85px] text-amber-300">For Pool</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[85px]">Balance</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-emerald-300">Surgeon (70%/100%)</th>
                  <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-sky-300">Anesth (30%)</th>
                  <th className="p-2.5 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedCases.map((item, idx) => {
                  const globalRowIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition">
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
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                          {item.remarks || '-'}
                        </span>
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
                        ₱{item.surgeonShare?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-sky-700">
                        ₱{item.anesthShare?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

        {/* Footer Summary Row & Pagination Controls */}
        {filteredCases.length > 0 && (
          <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
            <div className="flex items-center gap-4">
              <div>Total Claims: <span className="text-emerald-400 font-bold">{filteredCases.length}</span> ({selectedMonth})</div>
              
              {/* Pagination Controls */}
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

            <div className="flex gap-4">
              <span>Gross: <span className="text-emerald-400">₱{sumTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Pool: <span className="text-amber-400">₱{sumForPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Surgeons: <span className="text-emerald-400">₱{sumSurgeonShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
              <span>Anesth: <span className="text-sky-400">₱{sumAnesthShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}