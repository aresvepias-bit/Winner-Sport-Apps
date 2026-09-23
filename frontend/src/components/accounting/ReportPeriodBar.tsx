"use client";

import { CalendarRange, X } from "lucide-react";

/**
 * Pemilih periode laporan. Semua laporan keuangan di aplikasi ini memakai satu
 * bentuk periode yang sama: mode (bulanan / kuartalan / kustom) diterjemahkan
 * menjadi sepasang tanggal, dan tanggal itulah yang dikirim ke server.
 */

export type ModePeriode = "bulan" | "kuartal" | "kustom";

export interface PeriodeLaporan {
  mode: ModePeriode;
  tahun: number;
  /** 0-11 untuk mode bulan, 0-3 untuk mode kuartal. */
  indeks: number;
  from: string;
  to: string;
}

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Tanggal awal & akhir untuk mode dan indeks yang dipilih. */
export function hitungRentang(mode: ModePeriode, tahun: number, indeks: number) {
  if (mode === "kuartal") {
    return {
      from: iso(new Date(tahun, indeks * 3, 1)),
      to: iso(new Date(tahun, indeks * 3 + 3, 0))
    };
  }
  return {
    from: iso(new Date(tahun, indeks, 1)),
    to: iso(new Date(tahun, indeks + 1, 0))
  };
}

export function periodeBulanIni(): PeriodeLaporan {
  const kini = new Date();
  const tahun = kini.getFullYear();
  const indeks = kini.getMonth();
  return { mode: "bulan", tahun, indeks, ...hitungRentang("bulan", tahun, indeks) };
}

/** Judul periode untuk kepala laporan dan dokumen cetak. */
export function labelPeriode(p: PeriodeLaporan): string {
  if (p.mode === "bulan") return `${NAMA_BULAN[p.indeks]} ${p.tahun}`;
  if (p.mode === "kuartal") {
    const mulai = NAMA_BULAN[p.indeks * 3];
    const selesai = NAMA_BULAN[p.indeks * 3 + 2];
    return `Kuartal ${p.indeks + 1} ${p.tahun} (${mulai}–${selesai})`;
  }
  const f = new Date(p.from).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const t = new Date(p.to).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  return `${f} – ${t}`;
}

const kelasKotak =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e1a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10";

interface Props {
  nilai: PeriodeLaporan;
  onChange: (p: PeriodeLaporan) => void;
  keterangan?: string;
}

export default function ReportPeriodBar({ nilai, onChange, keterangan }: Props) {
  const tahunIni = new Date().getFullYear();
  const daftarTahun = Array.from({ length: 6 }, (_, i) => tahunIni - i);

  const gantiMode = (mode: ModePeriode) => {
    if (mode === "kustom") {
      onChange({ ...nilai, mode });
      return;
    }
    // Indeks bulan tidak berlaku untuk kuartal dan sebaliknya; dipetakan ulang
    // supaya periode yang tampil tetap mencakup tanggal yang sedang dilihat.
    const indeks = mode === "kuartal" ? Math.floor(nilai.indeks / 3) : nilai.indeks * 3;
    const aman = mode === "kuartal" ? Math.min(3, indeks) : Math.min(11, indeks);
    onChange({ ...nilai, mode, indeks: aman, ...hitungRentang(mode, nilai.tahun, aman) });
  };

  const gantiTahun = (tahun: number) =>
    onChange(
      nilai.mode === "kustom"
        ? { ...nilai, tahun }
        : { ...nilai, tahun, ...hitungRentang(nilai.mode, tahun, nilai.indeks) }
    );

  const gantiIndeks = (indeks: number) =>
    onChange({ ...nilai, indeks, ...hitungRentang(nilai.mode, nilai.tahun, indeks) });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424]">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
        <CalendarRange className="h-4 w-4" />
        Periode Laporan
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select aria-label="Mode periode" value={nilai.mode} onChange={(e) => gantiMode(e.target.value as ModePeriode)} className={kelasKotak}>
          <option value="bulan">Bulanan</option>
          <option value="kuartal">Kuartalan</option>
          <option value="kustom">Rentang kustom</option>
        </select>

        {nilai.mode === "kustom" ? (
          <>
            <input
              aria-label="Tanggal awal"
              type="date"
              value={nilai.from}
              onChange={(e) => onChange({ ...nilai, from: e.target.value })}
              className={kelasKotak}
            />
            <input
              aria-label="Tanggal akhir"
              type="date"
              value={nilai.to}
              onChange={(e) => onChange({ ...nilai, to: e.target.value })}
              className={kelasKotak}
            />
          </>
        ) : (
          <>
            <select
              aria-label={nilai.mode === "bulan" ? "Bulan" : "Kuartal"}
              value={nilai.indeks}
              onChange={(e) => gantiIndeks(Number(e.target.value))}
              className={kelasKotak}
            >
              {nilai.mode === "bulan"
                ? NAMA_BULAN.map((b, i) => (
                    <option key={b} value={i}>
                      {b}
                    </option>
                  ))
                : [0, 1, 2, 3].map((k) => (
                    <option key={k} value={k}>
                      Kuartal {k + 1} ({NAMA_BULAN[k * 3].slice(0, 3)}–{NAMA_BULAN[k * 3 + 2].slice(0, 3)})
                    </option>
                  ))}
            </select>

            <select aria-label="Tahun" value={nilai.tahun} onChange={(e) => gantiTahun(Number(e.target.value))} className={kelasKotak}>
              {daftarTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {keterangan || (
            <>
              Periode dipilih: <strong className="text-slate-700 dark:text-slate-200">{labelPeriode(nilai)}</strong>
            </>
          )}
        </span>
        {nilai.mode !== "bulan" && (
          <button
            type="button"
            onClick={() => onChange(periodeBulanIni())}
            className="flex cursor-pointer items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <X className="h-3 w-3" />
            Kembali ke bulan ini
          </button>
        )}
      </div>
    </div>
  );
}
