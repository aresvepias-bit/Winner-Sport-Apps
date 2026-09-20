"use client";

import { useState, useEffect } from "react";

/**
 * Warna grafik. Setiap set sudah lolos pemeriksaan palet (pita kelerengan, ambang
 * kroma, keterbedaan bagi buta warna, dan kontras terhadap latar) — mode gelap
 * memakai corak sendiri, bukan sekadar membalik mode terang.
 *
 * Urutannya tetap: seri ke-1 selalu merah, ke-2 biru, ke-3 amber. Warna mengikuti
 * entitas, bukan peringkat, supaya menyaring data tidak mengecat ulang sisanya.
 */
export const CHART_SERIES = {
  light: ["#dc2626", "#2563eb", "#d97706"],
  dark: ["#ef4444", "#3b82f6", "#d97706"]
} as const;

export const CHART_INK = {
  light: { axis: "#64748b", grid: "#e2e8f0", surface: "#ffffff", border: "#e2e8f0", text: "#0f172a" },
  dark: { axis: "#94a3b8", grid: "#1e293b", surface: "#0d1424", border: "#1a2236", text: "#f1f5f9" }
} as const;

/** Status memakai palet terpisah dan tidak pernah dipakai sebagai warna seri. */
export const STATUS_COLOR = {
  good: { light: "#059669", dark: "#34d399" },
  critical: { light: "#e11d48", dark: "#fb7185" }
} as const;

/** Mengikuti kelas `dark` di <html> yang diatur tombol tema di navbar. */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export type ChartMode = "light" | "dark";

export function useChartTheme(): {
  isDark: boolean;
  mode: ChartMode;
  series: readonly string[];
  ink: (typeof CHART_INK)[ChartMode];
} {
  const isDark = useIsDark();
  const mode: ChartMode = isDark ? "dark" : "light";
  return { isDark, mode, series: CHART_SERIES[mode], ink: CHART_INK[mode] };
}

/** Sumbu uang: 1.250.000 -> "1,3jt" agar label sumbu tetap pendek. */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}
