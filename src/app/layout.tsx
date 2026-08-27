'use client';

import React, { useState } from 'react';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PeriodProvider, usePeriod } from '@/context/PeriodContext';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, Users, Layers, Download, Hospital, Calendar, HelpCircle, Info, LogOut, UserCheck } from 'lucide-react';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { selectedMonth, setSelectedMonth, monthsList } = usePeriod();
  const [showDocsModal, setShowDocsModal] = useState(false);

  // If login page, render children directly
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-sm">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-white">CPH BALAMBAN</h1>
              <p className="text-[11px] text-emerald-400 font-medium">PHIC ACPN SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Global Month Selector in Sidebar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Active Period
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded text-[9px] border border-emerald-800 font-mono">
              {selectedMonth}
            </span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>📅 {m}</option>
            ))}
          </select>
        </div>

        {/* Navigation */}
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

        {/* User Account / Role & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white text-[11px] truncate max-w-[100px]">{user?.name || 'Admin User'}</p>
              <p className="text-[9px] text-emerald-400 uppercase font-semibold">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Month Banner Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing Active Month:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              📅 {selectedMonth}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span>Facility: <strong className="text-slate-800">Cebu Provincial Hospital - Balamban</strong></span>
            <span>HCI No: <strong className="text-slate-800">H07020344</strong></span>
          </div>
        </div>

        {children}
      </main>

      {/* Guide Modal */}
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
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PeriodProvider>
            <AppShell>{children}</AppShell>
          </PeriodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}