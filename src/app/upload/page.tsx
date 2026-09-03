'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Calendar, Trash2, ShieldCheck, Check, X, ShieldAlert, SkipForward, RotateCw } from 'lucide-react';
import { parseAcpnText } from '@/lib/acpnParser';
import { recalculateCase } from '@/lib/computationEngine';
import { usePeriod, ALL_MONTHS_NAMES, ALL_YEARS } from '@/context/PeriodContext';
import { ClaimItem, CaseItem } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UploadedBatch {
  id: string;
  fileName: string;
  month: string;
  uploadDate: string;
  claimCount: number;
  grossTotal: number;
  pfTotal: number;
  claims: ClaimItem[];
}

interface PendingUpload {
  batches: UploadedBatch[];
  allClaims: ClaimItem[];
  duplicateClaims: ClaimItem[];
  uniqueNewClaims: ClaimItem[];
  month: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { selectedMonth, setSelectedMonth } = usePeriod();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  // Month and Year Picker State
  const [targetMonthName, setTargetMonthName] = useState('SEPTEMBER');
  const [targetYear, setTargetYear] = useState('2026');
  const targetMonth = `${targetMonthName} ${targetYear}`;

  const [uploadedBatches, setUploadedBatches] = useState<UploadedBatch[]>([]);
  const [currentParsedClaims, setCurrentParsedClaims] = useState<ClaimItem[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importedSuccessfully, setImportedSuccessfully] = useState(false);

