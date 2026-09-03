'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const ALL_MONTHS_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const ALL_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

interface PeriodContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedMonthName: string;
  selectedYear: string;
  setMonthAndYear: (monthName: string, year: string) => void;
  monthsList: string[];
}

const PeriodContext = createContext<PeriodContextType>({
  selectedMonth: 'SEPTEMBER 2026',
  setSelectedMonth: () => {},
  selectedMonthName: 'SEPTEMBER',
  selectedYear: '2026',
  setMonthAndYear: () => {},
  monthsList: [],
});

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('SEPTEMBER 2026');

  // Parse Month and Year from selectedMonth
  const { selectedMonthName, selectedYear } = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'ALL') {
      return { selectedMonthName: 'SEPTEMBER', selectedYear: '2026' };
    }
    const parts = selectedMonth.trim().split(' ');
    if (parts.length >= 2) {
      return { selectedMonthName: parts[0].toUpperCase(), selectedYear: parts[1] };
    }
    return { selectedMonthName: 'SEPTEMBER', selectedYear: '2026' };
  }, [selectedMonth]);

  // Generate comprehensive list of 2025-2027 months + any stored custom periods
  const monthsList = useMemo(() => {
    const list: string[] = [];
    ALL_MONTHS_NAMES.forEach(m => list.push(`${m} 2026`));
    ALL_MONTHS_NAMES.forEach(m => list.push(`${m} 2025`));
    ALL_MONTHS_NAMES.forEach(m => list.push(`${m} 2027`));

    // Also check localStorage for any uploaded batches or custom months
    if (typeof window !== 'undefined') {
      const batches = localStorage.getItem('cph_acpn_batches');
      if (batches) {
        try {
          const parsed: any[] = JSON.parse(batches);
          parsed.forEach(b => {
            if (b.month && !list.includes(b.month)) list.push(b.month);
          });
        } catch (e) {}
      }
    }

    list.push('ALL');
    return list;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cph_selected_month');
    if (saved) {
      setSelectedMonth(saved);
    }
  }, []);

  const handleSetMonth = (m: string) => {
    setSelectedMonth(m);
    localStorage.setItem('cph_selected_month', m);
  };

  const setMonthAndYear = (monthName: string, year: string) => {
    const combined = `${monthName.toUpperCase()} ${year}`;
    setSelectedMonth(combined);
    localStorage.setItem('cph_selected_month', combined);
  };

  return (
    <PeriodContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth: handleSetMonth,
        selectedMonthName,
        selectedYear,
        setMonthAndYear,
        monthsList
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export const usePeriod = () => useContext(PeriodContext);