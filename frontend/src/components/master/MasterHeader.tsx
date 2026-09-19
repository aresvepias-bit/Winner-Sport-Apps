"use client";

import { Layers, RefreshCw, Plus } from "lucide-react";

interface MasterHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onCreateNew?: () => void;
  createButtonText?: string;
}

export default function MasterHeader({
  loading,
  onRefresh,
  onCreateNew,
  createButtonText
}: MasterHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          Master Database Konveksi
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Katalog Bahan Baku, Produk, BOM &amp; Rekanan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kelola data fundamental manufaktur pakaian, formula resep jahit, dan master rekanan.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {onCreateNew && createButtonText && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{createButtonText}</span>
          </button>
        )}
      </div>
    </div>
  );
}
