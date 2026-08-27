'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Hospital, ShieldCheck, Stethoscope, Lock, User, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { OFFICIAL_DOCTORS_ROSTER } from '@/lib/acpnParser';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'doctor' | 'billing'>('admin');
  const [selectedDoctor, setSelectedDoctor] = useState(OFFICIAL_DOCTORS_ROSTER[8] || 'JUSON, JEREMIAH JADE T.');

  // Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'admin@cphbalamban.gov.ph', role, role === 'doctor' ? selectedDoctor : undefined);
    router.push('/');
  };

  const handleQuickLogin = (asRole: 'admin' | 'doctor' | 'billing', doc?: string) => {
    login(`${asRole}@cphbalamban.gov.ph`, asRole, asRole === 'doctor' ? (doc || OFFICIAL_DOCTORS_ROSTER[0]) : undefined);
    router.push('/');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim()) {
      return setResetError('Please enter your registered email address.');
    }
    if (!newPassword || newPassword.length < 4) {
      return setResetError('Password must be at least 4 characters long.');
    }
    if (newPassword !== confirmNewPassword) {
      return setResetError('New passwords do not match. Please re-type.');
    }

    // Update in localStorage cph_users_list if user exists, or record admin reset
    const savedUsers = localStorage.getItem('cph_users_list');
    let userList: any[] = [];
    if (savedUsers) {
      try { userList = JSON.parse(savedUsers); } catch (err) {}
    }

    const foundIdx = userList.findIndex(u => u.email.toLowerCase() === resetEmail.toLowerCase());
    if (foundIdx !== -1) {
      userList[foundIdx].password = newPassword;
      localStorage.setItem('cph_users_list', JSON.stringify(userList));
    } else {
      // Create or update default admin credential in storage
      userList.push({
        id: `usr-${Date.now()}`,
        name: 'System User',
        email: resetEmail,
        password: newPassword,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('cph_users_list', JSON.stringify(userList));
    }

    setResetSuccess(`Password for "${resetEmail}" has been reset successfully! You can now log in.`);
    setTimeout(() => {
      setEmail(resetEmail);
      setPassword(newPassword);
      setIsForgotPasswordOpen(false);
      setResetSuccess(null);
    }, 1800);
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  {OFFICIAL_DOCTORS_ROSTER.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address / Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="admin@cphbalamban.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email || 'admin@cphbalamban.gov.ph');
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-2"
            >
              Sign In to Dashboard
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center mb-2">Quick 1-Click Access</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
              >
                ⚡ Admin Mode
              </button>
              <button
                onClick={() => handleQuickLogin('doctor', OFFICIAL_DOCTORS_ROSTER[0])}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition"
              >
                ⚡ Doctor Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Reset Account Password</h3>
                <p className="text-xs text-slate-500">Enter your email and set a new password</p>
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@cphbalamban.gov.ph"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min. 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow transition"
                >
                  Update & Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}