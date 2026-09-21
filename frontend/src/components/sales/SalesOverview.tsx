"use client";

import { Building2, Users, ReceiptText, Wallet, ArrowUpRight, ShoppingBag } from "lucide-react";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { summarizeSales } from "./salesAnalytics";

export default function SalesOverview({ summary, loading, onSegment }: {
  summary: ReturnType<typeof summarizeSales>; loading: boolean; onSegment: (segment: "ALL" | "CORPORATE" | "CUSTOMER") => void;
}) {
  const { valid, total, paid, outstanding, corporate, customer, days } = summary;
  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const corporatePercent = valid.length ? Math.round(corporate.length / valid.length * 100) : 0;
  const paidPercent = total ? Math.min(100, Math.round(paid / total * 100)) : 0;
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1424]";
  return <div className="space-y-5" aria-busy={loading}>
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {[
        { label: "Total transaksi", value: formatNumber(valid.length), hint: "Order selain yang dibatalkan", icon: ShoppingBag },
        { label: "Nilai penjualan", value: formatRupiah(total), hint: "Total tagihan pada bulan terpilih", icon: ReceiptText },
        { label: "Sudah dibayar", value: formatRupiah(paid), hint: "Pembayaran untuk order bulan ini", icon: Wallet },
        { label: "Sisa tagihan", value: formatRupiah(outstanding), hint: "Saldo belum dibayar dari order bulan ini", icon: ReceiptText },
      ].map((metric) => <div key={metric.label} title={metric.hint} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xs dark:border-slate-800 dark:bg-[#0d1424]"><div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{metric.label}<metric.icon className="h-4 w-4 text-red-500" /></div><p className="mt-1.5 break-words text-lg font-extrabold leading-tight tracking-tight">{loading ? "…" : metric.value}</p><span className="sr-only">{metric.hint}</span></div>)}
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      <div className={`${card} min-w-0`}>
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">Aktivitas penjualan</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Jumlah transaksi harian · tanggal order, WIB</p></div><span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-500/10">BULAN TERPILIH</span></div>
        {!loading && valid.length === 0 ? <div className="flex h-52 flex-col items-center justify-center text-center"><ShoppingBag className="mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold">Belum ada penjualan pada bulan ini</p><p className="mt-1 text-xs text-slate-500">Pilih bulan lain atau buat order baru.</p></div> : <div className="mt-6 flex h-44 items-end gap-1 border-b border-slate-200 pb-1 dark:border-slate-700" role="img" aria-label={`Grafik harian: ${days.map((day) => `tanggal ${day.day}: ${day.count} transaksi`).join(", ")}`}>
          {days.map((day) => <div key={day.day} title={`${day.day}: ${day.count} transaksi · ${formatRupiah(day.value)}`} className="flex h-full min-w-0 flex-1 items-end"><div className={`w-full rounded-t-sm ${day.count ? "bg-red-500 hover:bg-red-600" : "bg-slate-100 dark:bg-slate-800"}`} style={{ height: `${Math.max(2, day.count / maxCount * 100)}%` }} /></div>)}
        </div>}
        <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>01</span><span>10</span><span>20</span><span>{days.length}</span></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800"><span className="text-slate-500 dark:text-slate-400">{summary.cancelled} transaksi dibatalkan, tidak masuk ringkasan</span><button onClick={() => onSegment("ALL")} className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400">Lihat transaksi <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
      </div>
      <div className={card}><h2 className="font-bold">Komposisi pelanggan</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kontribusi berdasarkan jumlah transaksi</p>
        <div className="my-5 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="bg-red-500" style={{ width: `${corporatePercent}%` }} /><div className="bg-slate-700 dark:bg-slate-400" style={{ width: `${valid.length ? 100 - corporatePercent : 0}%` }} /></div>
        {([{ label: "Corporate", key: "CORPORATE", orders: corporate, icon: Building2 }, { label: "Customer", key: "CUSTOMER", orders: customer, icon: Users }] as const).map((segment) => <button key={segment.key} onClick={() => onSegment(segment.key)} className="mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><div className={`rounded-xl p-2.5 ${segment.key === "CORPORATE" ? "bg-red-50 text-red-600 dark:bg-red-500/10" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}><segment.icon className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-bold">{segment.label}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRupiah(segment.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0))}</p></div><div className="text-right"><p className="text-xl font-black">{loading ? "…" : segment.orders.length}</p><p className="text-[10px] text-slate-500">transaksi</p></div></button>)}
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Corporate: kontak dengan nama perusahaan. Customer: kontak tanpa nama perusahaan. Pengelompokan mengikuti data kontak saat ini.</p>
      </div>
    </div>
    <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800"><div><p className="text-xs text-slate-300">Pembayaran order pada periode ini</p><p className="mt-1 text-lg font-bold">{paidPercent}% dari nilai tagihan sudah dibayar</p></div><div className="h-2 w-full overflow-hidden rounded-full bg-white/10 sm:w-48"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${paidPercent}%` }} /></div></div>
  </div>;
}
