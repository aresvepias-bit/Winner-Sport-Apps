"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { useChartTheme, formatCompactRupiah } from "@/lib/chartTheme";
import ChartTooltip from "@/components/dashboard/ChartTooltip";

export interface TitikPeriode {
  label: string;
  pendapatan: number;
  hpp: number;
  beban: number;
  labaKotor: number;
  labaBersih: number;
  kasMasuk: number;
  kasKeluar: number;
}

interface Props {
  periode: TitikPeriode[];
  mode: "bulan" | "kuartal";
  tahun: number;
  /** Indeks periode yang sedang dibuka, ditandai agar mudah dicari di grafik. */
  indeksAktif?: number;
}

export default function ReportTrendChart({ periode, mode, tahun, indeksAktif }: Props) {
  const { series, ink } = useChartTheme();

  // Warna melekat pada entitasnya, bukan pada urutan tampil: pendapatan selalu
  // biru, beban selalu merah, laba bersih selalu hijau-toska — walau salah satu
  // seri disembunyikan.
  const WARNA = { pendapatan: series[1], beban: series[0], labaBersih: series[2] };

  const data = periode.map((p, i) => ({
    ...p,
    bebanTotal: p.hpp + p.beban,
    aktif: i === indeksAktif
  }));

  const adaIsi = data.some((d) => d.pendapatan !== 0 || d.bebanTotal !== 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Tren {mode === "kuartal" ? "Kuartalan" : "Bulanan"} {tahun}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pendapatan dan beban (HPP + operasional) sebagai batang, laba bersih sebagai garis
        </p>
      </div>

      {!adaIsi ? (
        <p className="py-16 text-center text-xs text-slate-400">
          Belum ada transaksi tercatat sepanjang {tahun}.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ink.grid} vertical={false} />
            <XAxis dataKey="label" stroke={ink.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              stroke={ink.axis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactRupiah}
              width={56}
            />
            <Tooltip
              cursor={{ fill: ink.grid, fillOpacity: 0.35 }}
              content={
                <ChartTooltip
                  footer={(payload) => {
                    const laba = payload?.find((p) => p.dataKey === "labaBersih");
                    if (!laba) return null;
                    return (
                      <span className="flex items-center justify-between gap-4">
                        <span style={{ color: ink.axis }}>Margin bersih</span>
                        <span className="font-bold">{formatRupiah(laba.value)}</span>
                      </span>
                    );
                  }}
                />
              }
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 8, color: ink.axis }}
            />
            {/* Jarak 2px antar batang bersebelahan dibuat lewat barGap. */}
            <Bar dataKey="pendapatan" name="Pendapatan" fill={WARNA.pendapatan} radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="bebanTotal" name="Beban (HPP + operasional)" fill={WARNA.beban} radius={[4, 4, 0, 0]} barSize={14} />
            <Line
              type="monotone"
              dataKey="labaBersih"
              name="Laba bersih"
              stroke={WARNA.labaBersih}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: ink.surface }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: ink.surface }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
