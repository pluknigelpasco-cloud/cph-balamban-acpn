import { ClaimItem } from '@/types';

export const OFFICIAL_DOCTORS_ROSTER = [
  'ALPAS-DELA PEÑA, APRIL ANN M.',
  'ARDIENTE, KIRRBY S.',
  'BAJA, CLARICE P.',
  'CASTRO, LEIDENIA I.',
  'DANDAN, OLIVIA A.',
  'DELOS SANTOS, JERAMY A.',
  'EGONIA, HUBERT F.',
  'ESTALANI, CORA M.',
  'JUSON, JEREMIAH JADE T.',
  'KHO, SHERYL P.',
  'LANORIAS, DENNIS JR C.',
  'LASDOCE, KAZELINE L.',
  'LIBERATO, JAN FREDERICK T.',
  'MACHACON, KEITH M.',
  'MORALDE, KIERSTIENNE KAREN D.',
  'PAD-AY, MELANIE B.',
  'PEÑARANDA, CHARLENE LUZ L.',
  'RICO, RICHARD JANUS R.',
  'ROSELL, KURT PETER',
  'SEETO, LANIE RAE Y.',
  'TACALDO, RICKY JOY B.',
  'TAWASIL, ABU-KHAYRE O.',
  'TORRALBA, NOVA CARL V.',
  'VERANO-DUMDUM, RUSIENNE MAE A.'
];

export function sanitizeDoctorName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw
    .replace(/Credited/gi, '')
    .replace(/Date Generated:[\s\S]*$/gi, '')
    .replace(/Page\s+\d+[\s\S]*$/gi, '')
    .replace(/--\s+of\s+--/gi, '')
    .replace(/Run\s+Date:[\s\S]*$/gi, '')
    .replace(/\d{4}\s+\d{2}:\d{2}:\d{2}[\s\S]*$/gi, '')
    .replace(/AUTO CREDIT[\s\S]*$/gi, '')
    .replace(/PERIOD COVERED:[\s\S]*$/gi, '')
    .replace(/PABN No\.[\s\S]*$/gi, '')
    .replace(/GRAND TOTAL[\s\S]*$/gi, '')
    .replace(/Caserate[\s\S]*$/gi, '')
    .replace(/WTax[\s\S]*$/gi, '')
    .replace(/HCI[\s\S]*$/gi, '')
    .replace(/PF[\s\S]*$/gi, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  if (cleaned.includes(';')) {
    cleaned = cleaned.split(';')[0].trim();
  }

  cleaned = cleaned.replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z\.\s\-]+$/, '').trim();

  const upper = cleaned.toUpperCase();
  for (const doc of OFFICIAL_DOCTORS_ROSTER) {
    const lastName = doc.split(',')[0].trim();
    if (upper.includes(lastName)) {
      return doc;
    }
  }

  if (/Page|\d+|Date|PABN|WTax|Gross/i.test(cleaned) || cleaned.length < 3 || cleaned.length > 50) {
    return '';
  }

  return cleaned;
}

export function cleanDoctorString(raw: string): string[] {
  if (!raw) return [];
  const rawDocs = raw.split(/[;/]/);
  const result: string[] = [];

  for (const d of rawDocs) {
    const clean = sanitizeDoctorName(d);
    if (clean && clean.length > 3 && !result.includes(clean)) {
      result.push(clean);
    }
  }

  return result;
}

export function parseAcpnText(fullText: string): ClaimItem[] {
  const claimBlocks = fullText.split(/(?=P\d{2}-\d{4}-\d{5})/g);
  const claims: ClaimItem[] = [];

  for (const block of claimBlocks) {
    const trimmed = block.trim();
    if (!trimmed.match(/^P\d{2}-\d{4}-\d{5}/)) continue;

    const headerMatch = trimmed.match(/^(P\d{2}-\d{4}-\d{5})\s+(\d{13})\s+(P\d{12})\s+([\s\S]+)$/);
    if (!headerMatch) continue;

    const [_, pabn, series, pin, rest] = headerMatch;

    const periodMatch = rest.match(/(\d{2}\/\d{2}\/\d{4}\s+to\s+\d{2}\/\d{2}\/\d{4})/);
    if (!periodMatch) continue;

    const pIdx = rest.indexOf(periodMatch[0]);
    const patientName = rest.slice(0, pIdx).trim();
    const afterPeriod = rest.slice(pIdx + periodMatch[0].length).trim();

    let financials = afterPeriod;
    let doctorText = '';
    const docIdx = afterPeriod.indexOf('Health Care Professional/s:');
    if (docIdx !== -1) {
      financials = afterPeriod.slice(0, docIdx).trim();
      doctorText = afterPeriod.slice(docIdx + 'Health Care Professional/s:'.length);
    }

    const nums: number[] = [];
    const tokens = financials.split(/\s+/);
    for (const t of tokens) {
      const clean = t.replace(/,/g, '');
      if (/^\d+\.\d{2}$/.test(clean)) {
        nums.push(parseFloat(clean));
      }
    }

    let totalGross = 0;
    let wtax = 0;
    let hci = 0;
    let pf = 0;

    if (nums.length >= 4) {
      pf = nums[nums.length - 1] || 0;
      hci = nums[nums.length - 2] || 0;
      wtax = nums[nums.length - 3] || 0;
      totalGross = nums[nums.length - 4] || (hci + pf);
    } else if (nums.length >= 2) {
      pf = nums[nums.length - 1] || 0;
      hci = nums[nums.length - 2] || 0;
      totalGross = hci + pf;
    }

    const doctors = cleanDoctorString(doctorText);

    claims.push({
      pabn,
      series,
      pin,
      patientName,
      period: periodMatch[0],
      totalGross,
      wtax,
      hci,
      pf,
      doctors,
      status: 'Credited'
    });
  }

  return claims;
}
