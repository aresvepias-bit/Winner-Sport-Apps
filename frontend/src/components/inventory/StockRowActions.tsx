"use client";

import { ArrowDownToLine, ArrowUpFromLine, ClipboardList } from "lucide-react";

interface StockRowActionsProps {
  itemId: string;
  itemName: string;
  onMovement?: (id: string, direction: "IN" | "OUT") => void;
  onViewLedger?: (id: string, name: string) => void;
}

export default function StockRowActions({ itemId, itemName, onMovement, onViewLedger }: StockRowActionsProps) {
  const buttonClass = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

  return <div className="flex items-center justify-end gap-1.5">
    {onMovement && <>
      <button type="button" title="Stok Masuk" aria-label={`Stok masuk: ${itemName}`} onClick={() => onMovement(itemId, "IN")} className={`${buttonClass} border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-emerald-500 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20`}>
        <ArrowDownToLine aria-hidden="true" className="h-4 w-4" />
      </button>
      <button type="button" title="Stok Keluar" aria-label={`Stok keluar: ${itemName}`} onClick={() => onMovement(itemId, "OUT")} className={`${buttonClass} border-red-100 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus-visible:outline-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}>
        <ArrowUpFromLine aria-hidden="true" className="h-4 w-4" />
      </button>
    </>}
    {onViewLedger && <button type="button" title="Lihat Kartu Stok" aria-label={`Lihat kartu stok: ${itemName}`} onClick={() => onViewLedger(itemId, itemName)} className={`${buttonClass} border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800`}>
      <ClipboardList aria-hidden="true" className="h-4 w-4" />
    </button>}
  </div>;
}
