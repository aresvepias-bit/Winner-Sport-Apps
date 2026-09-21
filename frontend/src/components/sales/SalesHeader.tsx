"use client";

import { ShoppingCart, Plus, RefreshCw } from "lucide-react";

interface SalesHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onCreateOrder: () => void;
}

export default function SalesHeader({ loading, onRefresh, onCreateOrder }: SalesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-br from-white via-white to-red-50 dark:from-[#0d1424] dark:via-[#0d1424] dark:to-red-950/20 border border-slate-200 dark:border-[#1a2236] p-6 sm:p-8 rounded-2xl shadow-sm transition-colors">
      <div>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
          <ShoppingCart className="w-4 h-4" />
          Pusat Penjualan
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Penjualan &amp; Distribusi Pakaian
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau performa bulanan, pelanggan, dan pembayaran dalam satu tampilan.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Segarkan penjualan"
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={onCreateOrder}
          type="button"
          className="group flex min-h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-3 text-left text-white shadow-lg shadow-red-600/25 ring-4 ring-red-600/10 transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 sm:flex-none"
        >
          <span className="rounded-xl bg-white/15 p-2"><Plus className="h-5 w-5" /></span>
          <span><span className="block text-sm font-extrabold">Buat Order Baru</span><span className="mt-0.5 block text-[11px] font-medium text-red-100">Catat pesanan pelanggan</span></span>
        </button>
      </div>
    </div>
  );
}
