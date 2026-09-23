"use client";

import { formatRupiah, formatNumber } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface RawMaterial {
  id: string;
  sku: string;
  name: string;
  standardCost: number;
  currentStock: number;
  minimumStock: number;
  description?: string;
  category?: { name: string };
  unit?: { symbol: string };
}

interface RawMaterialsTableProps {
  materials: RawMaterial[];
  onProses?: (material: RawMaterial) => void;
  resetKey?: string;
}

// Pencarian dan filter status kini dipegang MasterFilterBar di halaman, jadi
// tabel ini cukup menampilkan baris yang sudah disaring.
export default function RawMaterialsTable({ materials, onProses, resetKey = "" }: RawMaterialsTableProps) {
  const pg = usePagination(materials, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Bahan Baku Kain &amp; Aksesoris</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Katalog persediaan bahan mentah dan kain gulungan ({materials.length} item)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Nama Bahan</th>
              <th className="pb-3 font-semibold">Kategori</th>
              <th className="pb-3 font-semibold">Harga Standar / Beli</th>
              <th className="pb-3 font-semibold">Stok Saat Ini</th>
              <th className="pb-3 font-semibold">Min. Stok</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {materials.length > 0 ? (
              pg.pageItems.map((m) => {
                const isLow = Number(m.currentStock) <= Number(m.minimumStock);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono font-bold text-red-600 dark:text-red-400">{m.sku}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                      <div>{m.name}</div>
                      {m.description && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.description}</div>}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{m.category?.name || "Kain"}</td>
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {formatRupiah(m.standardCost)} / {m.unit?.symbol || "kg"}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {formatNumber(m.currentStock)} {m.unit?.symbol || "kg"}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{formatNumber(m.minimumStock)}</td>
                    <td className="py-3">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-[10px]">
                          Stok Kritis
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                      onClick={() => onProses?.(m)}
                      title="Proses data"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-sm shadow-red-600/20 transition-colors cursor-pointer"
                    >
                      Proses
                    </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  Tidak ada data bahan baku ditemukan.
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
