# CPH Balamban - PhilHealth ACPN & Doctor PF Sharing System

A modern, full-stack web application designed for **Cebu Provincial Hospital - Balamban** to automate PhilHealth Auto Credit Payment Notice (ACPN) PDF parsing, doctor professional fee (PF) pooling, departmental pro-rata sharing calculations, and accounting exports.

---

## Features

1. **ACPN PDF Auto-Extractor**:
   - Drag & drop official PhilHealth ACPN PDFs (e.g. CPH.BALAMBAN 8.1.26-PF.pdf).
   - Automatically parses PABN Number, Series Number, Member PIN, Patient Name, Confinement Period, Caserates 1 & 2, Gross Amount, HCI share, PF share, and accredited doctors.

2. **Cases Master Grid & Formula Engine**:
   - 100% parity with Excel formulas in SUMMARY COPY ONLY.xlsx.
   - Real-time multi-column search & filtering (by Doctor, Case Type / Remarks, Confinement Month, Amount).
   - Live inline editing with automatic recalculations for Pool Retained (20% / 35% / 50%), Surgeon share (70% / 100%), Anesthesiologist share (30%), and IM/Pedia cuts (10%).

3. **Specialized Department Pro-Rata Sharing**:
   - **NICU / ICU**: Automatic specialist deduction (Dr. Kurt Peter Rosell @ PHP 1,000/patient) and duty hours pro-rata sharing.
   - **Hemodialysis (HEMO)**: Total IM share divided by logged minutes to compute exact rate per minute across attending nephrologists.
   - **Pedia-IM During Surgeries**: Duty hours pro-rata sharing.
   - **BTL-IUD Family Planning Team**: Equal split (1/11th) across active team members.
   - **Pain Management (PM)**: Fixed 20% pool and 80% net distribution.

4. **Doctor PF & 20% Withholding Tax Master Summary**:
   - Aggregated gross PF per doctor.
   - 20% Withholding Tax deduction (=Gross * 0.20).
   - Net PF Payable (=Gross - WTax).
   - Individual printable Doctor Payslips.

5. **Reporting & Exports**:
   - 1-click export to full .xlsx workbook.
   - Print-ready PDF report generation.

---

## Tech Stack & Deployment

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend / Database**: Supabase (PostgreSQL, Storage, RLS Auth).
- **Deployment**: Vercel (Edge & Serverless).
- **Spreadsheet & PDF Engines**: SheetJS (xlsx), jspdf, jspdf-autotable, pdf-parse.

---

## Getting Started

### 1. Run Locally
```bash
cd C:\Users\cphbn\.gemini\antigravity\scratch\cph-balamban-acpn
npm run dev
```
Open http://localhost:3000 in your browser.

### 2. Configure Supabase (Optional for Cloud Sync)
Create a .env.local file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
Execute supabase/schema.sql in your Supabase SQL Editor.

### 3. Deploy to Vercel
1. Push this folder to GitHub/GitLab.
2. Import the repository in Vercel (https://vercel.com).
3. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables.
4. Deploy!
