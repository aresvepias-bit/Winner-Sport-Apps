"use client";

import { Search, X } from "lucide-react";

export interface SpkFilterState {
  cari: string;
  status: string;
  productId: string;
}

export const FILTER_SPK_KOSONG: SpkFilterState = { cari: "", status: "SEMUA", productId: "SEMUA" };

const PILIHAN_STATUS = [
  { value: "SEMUA", label: "Semua status" },
  { value: "BELUM_SELESAI", label: "Masih berjalan" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_MATERIAL", label: "Menunggu bahan" },
  { value: "IN_PROGRESS", label: "Sedang dikerjakan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" }
];

const kelasKotak =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e1a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10";

interface Props {
  nilai: SpkFilterState;
  onChange: (nilai: SpkFilterState) => void;
  products: Array<{ id: string; name: string }>;
  jumlahTampil: number;
  jumlahTotal: number;
  tampilkanJumlah?: boolean;
}

export default function WorkOrderFilters({
  nilai,
  onChange,
  products,
  jumlahTampil,
  jumlahTotal,
  tampilkanJumlah = true
}: Props) {
  const adaFilter = nilai.cari.trim() !== "" || nilai.status !== "SEMUA" || nilai.productId !== "SEMUA";
  const ubah = (bagian: Partial<SpkFilterState>) => onChange({ ...nilai, ...bagian });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Cari SPK"
            type="text"
            value={nilai.cari}
            onChange={(e) => ubah({ cari: e.target.value })}
            placeholder="Cari no. SPK, produk, atau catatan..."
            className={`${kelasKotak} pl-9`}
          />
        </div>

        <select aria-label="Status SPK" value={nilai.status} onChange={(e) => ubah({ status: e.target.value })} className={kelasKotak}>
          {PILIHAN_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Produk target"
          value={nilai.productId}
          onChange={(e) => ubah({ productId: e.target.value })}
          className={kelasKotak}
        >
          <option value="SEMUA">Semua produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {tampilkanJumlah ? (
            <>
              Menampilkan <strong className="text-slate-700 dark:text-slate-200">{jumlahTampil}</strong> dari {jumlahTotal} SPK
            </>
          ) : (
            "Filter diterapkan saat data diproses."
          )}
        </span>
        {adaFilter && (
          <button
            type="button"
            onClick={() => onChange(FILTER_SPK_KOSONG)}
            className="flex cursor-pointer items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <X className="h-3 w-3" />
            Bersihkan filter
          </button>
        )}
      </div>
    </div>
  );
}
