'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PeriodContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthsList: string[];
}

const PeriodContext = createContext<PeriodContextType>({
  selectedMonth: 'JUNE 2026',
  setSelectedMonth: () => {},
  monthsList: ['JUNE 2026', 'JULY 2026', 'AUGUST 2026'],
});

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('JUNE 2026');
  const monthsList = ['JUNE 2026', 'JULY 2026', 'AUGUST 2026', 'ALL'];

  useEffect(() => {
    const saved = localStorage.getItem('cph_selected_month');
    if (saved) setSelectedMonth(saved);
  }, []);

  const handleSetMonth = (m: string) => {
    setSelectedMonth(m);
    localStorage.setItem('cph_selected_month', m);
  };

  return (
    <PeriodContext.Provider value={{ selectedMonth, setSelectedMonth: handleSetMonth, monthsList }}>
      {children}
    </PeriodContext.Provider>
  );
}

export const usePeriod = () => useContext(PeriodContext);