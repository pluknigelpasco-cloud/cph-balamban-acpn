'use client';

import React, { useState } from 'react';
import initialData from '@/lib/initialData.json';
import { Layers, HeartPulse, Stethoscope, Baby, Users2, Activity } from 'lucide-react';
import { computeNicuHours, computePediaImHours } from '@/lib/computationEngine';

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState<'pm' | 'nicu' | 'hemo' | 'pedia-im' | 'btl'>('nicu');

  // NICU state
  const [totalNicuCasesAmount, setTotalNicuCasesAmount] = useState(217067.60);
  const [nicuSpecialistRate, setNicuSpecialistRate] = useState(9000.00);
  const [nicuDocs, setNicuDocs] = useState(initialData.nicuDoctors || []);

  // Pedia-IM state
  const [totalPediaPool, setTotalPediaPool] = useState(174606.68);
  const [pediaDocs, setPediaDocs] = useState(initialData.pediaDoctors || []);
  const [imDocs, setImDocs] = useState(initialData.imDoctors || []);

  // HEMO state
  const [totalHemoShare, setTotalHemoShare] = useState(82493.46);
  const [totalHemoMinutes, setTotalHemoMinutes] = useState(9360);

  // PM state
  const [pmCases] = useState(initialData.pmData || []);

  // BTL state
  const [btlList] = useState(initialData.btlData || []);

  // Live calculations for NICU
  const updatedNicuList = computeNicuHours(totalNicuCasesAmount, nicuSpecialistRate, nicuDocs);
  const netNicuPool = totalNicuCasesAmount - nicuSpecialistRate;

  // Live calculations for Pedia
  const updatedPediaList = computePediaImHours(totalPediaPool, pediaDocs);

  const ratePerMinuteHemo = totalHemoMinutes > 0 ? (totalHemoShare / totalHemoMinutes) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Department Sharing & Pro-Rata Formula Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Specialized departmental calculations matching official print sheets (NICU/ICU pro-rata hours, Hemodialysis minute rates, Pedia-IM surgeries sharing, Pain Management, and BTL Family Planning team split).
        </p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('nicu')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'nicu' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Baby className="w-4 h-4" /> NICU / ICU Cases
          </button>

          <button
            onClick={() => setActiveTab('hemo')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'hemo' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Hemodialysis (HEMO)
          </button>

          <button
            onClick={() => setActiveTab('pedia-im')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pedia-im' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Pedia-IM Surgeries
          </button>

          <button
            onClick={() => setActiveTab('btl')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'btl' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users2 className="w-4 h-4" /> BTL-IUD FP Team
          </button>

          <button
            onClick={() => setActiveTab('pm')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pm' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" /> Pain Management (PM)
          </button>
        </div>
      </div>

      {/* Tab 1: NICU / ICU */}
      {activeTab === 'nicu' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">NICU / ICU Duty Hours Pro-Rata Computation</h2>
              <p className="text-xs text-slate-500">Formula: Net Pool = Total - Dr. Rosell Cut; Share = Net Pool * (Doctor Hours / Total Hours)</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Total NICU Amount:</span>
                <p className="font-bold text-slate-900">₱{totalNicuCasesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <span className="text-amber-700">Specialist (Dr. Rosell):</span>
                <p className="font-bold text-amber-900">₱{nicuSpecialistRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-700">Net To Be Shared:</span>
                <p className="font-bold text-emerald-900">₱{netNicuPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="p-3">Doctor Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right"># of Duty Hours</th>
                <th className="p-3 text-right text-emerald-300">Pro-Rata Share (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {updatedNicuList.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{doc.name}</td>
                  <td className="p-3 uppercase text-slate-600">{doc.role}</td>
                  <td className="p-3 uppercase text-slate-600">{doc.status}</td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800">{doc.hours} hrs</td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    ₱{doc.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: HEMO */}
      {activeTab === 'hemo' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hemodialysis (HEMO) Rate Per Minute Sharing</h2>
              <p className="text-xs text-slate-500">Formula: Rate per minute = Total HEMO-IM Share / Total Minutes</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">HEMO-IM Share:</span>
                <p className="font-bold text-slate-900">₱{totalHemoShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-200">
                <span className="text-sky-700">Total Minutes:</span>
                <p className="font-bold text-sky-900">{totalHemoMinutes.toLocaleString()} mins</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-700">Rate Per Minute:</span>
                <p className="font-bold text-emerald-900 font-mono">₱{ratePerMinuteHemo.toFixed(5)} / min</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900">Attending Nephrologists & IM Doctors:</h3>
            <p>Tawasil, Juson, Delos Santos, Tacaldo, Bibera, Aguilar, Melendres, Seeto, Dandan.</p>
            <p className="text-[11px] text-slate-500">Logs include 25% multiplier for specific clinical supervision shifts.</p>
          </div>
        </div>
      )}

      {/* Tab 3: Pedia-IM */}
      {activeTab === 'pedia-im' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">PEDIA & IM During Surgeries Sharing</h2>
              <p className="text-xs text-slate-500">Total Pool To Be Shared: ₱{totalPediaPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="p-3">Doctor Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Employment</th>
                <th className="p-3 text-right"># of Hours</th>
                <th className="p-3 text-right text-emerald-300">Pro-Rata Share (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {updatedPediaList.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{doc.name}</td>
                  <td className="p-3 uppercase text-slate-600">{doc.role}</td>
                  <td className="p-3 uppercase text-slate-600">{doc.status}</td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800">{doc.hours} hrs</td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    ₱{doc.share.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: BTL-IUD FP Team */}
      {activeTab === 'btl' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">BTL-IUD Family Planning Team Equal Split</h2>
              <p className="text-xs text-slate-500">Total Team Pool: ₱75,192.00 | Divided equally amongst active team members (=$B$8 / 11)</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="p-3">Team Doctor</th>
                <th className="p-3 text-right">Generated BTL Amount</th>
                <th className="p-3 text-right text-emerald-300">Equal 1/11 Split Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {btlList.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{item.doctor}</td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800">
                    ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    ₱{item.equalShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Pain Management (PM) */}
      {activeTab === 'pm' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pain Management (PM) Cases</h2>
              <p className="text-xs text-slate-500">Fixed 20% Pool Deduction (=F*0.2) and 80% Balance (=F-G)</p>
            </div>
          </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pmCases.map((pm, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500">{pm.itemNo}</td>
                  <td className="p-3 font-bold text-slate-900">{pm.patientName}</td>
                  <td className="p-3 text-slate-800">{pm.surgeon}</td>
                  <td className="p-3 text-slate-800">{pm.anesth}</td>
                  <td className="p-3 text-right font-bold text-slate-900">₱{pm.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-semibold text-amber-600">₱{pm.forPool?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">₱{pm.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}