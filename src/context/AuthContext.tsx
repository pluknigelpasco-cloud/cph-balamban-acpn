'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  email: string;
  name: string;
  role: 'admin' | 'billing' | 'doctor';
  doctorName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, role: 'admin' | 'billing' | 'doctor', doctorName?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>({
    email: 'admin@cphbalamban.gov.ph',
    name: 'PHIC Billing Administrator',
    role: 'admin'
  });
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('cph_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const login = (email: string, role: 'admin' | 'billing' | 'doctor', doctorName?: string) => {
    let name = 'Administrator';
    if (role === 'doctor') name = doctorName || 'Dr. Juson';
    if (role === 'billing') name = 'Billing Officer';

    const profile: UserProfile = { email, name, role, doctorName };
    setUser(profile);
    localStorage.setItem('cph_user', JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cph_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);