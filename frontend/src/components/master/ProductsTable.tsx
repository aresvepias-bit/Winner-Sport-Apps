"use client";

import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface Product {
  id: string;
  sku: string;
  name: string;
  standardCost: number;
  priceSatuan: number;
  priceGrosir: number;
  priceKodi: number;
  currentStock: number;
  minimumStock?: number;
  description?: string;
}

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const pg = usePagination(filteredProducts, 10, search);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Katalog Produk Pakaian Jadi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daftar produk jadi, struktur harga eceran, grosir &amp; kodian ({filteredProducts.length} model)</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SKU atau model baju..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Nama Produk</th>
              <th className="pb-3 font-semibold">HPP Acuan</th>
              <th className="pb-3 font-semibold">Harga Eceran (Satuan)</th>
              <th className="pb-3 font-semibold">Harga Grosir</th>
              <th className="pb-3 font-semibold">Harga per Kodi (20 pcs)</th>
              <th className="pb-3 font-semibold">Stok Siap Kirim</th>
              <th className="pb-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {filteredProducts.length > 0 ? (
              pg.pageItems.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-red-600 dark:text-red-400">{p.sku}</td>
                  <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                    <div>{p.name}</div>
                    {p.description && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</div>}
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{formatRupiah(p.standardCost)}</td>
                  <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(p.priceSatuan)}</td>
                  <td className="py-3 font-semibold text-red-600 dark:text-red-400">{formatRupiah(p.priceGrosir)}</td>
                  <td className="py-3 font-semibold text-purple-600 dark:text-purple-400">{formatRupiah(p.priceKodi)}</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-white">{formatNumber(p.currentStock)} pcs</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit?.(p)}
                        title="Edit Produk"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete?.(p.id, p.name)}
                        title="Hapus Produk"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  Tidak ada data produk ditemukan.
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
