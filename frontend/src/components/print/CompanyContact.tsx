"use client";

import { COMPANY, COMPANY_ADDRESS_ONE_LINE } from "@/lib/companyInfo";

interface CompanyContactProps {
  /** "compact" untuk dokumen ringkas (slip upah): alamat jadi satu baris. */
  variant?: "default" | "compact";
}

/** Alamat & telepon perusahaan pada kop dokumen cetak. */
export default function CompanyContact({ variant = "default" }: CompanyContactProps) {
  if (variant === "compact") {
    return (
      <p className="text-[9px] text-slate-500 leading-snug mt-0.5">
        {COMPANY_ADDRESS_ONE_LINE} &bull; Telp {COMPANY.phone}
      </p>
    );
  }

  return (
    <div className="text-[10px] text-slate-600 leading-snug mt-1">
      {COMPANY.addressLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <p className="font-semibold text-slate-700">Telp: {COMPANY.phone}</p>
    </div>
  );
}
