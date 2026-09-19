"use client";

import { ClipboardCheck } from "lucide-react";

interface StockOpnameSectionProps {
  onCreateOpnameSession: () => void;
}

export default function StockOpnameSection({ onCreateOpnameSession }: StockOpnameSectionProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Stock Opname Fisik vs Sistem</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencocokan stok gudang nyata dengan saldo buku secara periodik untuk mencegah selisih dan kerugian.
          </p>
        </div>
        <button
          onClick={onCreateOpnameSession}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto"
        >
          + Buat Sesi Opname Baru
        </button>
      </div>

      <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-[#1a2236] rounded-xl bg-slate-50 dark:bg-[#141b2d]/40">
        <ClipboardCheck className="w-10 h-10 mx-auto text-red-600 dark:text-red-400 mb-2 opacity-80" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Tidak ada sesi opname aktif saat ini.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Buat sesi baru untuk menghitung stok fisik kain dan pakaian jadi di gudang.
        </p>
      </div>
    </div>
  );
}
