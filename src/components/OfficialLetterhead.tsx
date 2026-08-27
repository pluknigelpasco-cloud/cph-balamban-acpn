'use client';

import React from 'react';

export default function OfficialLetterhead({ title = 'PHILHEALTH PROFESSIONAL FEE (ACPN) COMPENSATION VOUCHER' }: { title?: string }) {
  return (
    <div className="border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Official Seal / Logos */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/image1.png"
            alt="Province of Cebu Official Seal"
            className="w-16 h-16 object-contain"
          />
          <img
            src="/image2.png"
            alt="CPH Balamban Hospital Seal"
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Center Official Letterhead Text matching LETTERHEAD NEW 2026.docx */}
        <div className="text-center flex-1 px-2">
          <p className="text-[11px] font-serif text-slate-800 tracking-wide font-medium">Republic of the Philippines</p>
          <p className="text-[12px] font-serif text-slate-900 font-bold tracking-wide">Province of Cebu</p>
          <h1 className="text-base font-black text-slate-950 tracking-wider uppercase font-serif mt-0.5">
            CEBU PROVINCIAL HOSPITAL (BALAMBAN)
          </h1>
          <p className="text-[10px] text-slate-700 font-sans mt-0.5">
            Pilapil St., Baliwagan, Balamban Cebu
          </p>
          <p className="text-[9px] text-slate-600 font-sans">
            Telephone Number: (032) 429-1356 / 231-1875 / 260-5782 • emailadd: cph7.balprovhospital@gmail.com
          </p>
        </div>

        {/* Right Official Seal (Bagong Pilipinas / DOH) */}
        <div className="flex items-center shrink-0">
          <img
            src="/image3.jpeg"
            alt="Bagong Pilipinas / DOH Accreditation Logo"
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>
    </div>
  );
}