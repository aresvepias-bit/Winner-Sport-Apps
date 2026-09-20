"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useChartTheme, formatCompactRupiah, STATUS_COLOR } from "@/lib/chartTheme";
import ChartTooltip from "@/components/dashboard/ChartTooltip";

export interface TrendPoint {
  month: string;
  year: number;
  revenue: number;
  hpp: number;
  expenses: number;
  netProfit: number;
  orderCount: number;
}

interface DashboardTrendChartProps {
  trendData: TrendPoint[];
  hidePrices: boolean;
}

const SERIES = [
  { key: "revenue", name: "Omzet" },
  { key: "hpp", name: "HPP Produksi" },
  { key: "expenses", name: "Beban Operasional" }
];

export default function DashboardTrendChart({ trendData, hidePrices }: DashboardTrendChartProps) {
  const { series, ink, mode } = useChartTheme();
  const data = trendData || [];

  // Perbandingan bulan berjalan dengan bulan sebelumnya (keduanya dari data nyata).
  const bulanBerisi = data.filter((d) => d.revenue > 0 || d.expenses > 0);
  const bulanAwal = bulanBerisi[0];
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const delta = last && prev && prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null;
  const naik = (delta ?? 0) >= 0;
  const deltaColor = naik ? STATUS_COLOR.good[mode] : STATUS_COLOR.critical[mode];

  return (
    <div className="lg:col-span-2 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Tren Omzet, HPP &amp; Beban</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enam bulan terakhir, dihitung dari transaksi yang tercatat
          </p>
          {bulanBerisi.length > 0 && bulanBerisi.length < 2 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
              Transaksi baru tercatat sejak {bulanAwal.month} {bulanAwal.year}. Bulan kosong memang belum ada datanya.
            </p>
          )}
        </div>

        {delta !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] shrink-0">
            {naik ? (
              <TrendingUp className="w-3.5 h-3.5" style={{ color: deltaColor }} />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" style={{ color: deltaColor }} />
            )}
            <span className="text-xs font-bold tabular-nums" style={{ color: deltaColor }}>
              {naik ? "+" : ""}{delta.toFixed(1).replace(".", ",")}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">vs {prev.month}</span>
          </div>
        )}
      </div>

      {/* Legenda: identitas seri tidak hanya lewat warna, tetapi juga namanya */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        {SERIES.map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: series[i] }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="month" stroke={ink.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke={ink.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={(v) => (hidePrices ? "•••" : formatCompactRupiah(v))}
            />
            <Tooltip
              cursor={{ fill: ink.grid, opacity: 0.35 }}
              content={
                <ChartTooltip
                  hidePrices={hidePrices}
                  footer={(payload) => {
                    const row = data.find((d) => d.month === (payload?.[0] as any)?.payload?.month);
                    if (!row) return null;
                    const untung = row.netProfit >= 0;
                    return (
                      <div className="flex items-center justify-between gap-4">
                        <span style={{ color: ink.axis }}>{untung ? "Laba bersih" : "Rugi"}</span>
                        <span
                          className="font-bold tabular-nums"
                          style={{ color: untung ? STATUS_COLOR.good[mode] : STATUS_COLOR.critical[mode] }}
                        >
                          {hidePrices ? "Rp ••••••" : formatRupiah(row.netProfit)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            {SERIES.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={series[i]} radius={[4, 4, 0, 0]} maxBarSize={26} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
