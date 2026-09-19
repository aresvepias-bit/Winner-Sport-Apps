"use client";

import { Printer } from "lucide-react";
import { formatRupiah, formatDate, formatNumber } from "@/lib/utils";

export interface WorkOrder {
  id: string;
  woNumber: string;
  product?: { name: string };
  targetQty: number;
  completedQty: number;
  scrapQty?: number;
  status: string;
  dueDate: string | Date;
  materialCost: number;
  hppPerPcs?: number;
  notes?: string;
}

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  onOpenCompleteModal: (wo: WorkOrder) => void;
  onOpenPrintModal: (wo: WorkOrder) => void;
}

export default function WorkOrdersTable({
  workOrders,
  onOpenCompleteModal,
  onOpenPrintModal
}: WorkOrdersTableProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Antrean &amp; Riwayat SPK Produksi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Progres pemotongan kain, perakitan, dan penjahitan</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. SPK</th>
              <th className="pb-3 font-semibold">Produk Target</th>
              <th className="pb-3 font-semibold">Target Qty</th>
              <th className="pb-3 font-semibold">Hasil Jadi</th>
              <th className="pb-3 font-semibold">Biaya Bahan</th>
              <th className="pb-3 font-semibold">HPP Aktual / pcs</th>
              <th className="pb-3 font-semibold">Tenggat Waktu</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {workOrders.length > 0 ? (
              workOrders.map((wo) => {
                const isCompleted = wo.status === "COMPLETED";
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">{wo.woNumber}</td>
                    <td className="py-3.5 font-medium text-slate-900 dark:text-slate-200">{wo.product?.name}</td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{formatNumber(wo.targetQty)} pcs</td>
                    <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {isCompleted ? `${formatNumber(wo.completedQty)} pcs` : "-"}
                      {wo.scrapQty && wo.scrapQty > 0 ? (
                        <span className="text-rose-500 text-[10px] ml-1">({formatNumber(wo.scrapQty)} rijek)</span>
                      ) : null}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                      {formatRupiah(wo.materialCost)}
                    </td>
                    <td className="py-3.5 font-bold text-purple-600 dark:text-purple-300">
                      {isCompleted && wo.hppPerPcs ? formatRupiah(wo.hppPerPcs) : "Menunggu Selesai"}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(wo.dueDate)}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 animate-pulse"
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenPrintModal(wo)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2236] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="Cetak Lembar Kerja SPK"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak SPK</span>
                        </button>

                        {!isCompleted ? (
                          <button
                            onClick={() => onOpenCompleteModal(wo)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            Selesaikan
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
                            Tersimpan
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  Tidak ada SPK dalam antrean.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
