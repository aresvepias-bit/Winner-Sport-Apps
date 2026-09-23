"use client";

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
  onProses?: (product: Product) => void;
  resetKey?: string;
}

export default function ProductsTable({ products, onProses, resetKey = "" }: ProductsTableProps) {
  const pg = usePagination(products, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Katalog Produk Pakaian Jadi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daftar produk jadi, struktur harga eceran, grosir &amp; kodian ({products.length} model)</p>
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
            {products.length > 0 ? (
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
                    <button
                      onClick={() => onProses?.(p)}
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
