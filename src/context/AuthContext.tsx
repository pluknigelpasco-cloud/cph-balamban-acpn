'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, role: 'admin' | 'billing' | 'doctor' | 'staff', doctorName?: string, permissions?: string[]) => void;
  logout: () => void;
  hasPermission: (moduleKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cph_auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Default to Admin session
      const defaultAdmin: UserProfile = {
        id: 'u-admin-1',
        name: 'PHIC Administrator',
        email: 'admin@cphbalamban.gov.ph',
        role: 'admin',
        permissions: ['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export', 'users'],
        status: 'active'
      };
      setUser(defaultAdmin);
      localStorage.setItem('cph_auth_user', JSON.stringify(defaultAdmin));
    }
  }, []);

  const login = (email: string, role: 'admin' | 'billing' | 'doctor' | 'staff', doctorName?: string, customPermissions?: string[]) => {
    // Check if user exists in saved users list to inherit specific permissions
    let perms = customPermissions;
    if (!perms) {
      const savedUsersStr = localStorage.getItem('cph_users_list');
      if (savedUsersStr) {
        try {
          const list: any[] = JSON.parse(savedUsersStr);
          const found = list.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (found && found.permissions) {
            perms = found.permissions;
          }
        } catch (err) {}
      }
    }

    if (!perms) {
      if (role === 'admin') perms = ['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export', 'users'];
      else if (role === 'billing') perms = ['dashboard', 'upload', 'cases', 'doctor_summary', 'departments', 'export'];
      else if (role === 'doctor') perms = ['dashboard', 'cases', 'doctor_summary']; // Departments UNCHECKED by default
      else perms = ['dashboard'];
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: role === 'doctor' ? `Dr. ${doctorName || 'Physician'}` : (email.split('@')[0].toUpperCase()),
      email,
      role,
      doctorName,
      permissions: perms,
      status: 'active'
    };
    setUser(newUser);
    localStorage.setItem('cph_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cph_auth_user');
    window.location.href = '/login';
  };

  const hasPermission = (moduleKey: string) => {
    if (!user) return false;
    if (user.role === 'admin' && (!user.permissions || user.permissions.length === 0)) return true;
    if (!user.permissions) {
      if (user.role === 'doctor') return ['dashboard', 'cases', 'doctor_summary'].includes(moduleKey);
      return true;
    }
    return user.permissions.includes(moduleKey);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}