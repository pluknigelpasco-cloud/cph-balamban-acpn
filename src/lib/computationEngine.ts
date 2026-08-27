import { CaseItem, DoctorSummaryItem, DoctorHourShare } from '@/types';

export function recalculateCase(c: Partial<CaseItem>): CaseItem {
  const totalAmount = c.totalAmount || 0;
  const remarks = (c.remarks || '').trim();
  const isHemo = remarks.toLowerCase().includes('hemo') || remarks === '90935';
  const hasSurgeon = Boolean(c.surgeon && c.surgeon.trim() !== '');
  const hasAnesth = Boolean(c.anesth && c.anesth.trim() !== '');
  const hasImPedia = Boolean(c.imPediaGp && c.imPediaGp.trim() !== '');

  // 1. Determine Pool Rate
  let poolRate = 0.50; // default 50% for 1D, Dental, Solo GP
  if (isHemo) {
    poolRate = 0.15; // 15% Pool for Hemodialysis
  } else if (remarks === '49080') {
    poolRate = 0.35; // 35% pool
  } else if (remarks === 'C/S' || remarks === 'OR Case' || remarks === 'BTL' || (hasSurgeon && hasAnesth)) {
    poolRate = 0.20; // 20% pool for OR Cases with Surgeon & Anesth
  }

  const forPool = totalAmount * poolRate;
  const balance = totalAmount - forPool;

  // 2. HEMO Specific Calculations (57.14% Hemo, 27.86% Hemo-IM)
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
    // Standard Surgical / Medical Sharing
    let netAfterImpedia = balance;
    if (hasImPedia && (hasSurgeon || hasAnesth)) {
      const imPediaShare = balance * 0.10; // 10% for IM/Pedia
      im = imPediaShare;
      netAfterImpedia = balance - imPediaShare;
    }

    if (hasSurgeon && hasAnesth) {
      surgeonShare = netAfterImpedia * 0.70; // 70% Surgeon
      anesthShare = netAfterImpedia * 0.30; // 30% Anesth
    } else if (hasSurgeon) {
      surgeonShare = netAfterImpedia; // 100% Solo Surgeon / Attending
    } else if (hasAnesth) {
      anesthShare = netAfterImpedia;
    } else if (hasImPedia) {
      im = netAfterImpedia; // Solo Attending Physician
    }
  }

  return {
    id: c.id || `case-${Date.now()}`,
    itemNo: c.itemNo || '1',
    patientName: c.patientName || '',
    surgeon: c.surgeon || '',
    anesth: c.anesth || '',
    imPediaGp: c.imPediaGp || '',
    remarks: isHemo ? 'Hemo' : (c.remarks || '1D'),
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
    // 1. Surgeon
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

    // 2. Anesth
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

    // 3. IM / Pedia / Hemo-IM
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