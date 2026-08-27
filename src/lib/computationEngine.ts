import { CaseItem, DoctorSummaryItem, DoctorHourShare } from '@/types';

export const OFFICIAL_EXCEL_REMARKS = [
  '1D',
  '49080',
  'BTL',
  'C/S',
  'C/S BTL',
  'C/S FP',
  'D/C',
  'Dental',
  'FP',
  'FP?',
  'Hemo',
  'HRPU',
  'HRPU FP',
  'ICU',
  'ICU/IJ',
  'IJ',
  'IJ?',
  'IUD',
  'NICU',
  'Pedia',
  'PM'
];

export function recalculateCase(c: Partial<CaseItem>): CaseItem {
  const totalAmount = c.totalAmount || 0;
  const remarks = (c.remarks || '').trim();
  const remUpper = remarks.toUpperCase();
  const isHemo = remUpper.includes('HEMO') || remarks === '90935';
  const hasSurgeon = Boolean(c.surgeon && c.surgeon.trim() !== '');
  const hasAnesth = Boolean(c.anesth && c.anesth.trim() !== '');
  const hasImPedia = Boolean(c.imPediaGp && c.imPediaGp.trim() !== '');

  // Determine Pool Rate based on Excel Rules
  let poolRate = 0.50; // default 50% for 1D, Dental, Solo GP

  if (isHemo) {
    poolRate = 0.15; // 15% Pool for Hemodialysis
  } else if (remUpper === '49080') {
    poolRate = 0.35; // 35% pool
  } else if (
    remUpper.includes('C/S') ||
    remUpper.includes('OR CASE') ||
    remUpper.includes('PM') ||
    remUpper.includes('BTL') ||
    remUpper.includes('IUD') ||
    remUpper.includes('FP') ||
    remUpper.includes('HRPU') ||
    remUpper.includes('ICU') ||
    remUpper.includes('NICU') ||
    remUpper.includes('IJ') ||
    (hasSurgeon && hasAnesth)
  ) {
    poolRate = 0.20; // 20% pool
  }

  const forPool = totalAmount * poolRate;
  const balance = totalAmount - forPool;

  let hemo = 0;
  let hemoIm = 0;
  let surgeonShare = 0;
  let anesthShare = 0;
  let im = 0;
  let pedia = 0;

  if (isHemo) {
    hemo = totalAmount * 0.5714;
    hemoIm = totalAmount * 0.2786;
  } else {
    let netAfterImpedia = balance;
    if (hasImPedia && (hasSurgeon || hasAnesth)) {
      const imPediaShare = balance * 0.10; // 10% IM/Pedia
      im = imPediaShare;
      netAfterImpedia = balance - imPediaShare;
    }

    if (hasSurgeon && hasAnesth) {
      surgeonShare = netAfterImpedia * 0.70; // 70% Surgeon
      anesthShare = netAfterImpedia * 0.30; // 30% Anesth
    } else if (hasSurgeon) {
      surgeonShare = netAfterImpedia;
    } else if (hasAnesth) {
      anesthShare = netAfterImpedia;
    } else if (hasImPedia) {
      im = netAfterImpedia;
    }
  }

  return {
    id: c.id || `case-${Date.now()}`,
    itemNo: c.itemNo || '1',
    patientName: c.patientName || '',
    surgeon: c.surgeon || '',
    anesth: c.anesth || '',
    imPediaGp: c.imPediaGp || '',
    remarks: c.remarks || '1D',
    totalAmount,
    forPool,
    balance,
    surgeonShare,
    anesthShare,
    im,
    pedia,
    hemo,
    hemoIm,
    month: c.month,
    isArchived: c.isArchived
  };
}

export function computeDoctorSummary(cases: CaseItem[]): DoctorSummaryItem[] {
  const map = new Map<string, { grossPf: number; totalCases: number; specialty: string }>();

  cases.forEach(c => {
    if (c.surgeon && c.surgeon.trim() !== '') {
      const s = c.surgeon.trim();
      const share = c.surgeonShare || 0;
      const current = map.get(s) || { grossPf: 0, totalCases: 0, specialty: 'Attending / Surgeon' };
      map.set(s, {
        grossPf: current.grossPf + share,
        totalCases: current.totalCases + 1,
        specialty: current.specialty
      });
    }

    if (c.anesth && c.anesth.trim() !== '') {
      const a = c.anesth.trim();
      const share = c.anesthShare || 0;
      const current = map.get(a) || { grossPf: 0, totalCases: 0, specialty: 'Anesthesiologist' };
      map.set(a, {
        grossPf: current.grossPf + share,
        totalCases: current.totalCases + 1,
        specialty: 'Anesthesiologist'
      });
    }

    if (c.imPediaGp && c.imPediaGp.trim() !== '') {
      const im = c.imPediaGp.trim();
      const share = (c.im || 0) + (c.pedia || 0) + (c.hemoIm || 0);
      if (share > 0) {
        const current = map.get(im) || { grossPf: 0, totalCases: 0, specialty: 'IM / Pediatrician' };
        map.set(im, {
          grossPf: current.grossPf + share,
          totalCases: current.totalCases + 1,
          specialty: 'IM / Pediatrician'
        });
      }
    }
  });

  const results: DoctorSummaryItem[] = [];
  map.forEach((value, key) => {
    const wtax20 = value.grossPf * 0.20;
    const netPf = value.grossPf - wtax20;
    results.push({
      doctorName: key,
      specialty: value.specialty,
      totalCases: value.totalCases,
      grossPf: value.grossPf,
      wtax20,
      netPf
    });
  });

  return results.sort((a, b) => b.grossPf - a.grossPf);
}

export function computeNicuHours(
  totalNicuGross: number,
  specialistFee: number,
  doctors: { name: string; hours: number; role: string; status: string }[]
): DoctorHourShare[] {
  const netPool = Math.max(0, totalNicuGross - specialistFee);
  const totalHours = doctors.reduce((sum, d) => sum + (d.hours || 0), 0);

  return doctors.map(d => {
    const share = totalHours > 0 ? (netPool * (d.hours / totalHours)) : 0;
    return {
      name: d.name,
      role: d.role,
      status: d.status,
      hours: d.hours,
      share
    };
  });
}

export function computePediaImHours(
  totalPool: number,
  doctors: { name: string; hours: number; role: string; status: string }[]
): DoctorHourShare[] {
  const totalHours = doctors.reduce((sum, d) => sum + (d.hours || 0), 0);

  return doctors.map(d => {
    const share = totalHours > 0 ? (totalPool * (d.hours / totalHours)) : 0;
    return {
      name: d.name,
      role: d.role,
      status: d.status,
      hours: d.hours,
      share
    };
  });
}