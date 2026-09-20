"use client";

import { Printer, Download } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

export interface SalesOrderItem {
  id: string;
  soNumber: string;
  customer?: { name: string; phone?: string; address?: string };
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string | Date;
  items?: Array<{
    customDescription?: string;
    product?: { name: string };
    quantity: number;
    pricePerUnit: number;
    unitName?: string;
  }>;
}

interface SalesOrdersTableProps {
  orders: SalesOrderItem[];
  /** Kode tipe -> nama tampilan, dari master Tipe Penjualan. */
  salesTypeLabels?: Record<string, string>;
  onOpenPrintModal?: (order: SalesOrderItem) => void;
  onExportCsv?: () => void;
}

export default function SalesOrdersTable({
  orders,
  salesTypeLabels = {},
  onOpenPrintModal,
  onExportCsv
}: SalesOrdersTableProps) {
  const pg = usePagination(orders, 10);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Transaksi Sales Order</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Riwayat pesanan masuk dari pelanggan dan toko mitra
          </p>
        </div>

        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
            title="Ekspor Seluruh Pesanan"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor Penjualan CSV</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. SO</th>
              <th className="pb-3 font-semibold">Pelanggan</th>
              <th className="pb-3 font-semibold">Tipe Order</th>
              <th className="pb-3 font-semibold">Rincian Item</th>
              <th className="pb-3 font-semibold">Total Tagihan</th>
              <th className="pb-3 font-semibold">Terbayar</th>
              <th className="pb-3 font-semibold">Status Bayar</th>
              <th className="pb-3 font-semibold">Status Produksi</th>
              <th className="pb-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {orders && orders.length > 0 ? (
              pg.pageItems.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">{o.soNumber}</td>
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-200">
                    {o.customer?.name || "Pelanggan Umum"}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-700 dark:text-slate-300 font-medium">
                      {salesTypeLabels[o.orderType] || o.orderType}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300">
                    {o.items?.[0]?.customDescription ||
                      o.items?.[0]?.product?.name ||
                      "Pakaian Konveksi"}
                  </td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(o.totalAmount)}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {formatRupiah(o.paidAmount)}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        o.paymentStatus === "PAID"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : o.paymentStatus === "PARTIAL"
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-[10px]">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {onOpenPrintModal && (
                      <button
                        onClick={() => onOpenPrintModal(o)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm shadow-blue-600/20 cursor-pointer transition-all"
                        title="Cetak Faktur Invoice & Surat Jalan"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Faktur</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  Tidak ada data transaksi order penjualan.
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
