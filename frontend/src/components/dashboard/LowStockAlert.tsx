"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { LowStockItem } from "@/lib/useLowStock";

const MAX_VISIBLE = 5;

export default function LowStockAlert({ items }: { items: LowStockItem[] }) {
  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">
              {items.length} item stok di bawah batas minimum
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-rose-700/90 dark:text-rose-300/90">
              {visible.map((i) => (
                <li key={`${i.kind}-${i.id}`}>
                  <span className="font-semibold">{i.name}</span>
                  <span className="text-rose-600/70 dark:text-rose-400/70">
                    {" "}
                    &mdash; sisa {formatNumber(i.currentStock)} {i.unit?.symbol || ""} (min. {formatNumber(i.minimumStock)})
                  </span>
                </li>
              ))}
              {hidden > 0 && <li className="text-rose-600/70 dark:text-rose-400/70">dan {hidden} item lainnya</li>}
            </ul>
          </div>
        </div>
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline shrink-0"
        >
          Lihat stok <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
