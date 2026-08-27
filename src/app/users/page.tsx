'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, ShieldCheck, Stethoscope, User, Lock, Mail, CheckCircle2, XCircle, Search, CheckSquare, Square, Layers, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OFFICIAL_DOCTORS_ROSTER } from '@/lib/acpnParser';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'billing' | 'doctor' | 'staff';
  doctorName?: string;
  permissions?: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

const SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Executive Dashboard / My Overview', path: '/', description: 'View high-level KPIs and monthly totals' },
  { id: 'upload', label: 'Upload ACPN PDF', path: '/upload', description: 'Bulk PDF uploader and claim parser' },
  { id: 'cases', label: 'Cases Master Grid', path: '/cases', description: 'Master spreadsheet and sharing formula engine' },
  { id: 'doctor_summary', label: 'Doctor PF & 20% WTax', path: '/doctor-summary', description: 'Doctor compensation summary & printable payslips' },
  { id: 'departments', label: 'Department Shares (HEMO, NICU, Pedia, BTL, PM)', path: '/departments', description: 'Departmental sharing matrix & entries' },
  { id: 'export', label: 'Export & Reports', path: '/export', description: 'Generate and download Excel (.xlsx) and PDF reports' },
  { id: 'users', label: 'User & Role Management', path: '/users', description: 'Manage accounts and module permissions' }
];

const defaultUsers: AppUser[] = [
  {
    id: 'u-1',
    name: 'PHIC Billing Administrator',
    email: 'admin@cphbalamban.gov.ph',
    role: 'admin',
    permissions: ['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export', 'users'],
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'u-2',
    name: 'Chief Billing Officer',
    email: 'billing@cphbalamban.gov.ph',
    role: 'billing',
    permissions: ['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export'],
    status: 'active',
    createdAt: '2026-02-01'
  },
  {
    id: 'u-3',
    name: 'Dr. Jeremiah Jade Juson',
    email: 'juson@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'JUSON, JEREMIAH JADE T.',
    permissions: ['dashboard', 'cases', 'doctor_summary'], // Department Shares UNCHECKED
    status: 'active',
    createdAt: '2026-02-10'
  },
  {
    id: 'u-4',
    name: 'Dr. April Ann Alpas-Dela Peña',
    email: 'alpas@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'ALPAS-DELA PEÑA, APRIL ANN M.',
    permissions: ['dashboard', 'cases', 'doctor_summary'], // Department Shares UNCHECKED
    status: 'active',
    createdAt: '2026-02-12'
  },
  {
    id: 'u-5',
    name: 'Dr. Kurt Peter Rosell',
    email: 'rosell@cphbalamban.gov.ph',
    role: 'doctor',
    doctorName: 'ROSELL, KURT PETER',
    permissions: ['dashboard', 'cases', 'doctor_summary'], // Department Shares UNCHECKED
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
  const [formDoctorName, setFormDoctorName] = useState(OFFICIAL_DOCTORS_ROSTER[0]);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<string[]>(['dashboard', 'cases', 'doctor_summary']);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cph_users_list');
    if (saved) {
      try { setUsers(JSON.parse(saved)); } catch (e) {}
    } else {
      localStorage.setItem('cph_users_list', JSON.stringify(defaultUsers));
    }
  }, []);

  const saveUsersToStorage = (updated: AppUser[]) => {
    setUsers(updated);
    localStorage.setItem('cph_users_list', JSON.stringify(updated));
  };

  const handleRoleChange = (newRole: 'admin' | 'billing' | 'doctor' | 'staff') => {
    setFormRole(newRole);
    if (newRole === 'admin') {
      setFormPermissions(SYSTEM_MODULES.map(m => m.id));
    } else if (newRole === 'billing') {
      setFormPermissions(['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export']);
    } else if (newRole === 'doctor') {
      // Doctor default: Department shares, Upload, Export, Users are UNCHECKED
      setFormPermissions(['dashboard', 'cases', 'doctor_summary']);
    } else {
      setFormPermissions(['dashboard']);
    }
  };

  const handleTogglePermission = (moduleId: string) => {
    if (formPermissions.includes(moduleId)) {
      setFormPermissions(formPermissions.filter(id => id !== moduleId));
    } else {
      setFormPermissions([...formPermissions, moduleId]);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('doctor');
    setFormDoctorName(OFFICIAL_DOCTORS_ROSTER[0]);
    setFormStatus('active');
    setFormPermissions(['dashboard', 'cases', 'doctor_summary']); // Default doctor: No dept shares
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: AppUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormDoctorName(u.doctorName || OFFICIAL_DOCTORS_ROSTER[0]);
    setFormStatus(u.status);
    setFormPermissions(u.permissions || (u.role === 'doctor' ? ['dashboard', 'cases', 'doctor_summary'] : SYSTEM_MODULES.map(m => m.id)));
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
        permissions: formPermissions,
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
        permissions: formPermissions,
        status: formStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      saveUsersToStorage([newUser, ...users]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user account?')) {
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
            <span className="text-xs text-slate-500">Modular Permission Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">User & Role Management</h1>
          <p className="text-sm text-slate-500">
            Configure accounts and check/uncheck module permissions (e.g. restrict Department Shares from doctors).
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
              <th className="p-3 min-w-[170px]">User Name</th>
              <th className="p-3 min-w-[180px]">Email Address</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">Linked Profile</th>
              <th className="p-3 min-w-[200px]">Allowed Modules</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((u, i) => {
              const perms = u.permissions || (u.role === 'doctor' ? ['dashboard', 'cases', 'doctor_summary'] : SYSTEM_MODULES.map(m => m.id));
              const canAccessDepts = perms.includes('departments');

              return (
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
                      <span className="text-slate-400 italic">Full Access</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {perms.map(p => (
                        <span key={p} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                          p === 'departments' ? (u.role === 'doctor' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-purple-50 text-purple-700 border-purple-200') :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {p === 'doctor_summary' ? 'PF & Payslips' : p}
                        </span>
                      ))}
                      {!canAccessDepts && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ No Dept Shares
                        </span>
                      )}
                    </div>
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
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-slate-400 hover:text-emerald-600"
                        title="Edit Permissions & User"
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal with Permissions Matrix */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{editingUser ? 'Edit User & Permissions' : 'Create New User Account'}</h3>
                <p className="text-xs text-slate-500">Assign role and check/uncheck module access</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="doctor">🩺 Doctor</option>
                    <option value="billing">💼 Billing Officer</option>
                    <option value="admin">🛡️ Administrator</option>
                    <option value="staff">👤 Hospital Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {formRole === 'doctor' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Official Doctor Roster</label>
                  <select
                    value={formDoctorName}
                    onChange={(e) => setFormDoctorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-900"
                  >
                    {OFFICIAL_DOCTORS_ROSTER.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Check / Uncheck Module Permissions Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold text-slate-900">
                    Module Access Permissions ({formPermissions.length} granted)
                  </label>
                  <span className="text-[10px] text-slate-500">Check / uncheck modules</span>
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-52 overflow-y-auto">
                  {SYSTEM_MODULES.map(mod => {
                    const isChecked = formPermissions.includes(mod.id);
                    const isDept = mod.id === 'departments';

                    return (
                      <label
                        key={mod.id}
                        onClick={() => handleTogglePermission(mod.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition border ${
                          isChecked ? 'bg-white border-emerald-300 shadow-sm' : 'bg-slate-100/60 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="pt-0.5 text-emerald-600">
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-xs ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                              {mod.label}
                            </span>
                            {isDept && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Protected Sharing Matrix
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
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
                  {editingUser ? 'Save Permissions & User' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}