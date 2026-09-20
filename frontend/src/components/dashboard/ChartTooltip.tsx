"use client";

import { formatRupiah } from "@/lib/utils";
import { useChartTheme } from "@/lib/chartTheme";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  hidePrices?: boolean;
  /** Baris tambahan di bawah daftar seri, mis. laba bersih bulan itu. */
  footer?: (payload: ChartTooltipProps["payload"]) => React.ReactNode;
}

/**
 * Tooltip bersama untuk grafik dashboard. Nilai memakai warna teks biasa;
 * identitas seri dibawa titik berwarna di sebelahnya, bukan oleh warna angkanya.
 */
export default function ChartTooltip({ active, payload, label, hidePrices, footer }: ChartTooltipProps) {
  const { ink } = useChartTheme();
  if (!active || !payload || payload.length === 0) return null;

  const show = (v: number) => (hidePrices ? "Rp ••••••" : formatRupiah(v));

  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-lg text-xs"
      style={{ background: ink.surface, borderColor: ink.border, color: ink.text }}
    >
      {label && <p className="font-bold mb-1.5">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
              <span style={{ color: ink.axis }}>{entry.name}</span>
            </span>
            <span className="font-bold tabular-nums">{show(entry.value)}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: ink.border }}>{footer(payload)}</div>}
    </div>
  );
}
