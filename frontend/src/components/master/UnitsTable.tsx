"use client";

import { formatNumber } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

export interface UnitItem {
  id: string;
  name: string;
  symbol: string;
  ratioToPcs?: number | string;
  description?: string;
  isActive?: boolean;
}

interface UnitsTableProps {
  units: UnitItem[];
  onProses?: (unit: UnitItem) => void;
  resetKey?: string;
}

export default function UnitsTable({ units, onProses, resetKey = "" }: UnitsTableProps) {
  const pg = usePagination(units, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Master Satuan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isi satuan menentukan konversi ke pcs, dipakai saat menghitung HPP dan mengurangi stok
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Nama Satuan</th>
              <th className="pb-3 font-semibold">Simbol</th>
              <th className="pb-3 font-semibold">Isi (Pcs)</th>
              <th className="pb-3 font-semibold">Keterangan</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {units.length > 0 ? (
              pg.pageItems.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-200">{u.name}</td>
                  <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">{u.symbol}</td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(Number(u.ratioToPcs) || 1)} pcs
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{u.description || "-"}</td>
                  <td className="py-3.5">
                    {u.isActive === false ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 font-bold text-[10px]">
                        Nonaktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => onProses?.(u)}
                      title="Proses data"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-sm shadow-red-600/20 transition-colors cursor-pointer"
                    >
                      Proses
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Tidak ada satuan yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination {...pg} />
    </div>
  );
}
