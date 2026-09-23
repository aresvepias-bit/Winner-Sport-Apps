"use client";

import { Search, X } from "lucide-react";

export interface PurchaseFilterState {
  cari: string;
  status: string;
  supplierId: string;
}

export const FILTER_KOSONG: PurchaseFilterState = { cari: "", status: "SEMUA", supplierId: "SEMUA" };

const PILIHAN_STATUS = [
  { value: "SEMUA", label: "Semua status" },
  { value: "BELUM_SELESAI", label: "Belum selesai diterima" },
  { value: "DRAFT", label: "Draft" },
  { value: "ORDERED", label: "Dipesan" },
  { value: "PARTIAL", label: "Diterima sebagian" },
  { value: "RECEIVED", label: "Diterima penuh" },
  { value: "CANCELLED", label: "Dibatalkan" }
];

const kelasKotak =
  "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141c2e] border border-slate-200 dark:border-[#1a2236] text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

interface Props {
  nilai: PurchaseFilterState;
  onChange: (nilai: PurchaseFilterState) => void;
  suppliers: Array<{ id: string; name: string }>;
  jumlahTampil: number;
  jumlahTotal: number;
}

export default function PurchaseOrderFilters({ nilai, onChange, suppliers, jumlahTampil, jumlahTotal }: Props) {
  const adaFilter =
    nilai.cari.trim() !== "" || nilai.status !== "SEMUA" || nilai.supplierId !== "SEMUA";

  const ubah = (bagian: Partial<PurchaseFilterState>) => onChange({ ...nilai, ...bagian });

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-4 shadow-sm dark:shadow-xl transition-colors">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={nilai.cari}
            onChange={(e) => ubah({ cari: e.target.value })}
            placeholder="Cari no. PO, supplier, atau nama bahan..."
            className={`${kelasKotak} pl-9`}
          />
        </div>

        <select value={nilai.status} onChange={(e) => ubah({ status: e.target.value })} className={kelasKotak}>
          {PILIHAN_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={nilai.supplierId}
          onChange={(e) => ubah({ supplierId: e.target.value })}
          className={kelasKotak}
        >
          <option value="SEMUA">Semua supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          Menampilkan <strong className="text-slate-700 dark:text-slate-200">{jumlahTampil}</strong> dari {jumlahTotal} PO
        </span>
        {adaFilter && (
          <button
            onClick={() => onChange(FILTER_KOSONG)}
            className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3 h-3" />
            Bersihkan filter
          </button>
        )}
      </div>
    </div>
  );
}
