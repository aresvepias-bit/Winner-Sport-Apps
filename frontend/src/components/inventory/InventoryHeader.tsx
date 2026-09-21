"use client";

import { Package, RefreshCw } from "lucide-react";

interface InventoryHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function InventoryHeader({ loading, onRefresh }: InventoryHeaderProps) {
  return (
    <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-br from-white via-white to-red-50 dark:from-[#0d1424] dark:via-[#0d1424] dark:to-red-950/20 border border-slate-200 dark:border-[#1a2236] p-6 sm:p-8 rounded-2xl shadow-sm transition-colors">
      <div>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Package className="w-4 h-4" />
          Pusat Persediaan
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Gudang &amp; Persediaan Multi-Satuan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau stok kain (kg/meter), aksesoris, pakaian jadi (kodi/pcs), serta riwayat mutasi masuk dan keluar.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onRefresh}
          type="button"
          disabled={loading}
          aria-label="Segarkan data persediaan"
          className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#1a2236] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-red-500"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="text-xs font-semibold">Segarkan</span>
        </button>
      </div>
    </div>
  );
}
