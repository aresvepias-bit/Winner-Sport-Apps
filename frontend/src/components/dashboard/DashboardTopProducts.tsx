"use client";

import { Trophy } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { useChartTheme } from "@/lib/chartTheme";

export interface TopProduct {
  name: string;
  revenue: number;
  qtyPcs: number;
}

interface DashboardTopProductsProps {
  products: TopProduct[];
  hidePrices: boolean;
}

/**
 * Satu seri, jadi tanpa legenda: judulnya sudah menyebut ukurannya.
 * Batang dibuat sendiri (bukan Recharts) agar nama produk bisa jadi label langsung.
 */
export default function DashboardTopProducts({ products, hidePrices }: DashboardTopProductsProps) {
  const { series } = useChartTheme();
  const data = (products || []).filter((p) => p.revenue > 0);
  const max = Math.max(...data.map((p) => p.revenue), 1);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Produk Penyumbang Omzet Terbesar</h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Akumulasi seluruh order penjualan tercatat</p>

      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">Belum ada penjualan yang tercatat.</p>
      ) : (
        <ul className="space-y-3.5">
          {data.map((p, i) => (
            <li key={p.name}>
              <div className="flex items-end justify-between gap-3 mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={p.name}>
                  <span className="text-slate-400 dark:text-slate-500 tabular-nums mr-1.5">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                  {hidePrices ? "Rp ••••••" : formatRupiah(p.revenue)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-[#141b2d] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max((p.revenue / max) * 100, 2)}%`, background: series[0] }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0 w-16 text-right">
                  {formatNumber(p.qtyPcs)} pcs
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
