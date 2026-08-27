import { ClaimItem } from '@/types';

export function parseAcpnText(fullText: string): ClaimItem[] {
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  const claims: ClaimItem[] = [];

  const claimStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^P\d{2}-\d{4}-\d{5}/)) {
      claimStarts.push(i);
    }
  }

  for (let c = 0; c < claimStarts.length; c++) {
    const startIdx = claimStarts[c];
    const endIdx = (c + 1 < claimStarts.length) ? claimStarts[c + 1] : lines.length;
    const blockLines = lines.slice(startIdx, endIdx);

    let doctorText = '';
    const mainLines: string[] = [];

    for (const bl of blockLines) {
      if (
        bl.startsWith('AUTO CREDIT') ||
        bl.startsWith('PERIOD COVERED') ||
        bl.startsWith('HCI NAME') ||
        bl.startsWith('ADDRESS') ||
        bl.startsWith('ACCREDITATION') ||
        bl.startsWith('Bank Account') ||
        bl.startsWith('PABN No.') ||
        bl.startsWith('Code Gross') ||
        bl.startsWith('GRAND TOTAL') ||
        bl.startsWith('Total no.') ||
        bl.startsWith('Note:') ||
        bl.startsWith('IN COMPLIANCE') ||
        bl.startsWith('Page ')
      ) {
        continue;
      }

      if (bl.startsWith('Health Care Professional/s:')) {
        doctorText += ' ' + bl.replace('Health Care Professional/s:', '');
      } else if (doctorText && !bl.match(/^P\d{2}-\d{4}-\d{5}/)) {
        doctorText += ' ' + bl;
      } else {
        mainLines.push(bl);
      }
    }

    const joined = mainLines.join(' ');
    const baseMatch = joined.match(/^(P\d{2}-\d{4}-\d{5})\s+(\d{13})\s+(P\d{12})\s+(.+)$/);
    if (!baseMatch) continue;

    const [_, pabn, series, pin, remainder] = baseMatch;
    const periodMatch = remainder.match(/(\d{2}\/\d{2}\/\d{4}\s+to\s+\d{2}\/\d{2}\/\d{4})/);
    
    let patientName = '';
    let period = '';
    let financials = '';

    if (periodMatch) {
      const pIdx = remainder.indexOf(periodMatch[0]);
      patientName = remainder.slice(0, pIdx).trim();
      period = periodMatch[0];
      financials = remainder.slice(pIdx + period.length).trim();
    } else {
      patientName = remainder.trim();
    }

    // Extract numbers: looking for decimal format (e.g. 31,750.00)
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

    const cleanDocText = doctorText.replace(/Credited/g, '').trim();
    const doctors = cleanDocText.split(';').map(d => d.trim()).filter(Boolean);

    claims.push({
      pabn,
      series,
      pin,
      patientName,
      period,
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