  // Duplicate Modal State
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cph_acpn_batches');
    if (saved) {
      try {
        setUploadedBatches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjs: any = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const commitClaimsToDatabase = (batchesToSave: UploadedBatch[], claimsToImport: ClaimItem[], month: string) => {
    // 1. Save Batches
    const updatedBatches = [...batchesToSave, ...uploadedBatches];
    setUploadedBatches(updatedBatches);
    localStorage.setItem('cph_acpn_batches', JSON.stringify(updatedBatches));

    // 2. Import into Cases Master Grid
    const savedCasesStr = localStorage.getItem('cph_cases_data');
    let existingCases: CaseItem[] = [];
    if (savedCasesStr) {
      try { existingCases = JSON.parse(savedCasesStr); } catch (e) {}
    }

    const newCases: CaseItem[] = claimsToImport.map((c, idx) => {
      let surgeon = '';
      let anesth = '';
      let imPedia = '';

      if (c.doctors && c.doctors.length > 0) {
        surgeon = c.doctors[0] || '';
        if (c.doctors.length > 1) {
          anesth = c.doctors[1] || '';
        }
        if (c.doctors.length > 2) {
          imPedia = c.doctors.slice(2).join(', ');
        }
      }

      // Detect Remark / Type
      let remark = '1D';
      const docStr = (c.doctors || []).join(' ').toLowerCase();

      if (docStr.includes('tacaldo') || docStr.includes('seeto') || docStr.includes('tawasil') || [350, 700, 1050, 1400, 1750, 2100].includes(c.pf)) {
        remark = 'Hemo';
      } else if (c.pf >= 20000) {
        remark = 'C/S';
      } else if (c.pf >= 10000) {
        remark = '49080';
      } else if (surgeon.toLowerCase().includes('estalani')) {
        remark = 'Dental';
      }

      const calculated = recalculateCase({
        id: `case-${Date.now()}-${idx}`,
        itemNo: (existingCases.length + idx + 1).toString(),
        patientName: c.patientName,
        surgeon,
        anesth,
        imPediaGp: imPedia,
        remarks: remark,
        totalAmount: c.pf || 5000,
      });

      return {
        ...calculated,
        month,
        isArchived: false
      } as any;
    });

    const combined = [...newCases, ...existingCases];
    localStorage.setItem('cph_cases_data', JSON.stringify(combined));

    setCurrentParsedClaims(claimsToImport);
    setSuccessMessage(`Successfully imported ${claimsToImport.length} claims into ${month} database!`);
    setImportedSuccessfully(true);
    setPendingUpload(null);
    setSelectedMonth(month);
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setDuplicateWarning(null);
    setSuccessMessage(null);
    setImportedSuccessfully(false);
    setPendingUpload(null);

    const newBatches: UploadedBatch[] = [];
    const allParsed: ClaimItem[] = [];

    // Existing series numbers already in system
    const existingSeries = new Set<string>();
    const savedCasesStr = localStorage.getItem('cph_cases_data');
    if (savedCasesStr) {
      try {
        const cases: any[] = JSON.parse(savedCasesStr);
        cases.forEach(c => { if (c.series) existingSeries.add(c.series); });
      } catch (e) {}
    }
    uploadedBatches.forEach(b => b.claims.forEach(c => { if (c.series) existingSeries.add(c.series); }));

    const duplicateClaims: ClaimItem[] = [];
    const uniqueNewClaims: ClaimItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.pdf')) continue;

      setLoadingStatus(`Scanning file ${i + 1} of ${files.length}: ${file.name}...`);

      try {
        const rawText = await extractTextFromPdf(file);
        const claims = parseAcpnText(rawText);

        claims.forEach(c => {
          if (c.series && existingSeries.has(c.series)) {
            duplicateClaims.push(c);
          } else {
            if (c.series) existingSeries.add(c.series);
            uniqueNewClaims.push(c);
          }
        });

        const grossTotal = claims.reduce((a, c) => a + (c.totalGross || 0), 0);
        const pfTotal = claims.reduce((a, c) => a + (c.pf || 0), 0);

        const batch: UploadedBatch = {
          id: `batch-${Date.now()}-${i}`,
          fileName: file.name,
          month: targetMonth,
          uploadDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          claimCount: claims.length,
          grossTotal,
          pfTotal,
          claims
        };

        newBatches.push(batch);
        allParsed.push(...claims);
      } catch (err: any) {
        console.error('Error parsing file:', file.name, err);
        alert(`Error parsing ${file.name}: ${err.message}`);
      }
    }

    setIsLoading(false);
    setLoadingStatus('');

    // IF DUPLICATES ARE FOUND: DO NOT AUTO-COMMIT! PAUSE AND PROMPT USER!
    if (duplicateClaims.length > 0) {
      setPendingUpload({
        batches: newBatches,
        allClaims: allParsed,
        duplicateClaims,
        uniqueNewClaims,
        month: targetMonth
      });
    } else if (newBatches.length > 0) {
      // 0 duplicates found -> Proceed safely directly
      commitClaimsToDatabase(newBatches, allParsed, targetMonth);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteBatch = (id: string) => {
    if (confirm('Delete this uploaded ACPN batch?')) {
      const updated = uploadedBatches.filter(b => b.id !== id);
      setUploadedBatches(updated);
      localStorage.setItem('cph_acpn_batches', JSON.stringify(updated));
    }
  };

  const handleClearMonthUploads = () => {
    if (confirm(`Are you sure you want to clear all uploaded ACPN batches and cases for ${targetMonth} ONLY?\n(Data from other months will remain untouched.)`)) {
      const remainingBatches = uploadedBatches.filter(b => b.month !== targetMonth);
      setUploadedBatches(remainingBatches);
      localStorage.setItem('cph_acpn_batches', JSON.stringify(remainingBatches));

      const savedCasesStr = localStorage.getItem('cph_cases_data');
      if (savedCasesStr) {
        try {
          const allCases: CaseItem[] = JSON.parse(savedCasesStr);
          const remainingCases = allCases.filter(c => (c as any).month !== targetMonth);
          localStorage.setItem('cph_cases_data', JSON.stringify(remainingCases));
        } catch (e) {}
      }

      setCurrentParsedClaims([]);
      setSuccessMessage(null);
      setDuplicateWarning(null);
      setPendingUpload(null);
    }
  };

  const totalHci = currentParsedClaims.reduce((acc, c) => acc + (c.hci || 0), 0);
  const totalPf = currentParsedClaims.reduce((acc, c) => acc + (c.pf || 0), 0);
  const totalGross = currentParsedClaims.reduce((acc, c) => acc + (c.totalGross || 0), 0);

  const monthBatches = uploadedBatches.filter(b => b.month === targetMonth);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              BULK ACPN UPLOADER & DOCTOR PF SYNC
            </span>
            <span className="text-xs text-slate-500">Smart Duplicate Protection</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">PhilHealth ACPN PDF Auto-Extractor</h1>
          <p className="text-sm text-slate-500">
            Upload official monthly ACPN PDFs for any month or year. Selected upload target: <strong className="text-emerald-700">{targetMonth}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {monthBatches.length > 0 && (
            <button
              onClick={handleClearMonthUploads}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-200 transition"
              title={`Clear only ${targetMonth} data`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear {targetMonth} Uploads ({monthBatches.length})
            </button>
          )}

          {/* Complete Month & Year Picker */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <div className="text-xs flex items-center gap-1.5">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Month:</span>
                <select
                  value={targetMonthName}
                  onChange={(e) => setTargetMonthName(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                >
                  {ALL_MONTHS_NAMES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Year:</span>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                >
                  {ALL_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Bulk Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition flex flex-col items-center justify-center bg-white ${
          isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-3">
          {isLoading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {isLoading ? loadingStatus : `Drag & drop single or multiple ACPN PDFs for ${targetMonth}`}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Upload fresh ACPN files for <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{targetMonth}</span>. All claims, Hemo splits, and doctor shares are computed specifically for this period.
        </p>

        <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition">
          <UploadCloud className="w-4 h-4" />
          Browse Multiple PDFs for {targetMonth}
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Interactive Duplicate Claims Warning Modal */}
      {pendingUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Duplicate Claims Detected — Upload Paused</h3>
                  <p className="text-xs text-slate-500">
                    The system halted auto-import to prevent duplicate records in {pendingUpload.month}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingUpload(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Duplicate Statistics Banner */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Total Scanned</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{pendingUpload.allClaims.length} claims</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-amber-700 uppercase font-bold text-[10px]">Duplicates Found</span>
                <p className="text-base font-bold text-amber-900 mt-0.5">{pendingUpload.duplicateClaims.length} duplicate(s)</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 uppercase font-bold text-[10px]">New Unique Claims</span>
                <p className="text-base font-bold text-emerald-800 mt-0.5">{pendingUpload.uniqueNewClaims.length} new claim(s)</p>
              </div>
            </div>

            {/* Duplicate Claims Sample List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Sample Duplicate Claims (Already existing in database):
              </p>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {pendingUpload.duplicateClaims.slice(0, 8).map((c, i) => (
                  <div key={i} className="p-2.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{c.patientName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Series: {c.series} • PABN: {c.pabn}</p>
                    </div>
                    <span className="font-bold font-mono text-amber-700">₱{(c.pf || 0).toLocaleString()}</span>
                  </div>
                ))}
                {pendingUpload.duplicateClaims.length > 8 && (
                  <p className="p-2 text-center text-[11px] text-slate-400 italic">
                    ...and {pendingUpload.duplicateClaims.length - 8} more duplicate claims
                  </p>
                )}
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setPendingUpload(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Cancel Upload
              </button>

              {pendingUpload.uniqueNewClaims.length > 0 && (
                <button
                  onClick={() => commitClaimsToDatabase(pendingUpload.batches, pendingUpload.uniqueNewClaims, pendingUpload.month)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition"
                >
                  <SkipForward className="w-4 h-4" /> Skip Duplicates & Import {pendingUpload.uniqueNewClaims.length} New Claims
                </button>
              )}

              <button
                onClick={() => commitClaimsToDatabase(pendingUpload.batches, pendingUpload.allClaims, pendingUpload.month)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow transition"
              >
                <RotateCw className="w-4 h-4" /> Force Import All ({pendingUpload.allClaims.length} claims)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success and View Links */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
                <p className="text-xs text-emerald-700">✓ All verified claims, Hemo splits, doctor shares, and withholding taxes synced!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/cases"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                View in Cases Grid <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/doctor-summary"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition"
              >
                View Doctor PF & WTax <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Imported Claims</span>
              <p className="text-base font-bold text-slate-900">{currentParsedClaims.length}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Grand Gross</span>
              <p className="text-base font-bold text-slate-900">₱{totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">HCI Share</span>
              <p className="text-base font-bold text-slate-900">₱{totalHci.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 text-[10px] uppercase font-bold">PF Share</span>
              <p className="text-base font-bold text-emerald-700">₱{totalPf.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded History */}
      {uploadedBatches.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Uploaded ACPN Batches ({uploadedBatches.length} files total)
            </h2>
          </div>

          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">File Name</th>
                <th className="p-3">Target Month</th>
                <th className="p-3">Uploaded At</th>
                <th className="p-3 text-center">Claims Count</th>
                <th className="p-3 text-right">Gross Amount</th>
                <th className="p-3 text-right text-emerald-700">PF Amount</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {uploadedBatches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    {b.fileName}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px] border border-emerald-200">
                      {b.month}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{b.uploadDate}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{b.claimCount} claims</td>
                  <td className="p-3 text-right font-medium">₱{b.grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">₱{b.pfTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteBatch(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete this batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}