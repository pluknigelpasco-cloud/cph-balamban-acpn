import { ClaimItem } from '@/types';

export function cleanDoctorString(raw: string): string[] {
  let cleaned = raw
    .replace(/Credited/gi, '')
    .replace(/Date Generated:[\s\S]*$/gi, '')
    .replace(/--\s+of\s+--/gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/Run\s+Date:\s+[\d/:\sAPMapm]+/gi, '')
    .replace(/\d{4}\s+\d{2}:\d{2}:\d{2}\s+[APMapm]{2}/gi, '')
    .replace(/AUTO CREDIT PAYMENT NOTICE/gi, '')
    .replace(/PERIOD COVERED:[\s\S]*?Bank Account No\.:\s*\d+/gi, '')
    .replace(/PABN No\.[\s\S]*?WTax\s+HCI\s+PF/gi, '')
    .replace(/GRAND TOTAL[\s\S]*/gi, '')
    .trim();

  const docs = cleaned.split(/[;/]/).map(d => {
    let dClean = d.replace(/[\r\n]+/g, ' ')
      .replace(/\b\d{2}\b/g, '')
      .replace(/PABN.*PF/gi, '')
      .replace(/Total.*PF/gi, '')
      .replace(/Date Generated:.*/gi, '')
      .trim();
    return dClean;
  }).filter(d => d && d.length > 3 && !/^\d+$/.test(d) && !d.includes('PABN') && !d.includes('WTax') && !d.includes('Generated'));

  return docs;
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