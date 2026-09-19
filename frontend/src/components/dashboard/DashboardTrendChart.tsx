"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { formatRupiah } from "@/lib/utils";

interface DashboardTrendChartProps {
  trendData: Array<{ month: string; revenue: number; hpp: number }>;
}

export default function DashboardTrendChart({ trendData }: DashboardTrendChartProps) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Tren Omzet vs HPP Produksi (6 Bulan)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rasio perbandingan omzet penjualan dengan biaya pokok produksi manufaktur
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => `Rp${val / 1000000}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
              }}
              formatter={(val: any) => formatRupiah(val)}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar dataKey="revenue" name="Omzet Penjualan" fill="#dc2626" radius={[6, 6, 0, 0]} />
            <Bar dataKey="hpp" name="HPP Produksi" fill="#64748b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
