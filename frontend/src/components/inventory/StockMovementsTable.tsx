"use client";

import { Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MovementItem {
  id: string;
  createdAt: string | Date;
  rawMaterial?: { name: string };
  product?: { name: string };
  type: string;
  quantity: number;
  balanceAfter: number;
  referenceId?: string;
}

interface StockMovementsTableProps {
  movements: MovementItem[];
  onExportCsv?: () => void;
}

export default function StockMovementsTable({ movements, onExportCsv }: StockMovementsTableProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Log Mutasi Inventori &amp; Kartu Stok</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Riwayat mutasi keluar, masuk, pemakaian produksi (SPK), dan penyesuaian opname
          </p>
        </div>

        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
            title="Unduh Kartu Stok"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor Mutasi CSV</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Waktu</th>
              <th className="pb-3 font-semibold">Barang / Bahan</th>
              <th className="pb-3 font-semibold">Tipe Mutasi</th>
              <th className="pb-3 font-semibold">Kuantitas</th>
              <th className="pb-3 font-semibold">Sisa Stok</th>
              <th className="pb-3 font-semibold">No. Dokumen Referensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {movements && movements.length > 0 ? (
              movements.map((m) => {
                const isPositive = Number(m.quantity) > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-500 dark:text-slate-400">{formatDate(m.createdAt)}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                      {m.rawMaterial?.name || m.product?.name || "Bahan/Produk"}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-700 dark:text-slate-300 font-medium">
                        {m.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">{m.balanceAfter}</td>
                    <td className="py-3 font-mono text-red-600 dark:text-red-400">{m.referenceId || "-"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Belum ada log mutasi stok tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
