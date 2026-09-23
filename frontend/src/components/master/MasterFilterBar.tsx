"use client";

import { Search, X } from "lucide-react";
import type { MasterEntity } from "@/components/master/masterEntities";
import {
  FILTER_MASTER_KOSONG,
  adaFilterAktif,
  konfigKategori,
  konfigStatus,
  opsiKategori,
  type MasterFilterState
} from "@/components/master/masterFilter";

const kelasKotak =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e1a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10";

interface Props {
  entity: MasterEntity;
  rows: any[];
  nilai: MasterFilterState;
  onChange: (nilai: MasterFilterState) => void;
  jumlahTampil: number;
  /** Hitungan baris disembunyikan sebelum data diambil supaya tidak terbaca "0 data". */
  tampilkanJumlah?: boolean;
}

export default function MasterFilterBar({ entity, rows, nilai, onChange, jumlahTampil, tampilkanJumlah = true }: Props) {
  const status = konfigStatus(entity);
  const kategori = konfigKategori(entity);
  const daftarKategori = opsiKategori(entity, rows);
  const ubah = (bagian: Partial<MasterFilterState>) => onChange({ ...nilai, ...bagian });

  // Dropdown kategori disembunyikan kalau datanya memang tidak berkategori,
  // supaya tidak ada pilihan kosong yang membingungkan.
  const tampilKategori = kategori && daftarKategori.length > 0;
  const kolom = 1 + (status ? 1 : 0) + (tampilKategori ? 1 : 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424]">
      <div
        className={`grid grid-cols-1 gap-3 ${
          kolom === 3 ? "lg:grid-cols-[2fr_1fr_1fr]" : kolom === 2 ? "sm:grid-cols-[2fr_1fr]" : ""
        }`}
      >
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Cari data master"
            type="text"
            value={nilai.cari}
            onChange={(e) => ubah({ cari: e.target.value })}
            placeholder="Cari nama, kode, atau keterangan..."
            className={`${kelasKotak} pl-9`}
          />
        </div>

        {status && (
          <select
            aria-label={status.label}
            value={nilai.status}
            onChange={(e) => ubah({ status: e.target.value })}
            className={kelasKotak}
          >
            {status.opsi.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {tampilKategori && (
          <select
            aria-label={kategori.label}
            value={nilai.kategori}
            onChange={(e) => ubah({ kategori: e.target.value })}
            className={kelasKotak}
          >
            <option value="SEMUA">Semua {kategori.label.toLocaleLowerCase("id")}</option>
            {daftarKategori.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {tampilkanJumlah ? (
            <>
              Menampilkan <strong className="text-slate-700 dark:text-slate-200">{jumlahTampil}</strong> dari {rows.length} data
            </>
          ) : (
            "Filter diterapkan saat data diproses."
          )}
        </span>
        {adaFilterAktif(nilai) && (
          <button
            type="button"
            onClick={() => onChange(FILTER_MASTER_KOSONG)}
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
