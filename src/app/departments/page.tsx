'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { Layers, HeartPulse, Stethoscope, Baby, Users2, Activity, Plus, Edit2, Trash2, Archive, RotateCcw, UploadCloud } from 'lucide-react';
import { computeNicuHours, computePediaImHours } from '@/lib/computationEngine';
import Link from 'next/link';

interface HemoEntry {
  id: string;
  doctor: string;
  minutes: number;
  multiplier: number;
  month: string;
  isArchived?: boolean;
}

export default function DepartmentsPage() {
  const { selectedMonth } = usePeriod();
  const [activeTab, setActiveTab] = useState<'hemo' | 'nicu' | 'pedia-im' | 'btl' | 'pm'>('hemo');
  const [showArchived, setShowArchived] = useState(false);

  // HEMO state with localStorage persistence
  const [hemoEntries, setHemoEntries] = useState<HemoEntry[]>([]);
  const [totalHemoShare, setTotalHemoShare] = useState(0);

  // NICU state
  const [nicuDocs, setNicuDocs] = useState<any[]>([]);
  const [totalNicuCasesAmount, setTotalNicuCasesAmount] = useState(0);
  const [nicuSpecialistRate, setNicuSpecialistRate] = useState(0);

  // Pedia-IM state
  const [pediaDocs, setPediaDocs] = useState<any[]>([]);
  const [totalPediaPool, setTotalPediaPool] = useState(0);

  // BTL state
  const [btlList, setBtlList] = useState<any[]>([]);

  // PM state
  const [pmCases, setPmCases] = useState<any[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedHemo = localStorage.getItem('cph_dept_hemo');
    if (savedHemo) { try { setHemoEntries(JSON.parse(savedHemo)); } catch (e) {} }

    const savedNicu = localStorage.getItem('cph_dept_nicu');
    if (savedNicu) { try { setNicuDocs(JSON.parse(savedNicu)); } catch (e) {} }

    const savedPedia = localStorage.getItem('cph_dept_pedia');
    if (savedPedia) { try { setPediaDocs(JSON.parse(savedPedia)); } catch (e) {} }

    const savedBtl = localStorage.getItem('cph_dept_btl');
    if (savedBtl) { try { setBtlList(JSON.parse(savedBtl)); } catch (e) {} }

    const savedPm = localStorage.getItem('cph_dept_pm');
    if (savedPm) { try { setPmCases(JSON.parse(savedPm)); } catch (e) {} }
  }, []);

  // Filtered lists based on Month and Archive status
  const activeHemoList = useMemo(() => {
    return hemoEntries.filter(h =>
      (showArchived ? h.isArchived : !h.isArchived) &&
      (selectedMonth === 'ALL' || h.month === selectedMonth)
    );
  }, [hemoEntries, selectedMonth, showArchived]);

  const totalCalculatedHemoMinutes = activeHemoList.reduce((sum, h) => sum + (h.minutes * h.multiplier), 0);
  const ratePerMinuteHemo = totalCalculatedHemoMinutes > 0 ? (totalHemoShare / totalCalculatedHemoMinutes) : 0;

  // Add / Edit modals state
  const [isAddingHemo, setIsAddingHemo] = useState(false);
  const [editingHemo, setEditingHemo] = useState<HemoEntry | null>(null);
  const [hemoFormDoc, setHemoFormDoc] = useState('');
  const [hemoFormMins, setHemoFormMins] = useState(600);
  const [hemoFormMult, setHemoFormMult] = useState(1.0);

  const [isAddingNicu, setIsAddingNicu] = useState(false);
  const [nicuFormName, setNicuFormName] = useState('');
  const [nicuFormRole, setNicuFormRole] = useState('pedia');
  const [nicuFormStatus, setNicuFormStatus] = useState('jo');
  const [nicuFormHours, setNicuFormHours] = useState(180);

  const [isAddingPedia, setIsAddingPedia] = useState(false);
  const [pediaFormName, setPediaFormName] = useState('');
  const [pediaFormHours, setPediaFormHours] = useState(150);

  const [isAddingBtl, setIsAddingBtl] = useState(false);
  const [btlFormDoc, setBtlFormDoc] = useState('');
  const [btlFormAmount, setBtlFormAmount] = useState(5000);

  const [isAddingPm, setIsAddingPm] = useState(false);
  const [pmFormPatient, setPmFormPatient] = useState('');
  const [pmFormSurgeon, setPmFormSurgeon] = useState('Ardiente');
  const [pmFormAnesth, setPmFormAnesth] = useState('Moralde');
  const [pmFormAmount, setPmFormAmount] = useState(16380);

  // HEMO CRUD
  const handleSaveHemo = () => {
    if (!hemoFormDoc) return alert('Please enter Doctor Name');
    let updated: HemoEntry[] = [];
    if (editingHemo) {
      updated = hemoEntries.map(h => h.id === editingHemo.id ? { ...h, doctor: hemoFormDoc, minutes: hemoFormMins, multiplier: hemoFormMult } : h);
      setEditingHemo(null);
    } else {
      updated = [...hemoEntries, {
        id: `h-${Date.now()}`,
        doctor: hemoFormDoc,
        minutes: hemoFormMins,
        multiplier: hemoFormMult,
        month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth,
        isArchived: false
      }];
      setIsAddingHemo(false);
    }
    setHemoEntries(updated);
    localStorage.setItem('cph_dept_hemo', JSON.stringify(updated));
    setHemoFormDoc('');
  };

  const handleToggleArchiveHemo = (id: string) => {
    const updated = hemoEntries.map(h => h.id === id ? { ...h, isArchived: !h.isArchived } : h);
    setHemoEntries(updated);
    localStorage.setItem('cph_dept_hemo', JSON.stringify(updated));
  };

  const handleDeleteHemo = (id: string) => {
    if (confirm('Delete this HEMO entry?')) {
      const updated = hemoEntries.filter(h => h.id !== id);
      setHemoEntries(updated);
      localStorage.setItem('cph_dept_hemo', JSON.stringify(updated));
    }
  };

  // NICU CRUD
  const activeNicuList = nicuDocs.filter(d => (showArchived ? d.isArchived : !d.isArchived) && (selectedMonth === 'ALL' || d.month === selectedMonth));
  const computedNicu = computeNicuHours(totalNicuCasesAmount, nicuSpecialistRate, activeNicuList);

  const handleSaveNicu = () => {
    if (!nicuFormName) return alert('Enter Doctor Name');
    const updated = [...nicuDocs, {
      id: `nicu-${Date.now()}`,
      name: nicuFormName,
      role: nicuFormRole,
      status: nicuFormStatus,
      hours: nicuFormHours,
      share: 0,
      month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth,
      isArchived: false
    }];
    setNicuDocs(updated);
    localStorage.setItem('cph_dept_nicu', JSON.stringify(updated));
    setIsAddingNicu(false);
    setNicuFormName('');
  };

  // Pedia CRUD
  const activePediaList = pediaDocs.filter(d => (showArchived ? d.isArchived : !d.isArchived) && (selectedMonth === 'ALL' || d.month === selectedMonth));
  const computedPedia = computePediaImHours(totalPediaPool, activePediaList);

  const handleSavePedia = () => {
    if (!pediaFormName) return alert('Enter Doctor Name');
    const updated = [...pediaDocs, {
      id: `ped-${Date.now()}`,
      name: pediaFormName,
      role: 'pedia',
      status: 'jo',
      hours: pediaFormHours,
      share: 0,
      month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth,
      isArchived: false
    }];
    setPediaDocs(updated);
    localStorage.setItem('cph_dept_pedia', JSON.stringify(updated));
    setIsAddingPedia(false);
    setPediaFormName('');
  };

  // BTL CRUD
  const activeBtlList = btlList.filter(d => (showArchived ? d.isArchived : !d.isArchived) && (selectedMonth === 'ALL' || d.month === selectedMonth));
  const handleSaveBtl = () => {
    if (!btlFormDoc) return alert('Enter Doctor Name');
    const updated = [...btlList, {
      id: `btl-${Date.now()}`,
      doctor: btlFormDoc,
      amount: btlFormAmount,
      equalShare: btlFormAmount / 11,
      month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth,
      isArchived: false
    }];
    setBtlList(updated);
    localStorage.setItem('cph_dept_btl', JSON.stringify(updated));
    setIsAddingBtl(false);
    setBtlFormDoc('');
  };

  // PM CRUD
  const activePmList = pmCases.filter(d => (showArchived ? d.isArchived : !d.isArchived) && (selectedMonth === 'ALL' || d.month === selectedMonth));
  const handleSavePm = () => {
    if (!pmFormPatient) return alert('Enter Patient Name');
    const pool = pmFormAmount * 0.20;
    const updated = [...pmCases, {
      id: `pm-${Date.now()}`,
      itemNo: (pmCases.length + 1).toString(),
      patientName: pmFormPatient,
      surgeon: pmFormSurgeon,
      anesth: pmFormAnesth,
      remarks: 'PM',
      totalAmount: pmFormAmount,
      forPool: pool,
      balance: pmFormAmount - pool,
      month: selectedMonth === 'ALL' ? 'AUGUST 2026' : selectedMonth,
      isArchived: false
    }];
    setPmCases(updated);
    localStorage.setItem('cph_dept_pm', JSON.stringify(updated));
    setIsAddingPm(false);
    setPmFormPatient('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              PERIOD: {selectedMonth}
            </span>
            <span className="text-xs text-slate-500">Live Formula Recalculations & Entry Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Department Sharing Center</h1>
          <p className="text-sm text-slate-500">
            Create, edit, delete, and archive doctor entries across specialized hospital departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showArchived ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'Active Records' : 'View Archived'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('hemo')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'hemo' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" /> Hemodialysis (HEMO) ({activeHemoList.length})
        </button>

        <button
          onClick={() => setActiveTab('nicu')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'nicu' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Baby className="w-4 h-4" /> NICU / ICU Cases ({activeNicuList.length})
        </button>

        <button
          onClick={() => setActiveTab('pedia-im')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'pedia-im' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Pedia-IM Surgeries ({activePediaList.length})
        </button>

        <button
          onClick={() => setActiveTab('btl')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'btl' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users2 className="w-4 h-4" /> BTL-IUD FP Team ({activeBtlList.length})
        </button>

        <button
          onClick={() => setActiveTab('pm')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'pm' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-4 h-4" /> Pain Management (PM) ({activePmList.length})
        </button>
      </div>

      {/* 1. HEMODIALYSIS TAB */}
      {activeTab === 'hemo' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hemodialysis (HEMO) Attending Rate Matrix</h2>
              <p className="text-xs text-slate-500">Formula: Rate per minute = Total HEMO-IM Share / Total Calculated Minutes</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setIsAddingHemo(true); setEditingHemo(null); setHemoFormDoc(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add HEMO Doctor Entry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 uppercase font-bold text-[10px]">Total HEMO Share:</span>
              <input
                type="number"
                value={totalHemoShare}
                onChange={(e) => setTotalHemoShare(parseFloat(e.target.value) || 0)}
                className="block w-full font-bold text-base bg-transparent border-b border-slate-300 focus:outline-none mt-1"
                placeholder="Enter HEMO Pool (e.g. 82493.46)"
              />
            </div>
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
              <span className="text-sky-700 uppercase font-bold text-[10px]">Total Effective Minutes:</span>
              <p className="text-base font-bold text-sky-900">{totalCalculatedHemoMinutes.toLocaleString()} mins</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 uppercase font-bold text-[10px]">Computed Rate / Minute:</span>
              <p className="text-base font-bold text-emerald-800 font-mono">₱{ratePerMinuteHemo.toFixed(5)} / min</p>
            </div>
          </div>

          {activeHemoList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              No HEMO doctor entries yet for {selectedMonth}. Click "+ Add HEMO Doctor Entry" to add doctors and minutes.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Attending Nephrologist / Doctor</th>
                  <th className="p-3 text-right">Logged Minutes</th>
                  <th className="p-3 text-center">Multiplier</th>
                  <th className="p-3 text-right">Effective Minutes</th>
                  <th className="p-3 text-right text-emerald-300">Doctor Share (PHP)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeHemoList.map((h, i) => {
                  const effectiveMins = h.minutes * h.multiplier;
                  const docShare = effectiveMins * ratePerMinuteHemo;
                  return (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{h.doctor}</td>
                      <td className="p-3 text-right font-mono font-semibold">{h.minutes} mins</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700 border border-slate-200">
                          {h.multiplier === 1.0 ? '100%' : '25%'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700">{effectiveMins} mins</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        ₱{docShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => { setEditingHemo(h); setHemoFormDoc(h.doctor); setHemoFormMins(h.minutes); setHemoFormMult(h.multiplier); setIsAddingHemo(true); }}
                            className="p-1 text-slate-500 hover:text-emerald-600"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleArchiveHemo(h.id)}
                            className="p-1 text-slate-500 hover:text-amber-600"
                            title={h.isArchived ? 'Restore' : 'Archive'}
                          >
                            {h.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteHemo(h.id)}
                            className="p-1 text-slate-500 hover:text-rose-600"
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
          )}

          {isAddingHemo && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">{editingHemo ? 'Edit HEMO Entry' : 'Add HEMO Doctor Entry'}</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Tawasil"
                      value={hemoFormDoc}
                      onChange={(e) => setHemoFormDoc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Logged Minutes</label>
                    <input
                      type="number"
                      value={hemoFormMins}
                      onChange={(e) => setHemoFormMins(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Multiplier</label>
                    <select
                      value={hemoFormMult}
                      onChange={(e) => setHemoFormMult(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value={1.0}>100% (1.0) - Regular Duty Shift</option>
                      <option value={0.25}>25% (0.25) - Clinical Supervision</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsAddingHemo(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHemo}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. NICU / ICU TAB */}
      {activeTab === 'nicu' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">NICU / ICU Duty Hours Pro-Rata Sharing</h2>
              <p className="text-xs text-slate-500">Formula: Net Pool = Total - Dr. Rosell Cut; Share = Net Pool * (Doctor Hours / Total Hours)</p>
            </div>
            <button
              onClick={() => setIsAddingNicu(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add NICU Entry
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 uppercase font-bold text-[10px]">Total NICU Amount:</span>
              <input
                type="number"
                value={totalNicuCasesAmount}
                onChange={(e) => setTotalNicuCasesAmount(parseFloat(e.target.value) || 0)}
                className="block w-full font-bold text-base bg-transparent border-b border-slate-300 focus:outline-none mt-1"
                placeholder="0.00"
              />
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="text-amber-700 uppercase font-bold text-[10px]">Specialist Cut (Dr. Rosell):</span>
              <input
                type="number"
                value={nicuSpecialistRate}
                onChange={(e) => setNicuSpecialistRate(parseFloat(e.target.value) || 0)}
                className="block w-full font-bold text-base bg-transparent border-b border-amber-300 focus:outline-none mt-1 text-amber-900"
                placeholder="0.00"
              />
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 uppercase font-bold text-[10px]">Net To Share:</span>
              <p className="text-base font-bold text-emerald-800">
                ₱{Math.max(0, totalNicuCasesAmount - nicuSpecialistRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {activeNicuList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              No NICU doctor entries yet for {selectedMonth}. Click "+ Add NICU Entry" to add doctor duty hours.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right"># of Duty Hours</th>
                  <th className="p-3 text-right text-emerald-300">Pro-Rata Share (PHP)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {computedNicu.map((d, i) => (
                  <tr key={d.name + i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{i + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{d.name}</td>
                    <td className="p-3 uppercase text-slate-600">{d.role}</td>
                    <td className="p-3 uppercase text-slate-600">{d.status}</td>
                    <td className="p-3 text-right font-mono font-semibold">{d.hours} hrs</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      ₱{d.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const updated = nicuDocs.filter(nd => nd.name !== d.name);
                          setNicuDocs(updated);
                          localStorage.setItem('cph_dept_nicu', JSON.stringify(updated));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isAddingNicu && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Add NICU Doctor Duty Hours</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Castro, Leidenia I."
                      value={nicuFormName}
                      onChange={(e) => setNicuFormName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duty Hours</label>
                    <input
                      type="number"
                      value={nicuFormHours}
                      onChange={(e) => setNicuFormHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setIsAddingNicu(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-semibold rounded-lg">Cancel</button>
                  <button onClick={handleSaveNicu} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save Entry</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PEDIA-IM TAB */}
      {activeTab === 'pedia-im' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">PEDIA & IM During Surgeries Sharing</h2>
              <p className="text-xs text-slate-500">Pro-rata sharing across pediatricians and internists based on hours</p>
            </div>
            <button
              onClick={() => setIsAddingPedia(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Pedia Entry
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs max-w-sm">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Total Pool To Share:</span>
            <input
              type="number"
              value={totalPediaPool}
              onChange={(e) => setTotalPediaPool(parseFloat(e.target.value) || 0)}
              className="block w-full font-bold text-base bg-transparent border-b border-slate-300 focus:outline-none mt-1"
              placeholder="0.00"
            />
          </div>

          {activePediaList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              No Pedia/IM doctor entries yet for {selectedMonth}. Click "+ Add Pedia Entry" to add doctors.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Duty Hours</th>
                  <th className="p-3 text-right text-emerald-300">Share (PHP)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {computedPedia.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{d.name}</td>
                    <td className="p-3 uppercase text-slate-600">{d.role}</td>
                    <td className="p-3 uppercase text-slate-600">{d.status}</td>
                    <td className="p-3 text-right font-mono font-semibold">{d.hours} hrs</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      ₱{d.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const updated = pediaDocs.filter(pd => pd.name !== d.name);
                          setPediaDocs(updated);
                          localStorage.setItem('cph_dept_pedia', JSON.stringify(updated));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isAddingPedia && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Add Pedia Doctor Entry</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={pediaFormName}
                      onChange={(e) => setPediaFormName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hours</label>
                    <input
                      type="number"
                      value={pediaFormHours}
                      onChange={(e) => setPediaFormHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setIsAddingPedia(false)} className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg">Cancel</button>
                  <button onClick={handleSavePedia} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. BTL-IUD FP TEAM TAB */}
      {activeTab === 'btl' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">BTL-IUD Family Planning Team Equal Split</h2>
              <p className="text-xs text-slate-500">Divided equally (1/11th) across active FP team physicians</p>
            </div>
            <button
              onClick={() => setIsAddingBtl(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add FP Doctor
            </button>
          </div>

          {activeBtlList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              No FP team doctor entries yet for {selectedMonth}. Click "+ Add FP Doctor" to add.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Team Doctor</th>
                  <th className="p-3 text-right">Generated BTL Amount</th>
                  <th className="p-3 text-right text-emerald-300">1/11 Equal Split Share</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeBtlList.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{item.doctor}</td>
                    <td className="p-3 text-right font-mono font-semibold">₱{item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₱{item.equalShare?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const updated = btlList.filter(b => b.doctor !== item.doctor);
                          setBtlList(updated);
                          localStorage.setItem('cph_dept_btl', JSON.stringify(updated));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isAddingBtl && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Add BTL Team Doctor</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={btlFormDoc}
                      onChange={(e) => setBtlFormDoc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">BTL Amount</label>
                    <input
                      type="number"
                      value={btlFormAmount}
                      onChange={(e) => setBtlFormAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setIsAddingBtl(false)} className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg">Cancel</button>
                  <button onClick={handleSaveBtl} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PAIN MANAGEMENT (PM) TAB */}
      {activeTab === 'pm' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pain Management (PM) Cases</h2>
              <p className="text-xs text-slate-500">Fixed 20% Pool Deduction (=F*0.20) and 80% Net Balance (=F-G)</p>
            </div>
            <button
              onClick={() => setIsAddingPm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add PM Case
            </button>
          </div>

          {activePmList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              No PM cases yet for {selectedMonth}. Click "+ Add PM Case" to add.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Surgeon</th>
                  <th className="p-3">Anesthesiologist</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right text-amber-300">20% For Pool</th>
                  <th className="p-3 text-right text-emerald-300">80% Balance</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activePmList.map((pm, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{i + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{pm.patientName}</td>
                    <td className="p-3 text-slate-800">{pm.surgeon}</td>
                    <td className="p-3 text-slate-800">{pm.anesth}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₱{pm.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-semibold text-amber-600">₱{pm.forPool?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₱{pm.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const updated = pmCases.filter(p => p.patientName !== pm.patientName);
                          setPmCases(updated);
                          localStorage.setItem('cph_dept_pm', JSON.stringify(updated));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isAddingPm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Add Pain Management Case</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={pmFormPatient}
                      onChange={(e) => setPmFormPatient(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Surgeon</label>
                    <input
                      type="text"
                      value={pmFormSurgeon}
                      onChange={(e) => setPmFormSurgeon(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anesthesiologist</label>
                    <input
                      type="text"
                      value={pmFormAnesth}
                      onChange={(e) => setPmFormAnesth(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Amount</label>
                    <input
                      type="number"
                      value={pmFormAmount}
                      onChange={(e) => setPmFormAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setIsAddingPm(false)} className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg">Cancel</button>
                  <button onClick={handleSavePm} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save PM Case</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}