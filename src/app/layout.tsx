'use client';

import React, { useState } from 'react';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, Users, Layers, Download, Hospital, Calendar, HelpCircle, Info } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [showDocsModal, setShowDocsModal] = useState(false);

  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-sm">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-white">CPH BALAMBAN</h1>
              <p className="text-[11px] text-emerald-400 font-medium">PHIC ACPN SYSTEM</p>
            </div>
          </div>

          {/* Month Selector in Sidebar */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/40">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Active Period / Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">📅 All Active Months (2026)</option>
              <option value="JUNE">📅 JUNE 2026 (Master Summary)</option>
              <option value="JULY">📅 JULY 2026 (Uploaded ACPN)</option>
              <option value="AUGUST">📅 AUGUST 2026 (Uploaded ACPN)</option>
            </select>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Overview & Claims
            </div>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              Executive Dashboard
            </Link>
            <Link
              href="/upload"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/upload' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-sky-400" />
              Upload ACPN PDF
            </Link>
            <Link
              href="/cases"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/cases' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Cases Master Grid
            </Link>

            <div className="pt-4 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sharing & Distributions
            </div>
            <Link
              href="/departments"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/departments' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              Department Shares
            </Link>
            <Link
              href="/doctor-summary"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/doctor-summary' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-teal-400" />
              Doctor PF & 20% WTax
            </Link>
            <Link
              href="/export"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/export' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 text-blue-400" />
              Export & Reports
            </Link>

            <div className="pt-4 px-3 py-2">
              <button
                onClick={() => setShowDocsModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 border border-slate-700 transition"
              >
                <HelpCircle className="w-4 h-4" />
                Function & Formula Guide
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>System:</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                Ready for Vercel Live
              </span>
            </div>
            <p className="mt-1 text-slate-400">HCI: H07020344 | Province of Cebu</p>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
          {children}
        </main>

        {/* Function & Formula Guide Modal */}
        {showDocsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">CPH Balamban System & Formula Guide</h2>
                    <p className="text-xs text-slate-500">Katin-awan sa matag computation, sharing formulas, ug columns</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-emerald-700">
                    1. For Pool Deduction (Columns J & K)
                  </h3>
                  <p>
                    Kini ang kantidad nga i-deduct para sa hospital pool fund:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">50% (0.50):</strong> Para sa mga 1D cases, Dental, ug Solo provider cases (<span className="font-mono text-emerald-700">=Total * 0.5</span>).</li>
                    <li><strong className="text-slate-800">35% (0.35):</strong> Para sa code 49080 cases (<span className="font-mono text-emerald-700">=Total * 0.35</span>).</li>
                    <li><strong className="text-slate-800">20% (0.20):</strong> Para sa OR Surgeon + Anesth cases ug Pain Management (<span className="font-mono text-emerald-700">=Total * 0.20</span>).</li>
                    <li><strong className="text-slate-800">Balance:</strong> Total Amount minus For Pool (<span className="font-mono text-emerald-700">=Total - ForPool</span>).</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-sky-700">
                    2. Surgeon & Anesthesiologist Sharing (70% / 30%)
                  </h3>
                  <p>
                    Pagkahuman ma-deduct ang IM/Pedia 10% (kung naa), ang remaining balance i-divide:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">Surgeon:</strong> 70% kung naay Anesth (<span className="font-mono text-sky-700">=Net * 0.70</span>), o 100% kung solo surgeon (<span className="font-mono text-sky-700">=Net * 1.0</span>).</li>
                    <li><strong className="text-slate-800">Anesthesiologist:</strong> 30% (<span className="font-mono text-sky-700">=Net * 0.30</span>).</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-purple-700">
                    3. Specialized Department Formulas
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li>
                      <strong className="text-slate-800">NICU / ICU Pro-rata:</strong> Deduct Dr. Kurt Peter Rosell's specialist share (₱1,000/patient). Ang net i-distribute pro-rata base sa duty hours: <span className="font-mono text-purple-700">=NetPool * (DoctorHours / TotalHours)</span>.
                    </li>
                    <li>
                      <strong className="text-slate-800">HEMO Sharing:</strong> <span className="font-mono text-purple-700">Rate per Minute = Total HEMO-IM / Total Minutes</span> (e.g. ₱8.81340/min), unya i-multiply sa gidaghanon sa minuto sa attending doctor.
                    </li>
                    <li>
                      <strong className="text-slate-800">BTL-IUD FP Team:</strong> Equal 1/11th division across active Family Planning team members.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-amber-700">
                    4. Doctor 20% Withholding Tax & Net PF
                  </h3>
                  <p>
                    Ang tibuok Gross PF sa doctor deduct-an og <strong className="text-slate-800">20% Withholding Tax</strong> (<span className="font-mono text-amber-700">=Gross * 0.20</span>), unya ang <strong className="text-slate-800">Net PF</strong> (<span className="font-mono text-amber-700">=Gross - Tax</span>) mao ang actual nga ibayad sa Doctor Payslip.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}