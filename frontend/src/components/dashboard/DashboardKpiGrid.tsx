"use client";

import { TrendingUp, Wallet, Package, Scissors } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface DashboardKpiGridProps {
  stats: {
    sales: { today: number; thisMonth: number; total: number; orderCount: number };
    profitability: { grossProfit: number; netProfit: number; totalExpenses: number; margin: number };
    inventory: { rawMaterialValue: number; productValue: number; totalValue: number; lowStockAlertCount: number };
    production: { activeCount: number; completedCount: number };
  };
  hidePrices: boolean;
}

export default function DashboardKpiGrid({ stats, hidePrices }: DashboardKpiGridProps) {
  const renderAmount = (amount: number) => {
    if (hidePrices) return "Rp ••••••••";
    return formatRupiah(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omzet Bulan Ini */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Omzet Bulan Ini
          </span>
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{renderAmount(stats.sales.thisMonth)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hari ini: <span className="text-red-600 dark:text-red-400 font-semibold">{renderAmount(stats.sales.today)}</span>
          </p>
        </div>
      </div>

      {/* 2. Laba Bersih */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Laba Bersih Berjalan
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{renderAmount(stats.profitability.netProfit)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Margin Laba: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.profitability.margin}%</span>
          </p>
        </div>
      </div>

      {/* 3. Valuasi Persediaan */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Valuasi Persediaan
          </span>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{renderAmount(stats.inventory.totalValue)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bahan: {renderAmount(stats.inventory.rawMaterialValue)}
          </p>
        </div>
      </div>

      {/* 4. SPK Berjalan */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SPK Sedang Berjalan
          </span>
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <Scissors className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.production.activeCount} SPK</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selesai: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.production.completedCount} SPK</span>
          </p>
        </div>
      </div>
    </div>
  );
}
