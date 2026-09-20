"use client";

import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
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
  onEdit?: (material: RawMaterial) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function RawMaterialsTable({ materials, onEdit, onDelete }: RawMaterialsTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "LOW" | "SAFE">("ALL");

  const filteredMaterials = materials.filter((m) => {
    const q = search.toLowerCase();
    const matchQuery = (
      m.name?.toLowerCase().includes(q) ||
      m.sku?.toLowerCase().includes(q) ||
      m.category?.name?.toLowerCase().includes(q)
    );
    const isLow = Number(m.currentStock) <= Number(m.minimumStock);
    if (!matchQuery) return false;
    if (filterStatus === "LOW") return isLow;
    if (filterStatus === "SAFE") return !isLow;
    return true;
  });

  const pg = usePagination(filteredMaterials, 10, `${search}|${filterStatus}`);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Bahan Baku Kain &amp; Aksesoris</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Katalog persediaan bahan mentah dan kain gulungan ({filteredMaterials.length} item)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === "ALL"
                  ? "bg-white dark:bg-[#1a2236] text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus("LOW")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === "LOW"
                  ? "bg-rose-500 text-white shadow-xs font-bold"
                  : "text-rose-600 dark:text-rose-400 hover:text-rose-700"
              }`}
            >
              Kritis
            </button>
            <button
              onClick={() => setFilterStatus("SAFE")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === "SAFE"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              }`}
            >
              Aman
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU atau nama bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 w-56"
            />
          </div>
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
            {filteredMaterials.length > 0 ? (
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit?.(m)}
                          title="Edit Bahan Baku"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete?.(m.id, m.name)}
                          title="Hapus Bahan Baku"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
