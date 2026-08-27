import { CaseItem, DoctorSummaryItem, DoctorHourShare } from '@/types';

/**
 * Recalculate a single Case Row based on Excel formulas
 */
export function recalculateCase(item: Partial<CaseItem>): CaseItem {
  const totalAmount = Number(item.totalAmount) || 0;
  const remarks = (item.remarks || '').trim().toUpperCase();
  const surgeon = (item.surgeon || '').trim();
  const anesth = (item.anesth || '').trim();
  const imPediaGp = (item.imPediaGp || '').trim();

  // Excel logic for FOR POOL:
  // 1D or dental or single doc typically 50% (0.5), PM 20% (0.2), OR cases with surgeon+anesth 20% (0.2) or 35% (0.35)
  let poolRate = 0.20; // default 20%
  if (remarks === '1D' || remarks.includes('DENTAL') || remarks === 'D/C' || (!anesth && !imPediaGp && totalAmount > 0)) {
    poolRate = 0.50;
  } else if (remarks === '49080') {
    poolRate = 0.35;
  } else if (remarks.includes('PM')) {
    poolRate = 0.20;
  }

  const forPool = item.forPool !== undefined && item.forPool > 0 ? Number(item.forPool) : (totalAmount * poolRate);
  const balance = totalAmount - forPool;

  const providerShare = Number(item.providerShare) || 0;
  const teamShare = Number(item.teamShare) || 0;
  const icu = Number(item.icu) || 0;
  const nicu = Number(item.nicu) || 0;
  const perinat = Number(item.perinat) || 0;
  const providerTotal = providerShare + teamShare + icu + nicu + perinat;

  const afterPoolProvider = balance - providerTotal;

  // IM / Pedia cuts (10% if specified)
  const pedia = item.pedia !== undefined ? Number(item.pedia) : (imPediaGp.toLowerCase().includes('pedia') ? afterPoolProvider * 0.1 : 0);
  const im = item.im !== undefined ? Number(item.im) : (imPediaGp.toLowerCase().includes('im') ? afterPoolProvider * 0.1 : 0);

  const afterImPedia = afterPoolProvider - pedia - im;

  // Surgeon & Anesth distribution:
  // If Anesth is present: Surgeon = 70%, Anesth = 30%
  // If No Anesth: Surgeon = 100%
  let surgeonShare = 0;
  let anesthShare = 0;

  if (surgeon && anesth) {
    surgeonShare = afterImPedia * 0.70;
    anesthShare = afterImPedia * 0.30;
  } else if (surgeon) {
    surgeonShare = afterImPedia * 1.0;
    anesthShare = 0;
  } else if (anesth) {
    anesthShare = afterImPedia * 1.0;
  }

  const hemo = Number(item.hemo) || 0;
  const hemoIm = Number(item.hemoIm) || 0;

  return {
    id: item.id || `case-${Date.now()}-${Math.random()}`,
    itemNo: item.itemNo || '1',
    patientName: item.patientName || '',
    surgeon,
    anesth,
    imPediaGp,
    remarks: item.remarks || '',
    provider: Number(item.provider) || 0,
    btlFp: Number(item.btlFp) || 0,
    totalAmount,
    forPool,
    balance,
    providerTotal,
    providerShare,
    teamShare,
    icu,
    nicu,
    perinat,
    afterPoolProvider,
    pedia,
    im,
    afterImPedia,
    surgeonShare,
    anesthShare,
    hemo,
    hemoIm
  };
}

/**
 * Compute NICU / ICU Shares by Doctor Duty Hours
 */
export function computeNicuHours(totalNicu: number, specialistCut: number, doctors: { name: string; role: string; status: string; hours: number }[]): DoctorHourShare[] {
  const netPool = Math.max(0, totalNicu - specialistCut);
  const totalHours = doctors.reduce((sum, d) => sum + (d.hours || 0), 0);
  
  return doctors.map(d => {
    const share = totalHours > 0 ? (netPool * (d.hours / totalHours)) : 0;
    return {
      ...d,
      share
    };
  });
}

/**
 * Compute Pedia / IM Hours Shares
 */
export function computePediaImHours(totalPool: number, doctors: { name: string; role: string; status: string; hours: number }[]): DoctorHourShare[] {
  const totalHours = doctors.reduce((sum, d) => sum + (d.hours || 0), 0);
  return doctors.map(d => {
    const share = totalHours > 0 ? (totalPool * (d.hours / totalHours)) : 0;
    return {
      ...d,
      share
    };
  });
}

/**
 * Compute Master Doctor Summary with 20% WTax
 */
export function computeDoctorSummary(cases: CaseItem[], additionalDepartmentShares: { doctorName: string; amount: number }[] = []): DoctorSummaryItem[] {
  const docMap: { [name: string]: { totalCases: number; grossPf: number; specialty: string } } = {};

  cases.forEach(c => {
    if (c.surgeon) {
      if (!docMap[c.surgeon]) docMap[c.surgeon] = { totalCases: 0, grossPf: 0, specialty: 'Surgeon / OB-GYN' };
      docMap[c.surgeon].totalCases += 1;
      docMap[c.surgeon].grossPf += c.surgeonShare;
    }
    if (c.anesth) {
      if (!docMap[c.anesth]) docMap[c.anesth] = { totalCases: 0, grossPf: 0, specialty: 'Anesthesiologist' };
      docMap[c.anesth].totalCases += 1;
      docMap[c.anesth].grossPf += c.anesthShare;
    }
    if (c.imPediaGp) {
      const parts = c.imPediaGp.split(/[/;,]/).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        if (!docMap[p]) docMap[p] = { totalCases: 0, grossPf: 0, specialty: 'IM / Pedia / Attending' };
        docMap[p].totalCases += 1;
        docMap[p].grossPf += ((c.pedia + c.im) / parts.length);
      });
    }
  });

  additionalDepartmentShares.forEach(add => {
    if (!docMap[add.doctorName]) docMap[add.doctorName] = { totalCases: 0, grossPf: 0, specialty: 'Department Specialist' };
    docMap[add.doctorName].grossPf += add.amount;
  });

  return Object.keys(docMap).sort().map(name => {
    const gross = docMap[name].grossPf;
    const wtax = gross * 0.20; // 20% WTax as per June 2026 sheet
    const netPf = gross - wtax;
    return {
      doctorName: name,
      specialty: docMap[name].specialty,
      totalCases: docMap[name].totalCases,
      grossPf: gross,
      wtax20: wtax,
      netPf: netPf,
      medicalShare: netPf * 0.5,
      nonMedicalShare: netPf * 0.5
    };
  });
}