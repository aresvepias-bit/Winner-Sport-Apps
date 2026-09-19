"use client";

import { formatRupiah } from "@/lib/utils";

interface PnlData {
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  expenseBreakdown?: Record<string, number>;
}

interface ProfitAndLossViewProps {
  pnl: PnlData;
}

export default function ProfitAndLossView({ pnl }: ProfitAndLossViewProps) {
  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Omzet Penjualan
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatRupiah(pnl.totalRevenue)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">100% Revenue</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Beban Pokok Produksi (HPP)
          </span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ({formatRupiah(pnl.totalHpp)})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kain, jahit, cutting &amp; aksesoris</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-emerald-300 dark:border-emerald-500/30 shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Laba Kotor (Gross Profit)
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatRupiah(pnl.grossProfit)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1 font-semibold">
            Gross Margin: {pnl.grossProfitMargin}%
          </p>
        </div>
      </div>

      {/* Detailed Financial Statement */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Rincian Laporan Laba Rugi Komprehensif
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#1a2236] text-slate-800 dark:text-slate-200">
            <span className="font-bold">1. Pendapatan Penjualan (Revenue)</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(pnl.totalRevenue)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 pl-4">
            <span>Dikurangi: Beban HPP Produksi (Material &amp; Jahit)</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">- {formatRupiah(pnl.totalHpp)}</span>
          </div>

          <div className="flex justify-between py-2.5 bg-emerald-50 dark:bg-[#141b2d] px-3.5 rounded-xl font-bold text-emerald-700 dark:text-emerald-400 text-sm border border-emerald-200 dark:border-[#1a2236]">
            <span>LABA KOTOR (GROSS PROFIT)</span>
            <span>{formatRupiah(pnl.grossProfit)}</span>
          </div>

          <div className="pt-2 text-slate-700 dark:text-slate-300 font-bold">
            2. Beban Operasional Workshop &amp; Pabrik
          </div>
          {pnl.expenseBreakdown &&
            Object.entries(pnl.expenseBreakdown).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 pl-4">
                <span>- {cat}</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">- {formatRupiah(amt)}</span>
              </div>
            ))}

          <div className="flex justify-between py-2 border-t border-slate-200 dark:border-[#1a2236] text-slate-700 dark:text-slate-300 font-semibold pl-4">
            <span>Total Beban Operasional:</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">- {formatRupiah(pnl.totalExpenses)}</span>
          </div>

          <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 px-4 rounded-xl font-black text-emerald-700 dark:text-emerald-400 text-base mt-4">
            <span>LABA BERSIH BERJALAN (NET PROFIT)</span>
            <span>{formatRupiah(pnl.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
