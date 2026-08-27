'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, ShieldCheck, Stethoscope, User, Lock, Mail, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'billing' | 'doctor' | 'staff';
  doctorName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const defaultUsers: AppUser[] = [
  {
    id: 'u-1',
    name: 'PHIC Billing Administrator',
    email: 'admin@cphbalamban.gov.ph',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'u-2',
    name: 'Chief Billing Officer',
    email: 'billing@cphbalamban.gov.ph',
    role: 'billing',
    status: 'active',
    createdAt: '2026-02-01'
  },
  {
    id: 'u-3',
    name: 'Dr. Jeremiah Jade Juson',
    email: 'juson@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'Juson',
    status: 'active',
    createdAt: '2026-02-10'
  },
  {
    id: 'u-4',
    name: 'Dr. Alpas-Dela Peña',
    email: 'alpas@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'Alpas-Dela Peña',
    status: 'active',
    createdAt: '2026-02-12'
  },
  {
    id: 'u-5',
    name: 'Dr. Kurt Peter Rosell',
    email: 'rosell@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'Rosell',
    status: 'active',
    createdAt: '2026-03-01'
  }
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'billing' | 'doctor' | 'staff'>('doctor');
  const [formDoctorName, setFormDoctorName] = useState('Juson');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cph_users_list');
    if (saved) {
      try { setUsers(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveUsersToStorage = (updated: AppUser[]) => {
    setUsers(updated);
    localStorage.setItem('cph_users_list', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('doctor');
    setFormDoctorName('Juson');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: AppUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormDoctorName(u.doctorName || 'Juson');
    setFormStatus(u.status);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      return alert('Please fill in name and email.');
    }

    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formName,
        email: formEmail,
        role: formRole,
        doctorName: formRole === 'doctor' ? formDoctorName : undefined,
        status: formStatus
      } : u);
      saveUsersToStorage(updated);
    } else {
      const newUser: AppUser = {
        id: `u-${Date.now()}`,
        name: formName,
        email: formEmail,
        role: formRole,
        doctorName: formRole === 'doctor' ? formDoctorName : undefined,
        status: formStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      saveUsersToStorage([newUser, ...users]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this user account?')) {
      const updated = users.filter(u => u.id !== id);
      saveUsersToStorage(updated);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? {
      ...u,
      status: u.status === 'active' ? 'inactive' : 'active'
    } as AppUser : u);
    saveUsersToStorage(updated);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.doctorName && u.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              SYSTEM ACCESS CONTROL
            </span>
            <span className="text-xs text-slate-500">Role-Based Permissions (Admin vs Doctor)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">User & Role Management</h1>
          <p className="text-sm text-slate-500">
            Create, assign roles, edit credentials, and manage system access for Administrators, Billing Officers, and Doctors.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or assigned doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="admin">Administrators</option>
            <option value="billing">Billing Officers</option>
            <option value="doctor">Doctors</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-white font-semibold">
            <tr>
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3 min-w-[180px]">User Name</th>
              <th className="p-3 min-w-[200px]">Email Address</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">Linked Doctor Profile</th>
              <th className="p-3 text-center">Account Status</th>
              <th className="p-3 font-mono">Date Created</th>
              <th className="p-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((u, i) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3 text-center font-mono text-slate-500">{i + 1}</td>
                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                    {u.name[0]}
                  </div>
                  {u.name}
                </td>
                <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    u.role === 'doctor' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                    {u.role === 'doctor' && <Stethoscope className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-800 font-medium">
                  {u.doctorName ? (
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px] border border-slate-200">
                      {u.doctorName}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">N/A (All Access)</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleToggleStatus(u.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {u.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    {u.status}
                  </button>
                </td>
                <td className="p-3 text-slate-500 font-mono">{u.createdAt}</td>
                <td className="p-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1 text-slate-400 hover:text-emerald-600"
                      title="Edit User"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{editingUser ? 'Edit User Account' : 'Create New User Account'}</h3>
                <p className="text-xs text-slate-500">Configure role access and credentials</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jeremiah Jade Juson"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. juson@cphbalamban.gov.ph"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="doctor">🩺 Doctor (Personal Claims & Payslips)</option>
                  <option value="billing">💼 Billing Officer (Data Entry & Verification)</option>
                  <option value="admin">🛡️ Administrator (Full Control)</option>
                  <option value="staff">👤 Hospital Staff (Read-only)</option>
                </select>
              </div>

              {formRole === 'doctor' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Doctor Profile</label>
                  <select
                    value={formDoctorName}
                    onChange={(e) => setFormDoctorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Juson">Dr. Juson (Surgeon / Attending)</option>
                    <option value="Alpas-Dela Peña">Dr. Alpas-Dela Peña (OB-GYN / Surgeon)</option>
                    <option value="Torralba">Dr. Torralba (Surgeon)</option>
                    <option value="Lanorias">Dr. Lanorias (Anesthesiologist)</option>
                    <option value="Moralde">Dr. Moralde (Anesthesiologist)</option>
                    <option value="Rosell">Dr. Kurt Peter Rosell (NICU Specialist)</option>
                    <option value="Castro, Leidenia I.">Dr. Castro, Leidenia I. (Pediatrician)</option>
                    <option value="Tacaldo">Dr. Tacaldo (Nephrologist / HEMO)</option>
                    <option value="Seeto">Dr. Seeto (Nephrologist / HEMO)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="active">Active (Can Login)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}