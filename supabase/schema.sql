-- Supabase Schema for CPH Balamban PHIC ACPN System

-- 1. Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    specialty TEXT NOT NULL,
    employment_type TEXT DEFAULT 'JO',
    tin TEXT,
    bank_account_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACPN Batches table
CREATE TABLE IF NOT EXISTS acpn_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_no TEXT NOT NULL,
    period_covered TEXT NOT NULL,
    hci_name TEXT DEFAULT 'CEBU PROVINCIAL HOSPITAL - BALAMBAN',
    accreditation_no TEXT DEFAULT 'H07020344',
    total_claims INTEGER DEFAULT 0,
    total_gross NUMERIC(14,2) DEFAULT 0,
    total_hci NUMERIC(14,2) DEFAULT 0,
    total_pf NUMERIC(14,2) DEFAULT 0,
    pdf_storage_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES acpn_batches(id) ON DELETE CASCADE,
    pabn_no TEXT NOT NULL,
    series_no TEXT NOT NULL,
    member_pin TEXT,
    patient_name TEXT NOT NULL,
    confinement_period TEXT,
    total_gross NUMERIC(12,2) DEFAULT 0,
    wtax NUMERIC(12,2) DEFAULT 0,
    hci_share NUMERIC(12,2) DEFAULT 0,
    pf_share NUMERIC(12,2) DEFAULT 0,
    doctors JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Credited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cases Distribution table
CREATE TABLE IF NOT EXISTS cases_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_no TEXT,
    patient_name TEXT NOT NULL,
    surgeon TEXT,
    anesth TEXT,
    im_pedia_gp TEXT,
    remarks TEXT,
    total_amount NUMERIC(12,2) DEFAULT 0,
    for_pool NUMERIC(12,2) DEFAULT 0,
    balance NUMERIC(12,2) DEFAULT 0,
    surgeon_share NUMERIC(12,2) DEFAULT 0,
    anesth_share NUMERIC(12,2) DEFAULT 0,
    pedia_share NUMERIC(12,2) DEFAULT 0,
    im_share NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE acpn_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON claims FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON cases_distribution FOR SELECT USING (true);