'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, FileText, UserCheck, Hospital, RotateCcw, Lock, KeyRound, Eye, EyeOff, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface HospitalSignatories {
  preparedByName: string;
  preparedByTitle: string;
  chiefOfHospitalName: string;
  chiefOfHospitalTitle: string;
  facilityName: string;
  facilityAddress: string;
  hciNo: string;
}

const defaultSignatories: HospitalSignatories = {
  preparedByName: 'EDILOU',
  preparedByTitle: 'Billing & Claims In-Charge',
  chiefOfHospitalName: 'OLIVIA A. DANDAN, MD., MPH',
  chiefOfHospitalTitle: 'Chief of Hospital II',
  facilityName: 'CEBU PROVINCIAL HOSPITAL (BALAMBAN)',
  facilityAddress: 'Pilapil St., Baliwagan, Balamban Cebu',
  hciNo: 'H07020344'
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [signatories, setSignatories] = useState<HospitalSignatories>(defaultSignatories);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isAdminOrBilling = user?.role === 'admin' || user?.role === 'billing';

  useEffect(() => {
    const saved = localStorage.getItem('cph_hospital_signatories');
    if (saved) {
      try {
        setSignatories(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSaveSignatories = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cph_hospital_signatories', JSON.stringify(signatories));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset signatories back to default values?')) {
      setSignatories(defaultSignatories);
      localStorage.setItem('cph_hospital_signatories', JSON.stringify(defaultSignatories));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      return setPasswordError('Please enter your current password.');
    }

    const savedUsersStr = localStorage.getItem('cph_users_list');
    let usersList: any[] = [];
    if (savedUsersStr) {
      try { usersList = JSON.parse(savedUsersStr); } catch (e) {}
    }

    const userEmail = user?.email || 'admin@cphbalamban.gov.ph';
    const existingUser = usersList.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    
    // Default initial password is 'admin' or 'doctor' if not yet explicitly modified
    const expectedPassword = existingUser?.password || (user?.role === 'doctor' ? 'doctor' : 'admin');

    if (currentPassword !== expectedPassword) {
      return setPasswordError('Incorrect current password. Please enter your valid existing password.');
    }

    if (!newPassword || newPassword.length < 4) {
      return setPasswordError('New password must be at least 4 characters long.');
    }
    if (newPassword === currentPassword) {
      return setPasswordError('New password must be different from your current password.');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('New password and confirmation do not match.');
    }

    const existingIdx = usersList.findIndex(u => u.email.toLowerCase() === userEmail.toLowerCase());

    if (existingIdx !== -1) {
      usersList[existingIdx].password = newPassword;
      localStorage.setItem('cph_users_list', JSON.stringify(usersList));
    } else {
      usersList.push({
        id: `u-${Date.now()}`,
        name: user?.name || 'User',
        email: userEmail,
        password: newPassword,
        role: user?.role || 'admin',
        doctorName: user?.doctorName,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('cph_users_list', JSON.stringify(usersList));
    }

    setPasswordSuccess('Your password has been updated and verified successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ACCOUNT & SYSTEM CONFIGURATION
            </span>
            <span className="text-xs text-slate-500">Security and Document Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isAdminOrBilling ? 'Signatories & Account Settings' : 'Account & Security Settings'}
          </h1>
          <p className="text-sm text-slate-500">
            Manage your account password, security credentials, and official hospital document designations.
          </p>
        </div>

        {isAdminOrBilling && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>
        )}
      </div>

      {/* 1. CHANGE PASSWORD CARD (Accessible to All Users & Doctors) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Change Account Password</h2>
            <p className="text-xs text-slate-500">
              Update password for <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your existing current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 4 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Lock className="w-3.5 h-3.5" /> Verify & Update Password
          </button>
        </form>
      </div>

      {/* 2. HOSPITAL SIGNATORIES & SETTINGS (Admin & Billing Only) */}
      {isAdminOrBilling && (
        <>
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Hospital Signatories and Document Settings saved successfully! All payslips are updated.</span>
            </div>
          )}

          <form onSubmit={handleSaveSignatories} className="space-y-6">
            {/* Signatories Configuration Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Official Document Signatories</h2>
                  <p className="text-xs text-slate-500">These names and titles will automatically appear on all printable payslips</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Prepared By */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      ✍️ Signatory 1: Prepared By
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">Billing Staff</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={signatories.preparedByName}
                      onChange={(e) => setSignatories({ ...signatories, preparedByName: e.target.value })}
                      placeholder="e.g. EDILOU"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={signatories.preparedByTitle}
                      onChange={(e) => setSignatories({ ...signatories, preparedByTitle: e.target.value })}
                      placeholder="e.g. Billing & Claims In-Charge"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* 2. Chief of Hospital */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      🏛️ Signatory 2: Chief of Hospital
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Hospital Head</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name with Medical Titles</label>
                    <input
                      type="text"
                      value={signatories.chiefOfHospitalName}
                      onChange={(e) => setSignatories({ ...signatories, chiefOfHospitalName: e.target.value })}
                      placeholder="e.g. OLIVIA A. DANDAN, MD., MPH"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={signatories.chiefOfHospitalTitle}
                      onChange={(e) => setSignatories({ ...signatories, chiefOfHospitalTitle: e.target.value })}
                      placeholder="e.g. Chief of Hospital II"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Facility Details Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
                  <Hospital className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hospital Facility & PHIC Accreditation</h2>
                  <p className="text-xs text-slate-500">Official heading details printed on voucher headers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Hospital Facility Name</label>
                  <input
                    type="text"
                    value={signatories.facilityName}
                    onChange={(e) => setSignatories({ ...signatories, facilityName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PHIC HCI Number</label>
                  <input
                    type="text"
                    value={signatories.hciNo}
                    onChange={(e) => setSignatories({ ...signatories, hciNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Facility Address / Location</label>
                  <input
                    type="text"
                    value={signatories.facilityAddress}
                    onChange={(e) => setSignatories({ ...signatories, facilityAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Live Print Voucher Signatories Preview
              </span>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800 text-center text-xs">
                <div>
                  <div className="border-b border-slate-600 pb-6"></div>
                  <p className="font-bold text-white mt-1 uppercase">{signatories.preparedByName || 'EDILOU'}</p>
                  <p className="text-[10px] text-slate-400">{signatories.preparedByTitle || 'Prepared By'}</p>
                </div>

                <div>
                  <div className="border-b border-slate-600 pb-6"></div>
                  <p className="font-bold text-white mt-1">{signatories.chiefOfHospitalName || 'OLIVIA A. DANDAN, MD., MPH'}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">{signatories.chiefOfHospitalTitle || 'Chief of Hospital II'}</p>
                </div>

                <div>
                  <div className="border-b border-slate-600 pb-6"></div>
                  <p className="font-bold text-white mt-1">[DOCTOR'S NAME]</p>
                  <p className="text-[10px] text-slate-400">Doctor Conforme / Received By</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                <Save className="w-4 h-4" /> Save Signatories & System Settings
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}