"use client";

import Link from "next/link";
import { Wallet, ArrowDownLeft, ArrowUpRight, Scissors, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useChartTheme, STATUS_COLOR } from "@/lib/chartTheme";

interface DashboardFinancePanelProps {
  cashPosition: number;
  receivable: number;
  payable: number;
  production: { activeCount: number; completedCount: number; byStatus?: Record<string, number> };
  hidePrices: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_MATERIAL: "Menunggu Bahan",
  IN_PROGRESS: "Dikerjakan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan"
};

export default function DashboardFinancePanel({
  cashPosition,
  receivable,
  payable,
  production,
  hidePrices
}: DashboardFinancePanelProps) {
  const { mode } = useChartTheme();
  const show = (v: number) => (hidePrices ? "Rp ••••••••" : formatRupiah(v));
  const posisiBersih = cashPosition + receivable - payable;

  const statusEntries = Object.entries(production.byStatus || {}).filter(([, n]) => n > 0);
  const totalSpk = statusEntries.reduce((acc, [, n]) => acc + n, 0);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Posisi Keuangan</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kas, tagihan masuk, dan kewajiban ke supplier</p>
      </div>

      <div className="space-y-2.5">
        <Row
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Kas & Bank"
          value={show(cashPosition)}
          tone="neutral"
        />
        <Row
          icon={<ArrowDownLeft className="w-3.5 h-3.5" />}
          label="Piutang (akan masuk)"
          value={show(receivable)}
          tone="good"
          mode={mode}
        />
        <Row
          icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          label="Hutang (harus dibayar)"
          value={show(payable)}
          tone="critical"
          mode={mode}
        />
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236]">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Perkiraan Posisi Bersih
        </p>
        <p
          className="text-xl font-black mt-0.5"
          style={{ color: posisiBersih >= 0 ? STATUS_COLOR.good[mode] : STATUS_COLOR.critical[mode] }}
        >
          {show(posisiBersih)}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Kas + piutang &minus; hutang</p>
      </div>

      <div className="border-t border-slate-100 dark:border-[#1a2236] pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            Status SPK Produksi
          </span>
          <Link href="/production" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
            Buka <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {statusEntries.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada SPK tercatat.</p>
        ) : (
          <ul className="space-y-2">
            {statusEntries.map(([status, count]) => (
              <li key={status} className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-300 w-32 shrink-0 truncate">
                  {STATUS_LABEL[status] || status}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-[#141b2d] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-400 dark:bg-slate-500"
                    style={{ width: `${Math.max((count / totalSpk) * 100, 3)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums w-6 text-right">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  tone,
  mode
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "good" | "critical";
  mode?: "light" | "dark";
}) {
  const color = tone === "neutral" || !mode ? undefined : STATUS_COLOR[tone][mode];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </span>
      <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}
