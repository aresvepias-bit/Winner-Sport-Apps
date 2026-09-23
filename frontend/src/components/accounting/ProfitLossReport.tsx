"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { kartuNaik, wadahBerurutan } from "@/lib/motion";

export interface LabaRugi {
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  expenseBreakdown: Record<string, number>;
  netProfit: number;
  netProfitMargin: number;
  coverage?: { itemsTotal: number; itemsWithHpp: number };
  jumlahOrder?: number;
}

export interface LabaRugiResponse extends LabaRugi {
  periode: { from: string; to: string };
  periodeSebelumnya: { from: string; to: string };
  sebelumnya: LabaRugi;
}

/** Perubahan terhadap periode sebelumnya. null bila pembandingnya nol. */
function selisih(sekarang: number, lalu: number): number | null {
  if (!lalu) return null;
  return ((sekarang - lalu) / Math.abs(lalu)) * 100;
}

function Perubahan({ nilai, terbalik = false }: { nilai: number | null; terbalik?: boolean }) {
  if (nilai === null) {
    return <span className="text-[11px] text-slate-400">Tidak ada pembanding</span>;
  }
  const naik = nilai >= 0;
  // Untuk beban dan HPP, naik justru kabar buruk.
  const bagus = terbalik ? !naik : naik;
  const Icon = Math.abs(nilai) < 0.05 ? Minus : naik ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        bagus ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {naik ? "+" : ""}
      {nilai.toFixed(1).replace(".", ",")}%
    </span>
  );
}

interface Props {
  data: LabaRugiResponse;
}

export default function ProfitLossReport({ data }: Props) {
  const { sebelumnya } = data;
  const belumLengkap =
    data.coverage && data.coverage.itemsTotal > 0 && data.coverage.itemsWithHpp < data.coverage.itemsTotal;

  const kartu = [
    {
      label: "Pendapatan",
      nilai: data.totalRevenue,
      delta: selisih(data.totalRevenue, sebelumnya.totalRevenue),
      terbalik: false,
      catatan: `${data.jumlahOrder ?? 0} order penjualan`
    },
    {
      label: "Laba Kotor",
      nilai: data.grossProfit,
      delta: selisih(data.grossProfit, sebelumnya.grossProfit),
      terbalik: false,
      catatan: `Margin ${data.grossProfitMargin.toFixed(1).replace(".", ",")}%`
    },
    {
      label: "Beban Operasional",
      nilai: data.totalExpenses,
      delta: selisih(data.totalExpenses, sebelumnya.totalExpenses),
      terbalik: true,
      catatan: "Di luar HPP produksi"
    },
    {
      label: "Laba Bersih",
      nilai: data.netProfit,
      delta: selisih(data.netProfit, sebelumnya.netProfit),
      terbalik: false,
      catatan: `Margin ${data.netProfitMargin.toFixed(1).replace(".", ",")}%`
    }
  ];

  const baris = [
    { label: "Pendapatan Penjualan", nilai: data.totalRevenue, lalu: sebelumnya.totalRevenue, tebal: false },
    { label: "Beban Pokok Penjualan (HPP)", nilai: -data.totalHpp, lalu: -sebelumnya.totalHpp, tebal: false },
    { label: "LABA KOTOR", nilai: data.grossProfit, lalu: sebelumnya.grossProfit, tebal: true },
    ...Object.entries(data.expenseBreakdown).map(([nama, jumlah]) => ({
      label: `Beban ${nama}`,
      nilai: -jumlah,
      lalu: -(sebelumnya.expenseBreakdown?.[nama] || 0),
      tebal: false
    })),
    { label: "Total Beban Operasional", nilai: -data.totalExpenses, lalu: -sebelumnya.totalExpenses, tebal: false },
    { label: "LABA BERSIH", nilai: data.netProfit, lalu: sebelumnya.netProfit, tebal: true }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        variants={wadahBerurutan}
        initial="awal"
        animate="masuk"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kartu.map((k) => (
          <motion.div
            key={k.label}
            variants={kartuNaik}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{k.label}</p>
            <p
              className={`mt-1.5 text-2xl font-black ${
                k.nilai < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
              }`}
            >
              {formatRupiah(k.nilai)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{k.catatan}</span>
              <Perubahan nilai={k.delta} terbalik={k.terbalik} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {belumLengkap && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-bold">HPP belum lengkap.</span> Baru {data.coverage!.itemsWithHpp} dari{" "}
            {data.coverage!.itemsTotal} baris penjualan di periode ini yang HPP-nya terekam, jadi laba kotor di
            sini masih terlalu tinggi. Baris lama yang dibuat sebelum fitur HPP aktif memang bernilai nol.
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Laporan Laba Rugi</h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Dibandingkan dengan periode sebelumnya yang sama panjang
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 dark:border-[#1a2236] dark:text-slate-400">
                <th className="pb-3 font-semibold">Komponen</th>
                <th className="pb-3 text-right font-semibold">Periode Ini</th>
                <th className="pb-3 text-right font-semibold">Periode Sebelumnya</th>
                <th className="pb-3 text-right font-semibold">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
              {baris.map((b) => (
                <tr key={b.label} className={b.tebal ? "bg-slate-50/60 dark:bg-slate-800/20" : ""}>
                  <td className={`py-3 ${b.tebal ? "font-black text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                    {b.label}
                  </td>
                  <td
                    className={`py-3 text-right ${b.tebal ? "font-black" : "font-semibold"} ${
                      b.nilai < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatRupiah(b.nilai)}
                  </td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400">{formatRupiah(b.lalu)}</td>
                  <td className="py-3 text-right">
                    <Perubahan nilai={selisih(b.nilai, b.lalu)} terbalik={b.nilai < 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
