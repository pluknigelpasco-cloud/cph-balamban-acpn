import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CaseItem, ClaimItem } from '@/types';

export interface UploadedBatch {
  id: string;
  fileName: string;
  month: string;
  uploadDate: string;
  claimCount: number;
  grossTotal: number;
  pfTotal: number;
  claims: ClaimItem[];
}

// Convert CaseItem to Supabase DB Row
export const caseToDbRow = (c: CaseItem) => ({
  id: c.id,
  item_no: c.itemNo,
  patient_name: c.patientName,
  surgeon: c.surgeon,
  anesth: c.anesth,
  im_pedia_gp: c.imPediaGp,
  remarks: c.remarks,
  total_amount: c.totalAmount || 0,
  for_pool: c.forPool || 0,
  balance: c.balance || 0,
  surgeon_share: c.surgeonShare || 0,
  anesth_share: c.anesthShare || 0,
  hemo: c.hemo || 0,
  hemo_im: c.hemoIm || 0,
  month: (c as any).month || 'SEPTEMBER 2026',
  is_archived: (c as any).isArchived || false,
});

// Convert Supabase DB Row to CaseItem
export const dbRowToCase = (row: any): CaseItem => ({
  id: row.id,
  itemNo: row.item_no || '',
  patientName: row.patient_name || '',
  surgeon: row.surgeon || '',
  anesth: row.anesth || '',
  imPediaGp: row.im_pedia_gp || '',
  remarks: row.remarks || '1D',
  totalAmount: Number(row.total_amount) || 0,
  forPool: Number(row.for_pool) || 0,
  balance: Number(row.balance) || 0,
  surgeonShare: Number(row.surgeon_share) || 0,
  anesthShare: Number(row.anesth_share) || 0,
  hemo: Number(row.hemo) || 0,
  hemoIm: Number(row.hemo_im) || 0,
  month: row.month || 'SEPTEMBER 2026',
  isArchived: row.is_archived || false,
} as any);

// Fetch All Cases from Cloud (or fallback)
export async function fetchAllCases(): Promise<CaseItem[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const parsed = data.map(dbRowToCase);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cph_cases_data', JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Supabase fetch error, fallback to local:', err);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cph_cases_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return [];
}

// Save Cases to Cloud in Batches of 100
export async function saveCasesToCloud(cases: CaseItem[]): Promise<{ count: number; error: any }> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cph_cases_data', JSON.stringify(cases));
  }

  if (!isSupabaseConfigured() || cases.length === 0) return { count: cases.length, error: null };

  const rows = cases.map(caseToDbRow);
  const CHUNK_SIZE = 100;
  let hasError = null;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      const { error } = await supabase
        .from('cases')
        .upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error('Error upserting chunk:', error);
        hasError = error;
      }
    } catch (e) {
      console.error('Failed to sync chunk to Supabase:', e);
      hasError = e;
    }
  }

  return { count: rows.length, error: hasError };
}

// Delete Single Case
export async function deleteCaseFromCloud(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('cases').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting case from Supabase:', e);
    }
  }
}

// Clear Month Cases
export async function clearMonthCasesFromCloud(month: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      if (month === 'ALL') {
        await supabase.from('cases').delete().neq('id', '___non_existent___');
      } else {
        await supabase.from('cases').delete().eq('month', month);
      }
    } catch (e) {
      console.error('Error clearing month cases from Supabase:', e);
    }
  }
}

// Fetch Batches
export async function fetchAllBatches(): Promise<UploadedBatch[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('acpn_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const batches: UploadedBatch[] = data.map((b: any) => ({
          id: b.id,
          fileName: b.file_name,
          month: b.month,
          uploadDate: b.upload_date,
          claimCount: b.claim_count,
          grossTotal: Number(b.gross_total),
          pfTotal: Number(b.pf_total),
          claims: b.claims || [],
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem('cph_acpn_batches', JSON.stringify(batches));
        }
        return batches;
      }
    }
  } catch (err) {
    console.error('Supabase batches fetch error:', err);
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cph_acpn_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return [];
}

// Save Batches to Cloud
export async function saveBatchesToCloud(batches: UploadedBatch[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cph_acpn_batches', JSON.stringify(batches));
  }

  if (!isSupabaseConfigured() || batches.length === 0) return;

  const rows = batches.map(b => ({
    id: b.id,
    file_name: b.fileName,
    month: b.month,
    upload_date: b.uploadDate,
    claim_count: b.claimCount,
    gross_total: b.grossTotal,
    pf_total: b.pfTotal,
    claims: b.claims,
  }));

  try {
    await supabase.from('acpn_batches').upsert(rows, { onConflict: 'id' });
  } catch (e) {
    console.error('Error saving batches to Supabase:', e);
  }
}

// Clear Month Batches
export async function clearMonthBatchesFromCloud(month: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      if (month === 'ALL') {
        await supabase.from('acpn_batches').delete().neq('id', '___non_existent___');
      } else {
        await supabase.from('acpn_batches').delete().eq('month', month);
      }
    } catch (e) {
      console.error('Error clearing month batches from Supabase:', e);
    }
  }
}

// Manual or Automatic Sync: Push Local to Cloud
export async function pushLocalDataToCloud(): Promise<{ casesCount: number; batchesCount: number; error: any }> {
  if (typeof window === 'undefined') return { casesCount: 0, batchesCount: 0, error: 'Not in browser' };

  let localCases: CaseItem[] = [];
  const savedCases = localStorage.getItem('cph_cases_data');
  if (savedCases) {
    try { localCases = JSON.parse(savedCases); } catch (e) {}
  }

  let localBatches: UploadedBatch[] = [];
  const savedBatches = localStorage.getItem('cph_acpn_batches');
  if (savedBatches) {
    try { localBatches = JSON.parse(savedBatches); } catch (e) {}
  }

  if (localCases.length > 0) {
    await saveCasesToCloud(localCases);
  }

  if (localBatches.length > 0) {
    await saveBatchesToCloud(localBatches);
  }

  return { casesCount: localCases.length, batchesCount: localBatches.length, error: null };
}

// Auto Migrate on initial connect
export async function autoMigrateLocalDataToCloud(): Promise<void> {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return;

  try {
    const { count } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    const saved = localStorage.getItem('cph_cases_data');
    if (saved) {
      const localCases: CaseItem[] = JSON.parse(saved);
      if (localCases.length > 0 && (!count || count === 0)) {
        console.log('Auto-uploading ' + localCases.length + ' local cases to Supabase...');
        await saveCasesToCloud(localCases);
      }
    }
  } catch (e) {
    console.error('Auto-migration error:', e);
  }
}