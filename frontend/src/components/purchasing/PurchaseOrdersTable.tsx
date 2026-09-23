"use client";

import { formatRupiah, formatDate, formatNumber } from "@/lib/utils";
import ExportButton from "@/components/common/ExportButton";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

export interface PurchaseOrderLine {
  id: string;
  rawMaterialId?: string;
  rawMaterial?: { name: string; unit?: { symbol?: string } };
  quantity: number;
  receivedQty?: number;
  unitPrice: number;
}

export interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  supplierId?: string;
  supplier?: { name: string };
  orderDate: string | Date;
  totalAmount: number;
  status: string;
  notes?: string;
  items?: PurchaseOrderLine[];
}

/** Label dan warna per status, dipakai bersama supaya konsisten di seluruh halaman. */
export const STATUS_PO: Record<string, { label: string; kelas: string }> = {
  DRAFT: {
    label: "Draft",
    kelas: "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/30"
  },
  ORDERED: {
    label: "Dipesan",
    kelas: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20"
  },
  PARTIAL: {
    label: "Diterima Sebagian",
    kelas: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
  },
  RECEIVED: {
    label: "Diterima Penuh",
    kelas: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
  },
  CANCELLED: {
    label: "Dibatalkan",
    kelas: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
  }
};

/** Persentase barang yang sudah masuk gudang, dihitung dari kuantitas, bukan nilai. */
export function persenDiterima(po: PurchaseOrderItem): number {
  const baris = po.items || [];
  const dipesan = baris.reduce((t, i) => t + Number(i.quantity), 0);
  if (dipesan <= 0) return 0;
  const diterima = baris.reduce((t, i) => t + Number(i.receivedQty || 0), 0);
  return Math.min(100, Math.round((diterima / dipesan) * 100));
}

/** PO yang masih boleh menerima barang. */
export function bisaDiproses(po: PurchaseOrderItem): boolean {
  return po.status !== "RECEIVED" && po.status !== "CANCELLED";
}

interface PurchaseOrdersTableProps {
  orders: PurchaseOrderItem[];
  onExportCsv?: () => void;
  onProses?: (po: PurchaseOrderItem) => void;
}

export default function PurchaseOrdersTable({ orders, onExportCsv, onProses }: PurchaseOrdersTableProps) {
  const pg = usePagination(orders, 10);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Purchase Order Bahan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pesanan pembelian bahan baku tekstil ke mitra pabrik &amp; distributor kain
          </p>
        </div>
        {onExportCsv && <ExportButton onClick={onExportCsv} label="Ekspor PO CSV" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. PO</th>
              <th className="pb-3 font-semibold">Supplier</th>
              <th className="pb-3 font-semibold">Bahan Dipesan</th>
              <th className="pb-3 font-semibold">Total Pembelian</th>
              <th className="pb-3 font-semibold">Tanggal Order</th>
              <th className="pb-3 font-semibold">Progres Terima</th>
              <th className="pb-3 font-semibold">Status</th>
              {onProses && <th className="pb-3 font-semibold text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {orders && orders.length > 0 ? (
              pg.pageItems.map((po) => {
                const baris = po.items || [];
                const utama = baris[0];
                const satuan = utama?.rawMaterial?.unit?.symbol || "";
                const persen = persenDiterima(po);
                const badge = STATUS_PO[po.status] || {
                  label: po.status,
                  kelas: "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200"
                };

                return (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">{po.poNumber}</td>
                    <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-200">
                      {po.supplier?.name || "Supplier Bahan"}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300">
                      {utama?.rawMaterial?.name || "-"} ({formatNumber(utama?.quantity)} {satuan})
                      {baris.length > 1 && (
                        <span className="text-slate-400"> +{baris.length - 1} bahan lain</span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      {formatRupiah(po.totalAmount)}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(po.orderDate)}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2 min-w-28">
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
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${badge.kelas}`}>
                        {badge.label}
                      </span>
                    </td>
                    {onProses && (
                      <td className="py-3.5 text-center">
                        {bisaDiproses(po) ? (
                          <button
                            onClick={() => onProses(po)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            Proses
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">&mdash;</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={onProses ? 8 : 7} className="py-6 text-center text-slate-400">
                  Tidak ada catatan purchase order supplier.
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
