"use client";

import { useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
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
  onEdit: (unit: UnitItem) => void;
  onDelete: (id: string, name: string) => void;
}

export default function UnitsTable({ units, onEdit, onDelete }: UnitsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = (units || []).filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.symbol?.toLowerCase().includes(q);
  });
  const pg = usePagination(filtered, 10, search);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Master Satuan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isi satuan menentukan konversi ke pcs, dipakai saat menghitung HPP dan mengurangi stok
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari satuan..."
            className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-red-500 w-full sm:w-52"
          />
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
            {filtered.length > 0 ? (
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(u)}
                        title="Ubah satuan"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 border border-blue-200 dark:border-blue-500/20 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.name)}
                        title="Hapus satuan"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-200 dark:border-rose-500/20 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  {search ? "Satuan tidak ditemukan." : "Belum ada satuan."}
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
