'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Hospital, ShieldCheck, Stethoscope, Lock, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'doctor' | 'billing'>('admin');
  const [selectedDoctor, setSelectedDoctor] = useState('Juson');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'admin@cphbalamban.gov.ph', role, role === 'doctor' ? selectedDoctor : undefined);
    router.push('/');
  };

  const handleQuickLogin = (asRole: 'admin' | 'doctor' | 'billing', doc = 'Juson') => {
    login(`${asRole}@cphbalamban.gov.ph`, asRole, asRole === 'doctor' ? doc : undefined);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex p-3 bg-emerald-600 rounded-xl mb-3 shadow-lg">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold">Cebu Provincial Hospital</h1>
          <p className="text-emerald-400 font-semibold text-xs tracking-wider uppercase mt-0.5">Balamban PHIC ACPN Portal</p>
          <p className="text-[11px] text-slate-400 mt-1">Professional Fee Sharing & Claims Verification</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">User Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                    role === 'admin' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Admin / Billing
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                    role === 'doctor' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600" /> Doctor Portal
                </button>
              </div>
            </div>

            {role === 'doctor' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor Profile</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Juson">Dr. Juson (Surgeon / Attending)</option>
                  <option value="Alpas-Dela Peña">Dr. Alpas-Dela Peña (OB-GYN / Surgeon)</option>
                  <option value="Torralba">Dr. Torralba (Surgeon)</option>
                  <option value="Lanorias">Dr. Lanorias (Anesthesiologist)</option>
                  <option value="Rosell">Dr. Kurt Peter Rosell (NICU Specialist)</option>
                  <option value="Castro, Leidenia I.">Dr. Castro, Leidenia I. (Pediatrician)</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="admin@cphbalamban.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
            >
              Sign In to Dashboard
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center mb-2">Quick 1-Click Demo Access</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
              >
                ⚡ Admin Mode
              </button>
              <button
                onClick={() => handleQuickLogin('doctor', 'Alpas-Dela Peña')}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition"
              >
                ⚡ Doctor Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}