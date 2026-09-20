"use client";

import { TrendingUp, Wallet, Package, Scissors, AlertTriangle } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { useChartTheme, STATUS_COLOR } from "@/lib/chartTheme";
import type { TrendPoint } from "@/components/dashboard/DashboardTrendChart";

interface DashboardKpiGridProps {
  stats: {
    sales: { today: number; thisMonth: number; total: number; orderCount: number };
    profitability: { grossProfit: number; netProfit: number; totalExpenses: number; margin: number };
    inventory: { rawMaterialValue: number; productValue: number; totalValue: number; lowStockAlertCount: number };
    production: { activeCount: number; completedCount: number };
    trendData?: TrendPoint[];
  };
  hidePrices: boolean;
}

/** Sparkline kecil: bentuk tren saja, tanpa sumbu — angka pastinya ada di grafik utama. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / span) * 100}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={4} vectorEffect="non-scaling-stroke"
        strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

export default function DashboardKpiGrid({ stats, hidePrices }: DashboardKpiGridProps) {
  const { series, mode } = useChartTheme();
  const show = (v: number) => (hidePrices ? "Rp ••••••••" : formatRupiah(v));
  const trend = stats.trendData || [];

  const untung = stats.profitability.netProfit >= 0;
  const labaColor = untung ? STATUS_COLOR.good[mode] : STATUS_COLOR.critical[mode];
  const stokKritis = stats.inventory.lowStockAlertCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omzet bulan berjalan */}
      <Card title="Omzet Bulan Ini" icon={<TrendingUp className="w-4 h-4" />} accent={series[0]}>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{show(stats.sales.thisMonth)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hari ini <span className="font-bold text-slate-700 dark:text-slate-200">{show(stats.sales.today)}</span>
        </p>
        <div className="mt-2 -mb-1">
          <Sparkline values={trend.map((t) => t.revenue)} color={series[0]} />
        </div>
      </Card>

      {/* 2. Laba bersih */}
      <Card title={untung ? "Laba Bersih Berjalan" : "Rugi Berjalan"} icon={<Wallet className="w-4 h-4" />} accent={labaColor}>
        <p className="text-2xl font-black" style={{ color: labaColor }}>
          {show(stats.profitability.netProfit)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Margin <span className="font-bold" style={{ color: labaColor }}>{stats.profitability.margin}%</span>
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
          Beban {show(stats.profitability.totalExpenses)}
        </p>
        <div className="mt-2 -mb-1">
          <Sparkline values={trend.map((t) => t.netProfit)} color={labaColor} />
        </div>
      </Card>

      {/* 3. Persediaan */}
      <Card title="Valuasi Persediaan" icon={<Package className="w-4 h-4" />} accent={series[2]}>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{show(stats.inventory.totalValue)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Bahan {show(stats.inventory.rawMaterialValue)}
        </p>
        {stokKritis > 0 ? (
          <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            {stokKritis} bahan perlu restock
          </p>
        ) : (
          <p className="mt-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Semua stok aman</p>
        )}
      </Card>

      {/* 4. Produksi */}
      <Card title="SPK Sedang Berjalan" icon={<Scissors className="w-4 h-4" />} accent={series[1]}>
        <p className="text-2xl font-black text-slate-900 dark:text-white">
          {formatNumber(stats.production.activeCount)} <span className="text-base font-bold text-slate-400">SPK</span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Selesai <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(stats.production.completedCount)}</span>
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
          {formatNumber(stats.sales.orderCount)} order
        </p>
      </Card>
    </div>
  );
}

function Card({
  title,
  icon,
  accent,
  children
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-lg overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Garis aksen tipis: menandai kartu tanpa mewarnai angkanya */}
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        <span className="p-2 rounded-xl" style={{ background: `${accent}14`, color: accent }}>
          {icon}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
