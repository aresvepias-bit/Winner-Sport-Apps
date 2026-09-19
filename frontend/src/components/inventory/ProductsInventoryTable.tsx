"use client";

import { formatRupiah, formatNumber } from "@/lib/utils";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  standardCost: number;
}

interface ProductsInventoryTableProps {
  products: ProductItem[];
}

export default function ProductsInventoryTable({ products }: ProductsInventoryTableProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Persediaan Pakaian Jadi Siap Jual</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Stok barang jadi di gudang dengan kalkulasi konversi satuan kodian (1 Kodi = 20 Pcs)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Nama Produk</th>
              <th className="pb-3 font-semibold">Stok (Pcs)</th>
              <th className="pb-3 font-semibold">Konversi Kodian (1 Kodi = 20 Pcs)</th>
              <th className="pb-3 font-semibold">Nilai HPP Persediaan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {products && products.length > 0 ? (
              products.map((p) => {
                const kodi = Math.floor(p.currentStock / 20);
                const sisaPcs = p.currentStock % 20;
                const totalHpp = Number(p.currentStock) * Number(p.standardCost);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono font-bold text-red-600 dark:text-red-400">{p.sku}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-200">{p.name}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {formatNumber(p.currentStock)} pcs
                    </td>
                    <td className="py-3 text-red-600 dark:text-red-400 font-semibold">
                      {kodi} Kodi {sisaPcs > 0 ? `+ ${sisaPcs} Pcs` : ""}
                    </td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totalHpp)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Tidak ada data stok produk jadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
