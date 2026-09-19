"use client";

import Link from "next/link";
import { RefreshCw, Scissors } from "lucide-react";

interface DashboardHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ loading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Executive Operational Cockpit
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dashboard Operasional Konveksi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kendali operasional produksi, stok, dan keuangan konveksi.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Data</span>
        </button>

        <Link
          href="/production"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>+ Buat SPK Produksi</span>
        </Link>
      </div>
    </div>
  );
}
