"use client";

import { formatRupiah, formatDate, formatNumber } from "@/lib/utils";
import ExportButton from "@/components/common/ExportButton";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

export interface WorkOrderMaterial {
  id: string;
  rawMaterialId: string;
  plannedQty: number;
  actualIssuedQty?: number;
  unitCost?: number;
  rawMaterial?: {
    name: string;
    currentStock?: number;
    standardCost?: number;
    unit?: { symbol?: string };
  };
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  productId?: string;
  product?: { name: string };
  targetQty: number;
  completedQty: number;
  scrapQty?: number;
  status: string;
  dueDate: string | Date;
  materialCost: number;
  sewingCost?: number;
  laborCost?: number;
  overheadCost?: number;
  hppPerPcs?: number;
  notes?: string;
  materials?: WorkOrderMaterial[];
}

/** Label dan warna per status, dipakai bersama di tabel dan panel Proses. */
export const STATUS_SPK: Record<string, { label: string; kelas: string }> = {
  DRAFT: {
    label: "Draft",
    kelas: "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/30"
  },
  PENDING_MATERIAL: {
    label: "Menunggu Bahan",
    kelas: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20"
  },
  IN_PROGRESS: {
    label: "Sedang Dikerjakan",
    kelas: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
  },
  COMPLETED: {
    label: "Selesai",
    kelas: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
  },
  CANCELLED: {
    label: "Dibatalkan",
    kelas: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
  }
};

/** Bagian bahan yang sudah benar-benar keluar dari gudang, dari sisi kuantitas. */
export function persenBahanKeluar(wo: WorkOrder): number {
  const bahan = wo.materials || [];
  const rencana = bahan.reduce((t, m) => t + Number(m.plannedQty), 0);
  if (rencana <= 0) return 0;
  const keluar = bahan.reduce((t, m) => t + Number(m.actualIssuedQty || 0), 0);
  return Math.min(100, Math.round((keluar / rencana) * 100));
}

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  onProses: (wo: WorkOrder) => void;
  onExportCsv?: () => void;
  resetKey?: string;
}

export default function WorkOrdersTable({
  workOrders,
  onProses,
  onExportCsv,
  resetKey = ""
}: WorkOrdersTableProps) {
  const pg = usePagination(workOrders, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Antrean &amp; Riwayat SPK Produksi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Progres pemotongan kain, perakitan, dan penjahitan</p>
        </div>
        {onExportCsv && <ExportButton onClick={onExportCsv} label="Ekspor SPK CSV" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. SPK</th>
              <th className="pb-3 font-semibold">Produk Target</th>
              <th className="pb-3 font-semibold">Target Qty</th>
              <th className="pb-3 font-semibold">Hasil Jadi</th>
              <th className="pb-3 font-semibold">Bahan Keluar</th>
              <th className="pb-3 font-semibold">Biaya Bahan</th>
              <th className="pb-3 font-semibold">HPP Aktual / pcs</th>
              <th className="pb-3 font-semibold">Tenggat Waktu</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {workOrders.length > 0 ? (
              pg.pageItems.map((wo) => {
                const isCompleted = wo.status === "COMPLETED";
                const persen = persenBahanKeluar(wo);
                const badge = STATUS_SPK[wo.status] || {
                  label: wo.status,
                  kelas: "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200"
                };
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
                    <td className="py-3.5">
                      <div className="flex items-center gap-2 min-w-24">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${persen >= 100 ? "bg-emerald-500" : "bg-sky-500"}`}
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-9 text-right">
                          {persen}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                      {formatRupiah(wo.materialCost)}
                    </td>
                    <td className="py-3.5 font-bold text-purple-600 dark:text-purple-300">
                      {isCompleted && wo.hppPerPcs ? formatRupiah(wo.hppPerPcs) : "Menunggu Selesai"}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(wo.dueDate)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${badge.kelas}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => onProses(wo)}
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
                <td colSpan={10} className="py-6 text-center text-slate-400">
                  Tidak ada SPK yang cocok dengan filter.
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
