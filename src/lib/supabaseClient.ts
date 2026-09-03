import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcaacarwzggscnmftfm.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2FhY2Fyd3pnZ3Njbm1mdGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTY1ODEsImV4cCI6MjEwMzM3MjU4MX0.GnEZ0sLPDW2-t0_lq0CMx3_KXB9qFjpCR-QWrf5ZDwU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== undefined &&
    supabaseAnonKey !== undefined &&
    !supabaseUrl.includes('placeholder')
  );
};