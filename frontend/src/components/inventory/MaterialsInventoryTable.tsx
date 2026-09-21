"use client";

import { formatRupiah, formatNumber } from "@/lib/utils";
import StockRowActions from "./StockRowActions";
import ExportButton from "@/components/common/ExportButton";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  standardCost: number;
  unit?: { symbol: string };
}

interface MaterialsInventoryTableProps {
  materials: MaterialItem[];
  onMovement?: (id: string, direction: "IN" | "OUT") => void;
  onViewLedger?: (id: string, name: string) => void;
  onExportCsv?: () => void;
}

export default function MaterialsInventoryTable({ materials, onExportCsv, onMovement, onViewLedger }: MaterialsInventoryTableProps) {
  const pg = usePagination(materials, 10);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-4 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Persediaan Bahan Baku Aktif</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kuantitas stok bahan mentah saat ini beserta valuasi nilai persediaan
          </p>
        </div>
        {onExportCsv && <ExportButton onClick={onExportCsv} label="Ekspor Stok Bahan CSV" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs [&_th]:pr-4 [&_td]:pr-4 [&_th:last-child]:pr-0 [&_td:last-child]:pr-0">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Nama Bahan</th>
              <th className="pb-3 font-semibold">Stok Saat Ini</th>
              <th className="pb-3 font-semibold">Nilai Per Satuan</th>
              <th className="pb-3 font-semibold">Total Nilai Stok</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="w-32 pb-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {materials && materials.length > 0 ? (
              pg.pageItems.map((m) => {
                const totalVal = Number(m.currentStock) * Number(m.standardCost);
                const isLow = Number(m.currentStock) <= Number(m.minimumStock);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono font-bold text-red-600 dark:text-red-400">{m.sku}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-200">{m.name}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {formatNumber(m.currentStock)} {m.unit?.symbol || "kg"}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{formatRupiah(m.standardCost)}</td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totalVal)}
                    </td>
                    <td className="py-3">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-[10px]">
                          Perlu Restock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
                          Cukup
                        </span>
                      )}
                    </td>
                    <td className="py-3"><StockRowActions itemId={m.id} itemName={m.name} onMovement={onMovement} onViewLedger={onViewLedger} /></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  Tidak ada data stok bahan baku.
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
