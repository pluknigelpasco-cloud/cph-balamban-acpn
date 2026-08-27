'use client';

import React, { useState, useMemo } from 'react';
import initialData from '@/lib/initialData.json';
import { CaseItem } from '@/types';
import { recalculateCase } from '@/lib/computationEngine';
import { exportCasesToExcel } from '@/lib/exportUtils';
import { Search, Filter, Download, Plus, RefreshCw, Layers } from 'lucide-react';

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(initialData.casesData as CaseItem[]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedRemark, setSelectedRemark] = useState('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Extract unique doctors and remarks for filter dropdowns
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

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search term
      const matchesSearch =
        searchTerm === '' ||
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.itemNo.includes(searchTerm) ||
        (c.surgeon && c.surgeon.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.anesth && c.anesth.toLowerCase().includes(searchTerm.toLowerCase()));

      // Doctor filter
      const matchesDoctor =
        selectedDoctor === 'ALL' ||
        c.surgeon === selectedDoctor ||
        c.anesth === selectedDoctor ||
        (c.imPediaGp && c.imPediaGp.includes(selectedDoctor));

      // Remark filter
      const matchesRemark =
        selectedRemark === 'ALL' ||
        c.remarks === selectedRemark;

      return matchesSearch && matchesDoctor && matchesRemark;
    });
  }, [cases, searchTerm, selectedDoctor, selectedRemark]);

  // Update a single case row with live formula recalculation
  const handleUpdateRow = (id: string, field: keyof CaseItem, value: any) => {
    setCases(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return recalculateCase(updated);
      }
      return item;
    }));
  };

  // Add new case
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
    setCases([newCase, ...cases]);
  };

  // Summary figures of current filtered view
  const sumTotalAmount = filteredCases.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  const sumForPool = filteredCases.reduce((acc, c) => acc + (c.forPool || 0), 0);
  const sumBalance = filteredCases.reduce((acc, c) => acc + (c.balance || 0), 0);
  const sumSurgeonShare = filteredCases.reduce((acc, c) => acc + (c.surgeonShare || 0), 0);
  const sumAnesthShare = filteredCases.reduce((acc, c) => acc + (c.anesthShare || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cases Master Grid & Formula Engine</h1>
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-emerald-600">{filteredCases.length}</span> of {cases.length} cases | Live recalculations enabled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNewCase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Case
            </button>
            <button
              onClick={() => exportCasesToExcel(filteredCases)}
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

      {/* Spreadsheet Data Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 border-r border-slate-800 w-12 text-center">#</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[180px]">Patient Name</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[120px]">Surgeon</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[120px]">Anesthesiologist</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[140px]">IM / Pedia / GP</th>
                <th className="p-2.5 border-r border-slate-800 w-24 text-center">Remarks</th>
                <th className="p-2.5 border-r border-slate-800 text-right min-w-[100px] bg-slate-800">Total Amount</th>
                <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-amber-300">For Pool</th>
                <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px]">Balance</th>
                <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-emerald-300">Surgeon (70%/100%)</th>
                <th className="p-2.5 border-r border-slate-800 text-right min-w-[90px] text-sky-300">Anesth (30%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.slice(0, 150).map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/40 transition">
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">{item.itemNo}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Row */}
        <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between text-xs font-semibold">
          <div>Total Cases: {filteredCases.length}</div>
          <div className="flex gap-6">
            <span>Total Gross: <span className="text-emerald-400">₱{sumTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>Pool Retained: <span className="text-amber-400">₱{sumForPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>Surgeon Share: <span className="text-emerald-400">₱{sumSurgeonShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>Anesth Share: <span className="text-sky-400">₱{sumAnesthShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}