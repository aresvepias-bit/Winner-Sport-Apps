"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  setPage: (page: number) => void;
}

/** Daftar nomor halaman ringkas: 1 … 4 5 6 … 12 */
function pageWindow(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("...");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, total, pageSize, setPage }: PaginationProps) {
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "min-w-8 h-8 px-2 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const idle =
    "bg-white dark:bg-[#141b2d] border-slate-200 dark:border-[#1a2236] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-[#1a2236]/60">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{from}&ndash;{to}</span> dari{" "}
        <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> data
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1} className={cn(btn, idle)} title="Sebelumnya">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(btn, p === page ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/25" : idle)}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className={cn(btn, idle)}
          title="Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
