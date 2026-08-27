import { ClaimItem } from '@/types';

export function parseAcpnText(fullText: string): ClaimItem[] {
  // Split anywhere by PABN pattern P\d{2}-\d{4}-\d{5}
  const claimBlocks = fullText.split(/(?=P\d{2}-\d{4}-\d{5})/g);
  const claims: ClaimItem[] = [];

  for (const block of claimBlocks) {
    const trimmed = block.trim();
    if (!trimmed.match(/^P\d{2}-\d{4}-\d{5}/)) continue;

    // Match PABN, 13-digit Series, and 13-char PIN (using [\s\S]+ instead of /s flag)
    const headerMatch = trimmed.match(/^(P\d{2}-\d{4}-\d{5})\s+(\d{13})\s+(P\d{12})\s+([\s\S]+)$/);
    if (!headerMatch) continue;

    const [_, pabn, series, pin, rest] = headerMatch;

    // Match Confinement Period: \d{2}/\d{2}/\d{4} to \d{2}/\d{2}/\d{4}
    const periodMatch = rest.match(/(\d{2}\/\d{2}\/\d{4}\s+to\s+\d{2}\/\d{2}\/\d{4})/);
    if (!periodMatch) continue;

    const pIdx = rest.indexOf(periodMatch[0]);
    const patientName = rest.slice(0, pIdx).trim();
    const afterPeriod = rest.slice(pIdx + periodMatch[0].length).trim();

    // Extract Doctors
    let financials = afterPeriod;
    let doctorText = '';
    const docIdx = afterPeriod.indexOf('Health Care Professional/s:');
    if (docIdx !== -1) {
      financials = afterPeriod.slice(0, docIdx).trim();
      doctorText = afterPeriod.slice(docIdx + 'Health Care Professional/s:'.length).replace(/Credited/g, '').trim();
    }

    // Extract Numbers: TotalGross, WTax, HCI, PF
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

    const doctors = doctorText.split(';').map(d => d.trim()).filter(Boolean);

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
