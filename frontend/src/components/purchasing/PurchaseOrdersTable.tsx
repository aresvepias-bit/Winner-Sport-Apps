"use client";

import { formatRupiah, formatDate, formatNumber } from "@/lib/utils";

export interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  supplier?: { name: string };
  orderDate: string | Date;
  totalAmount: number;
  status: string;
  items?: Array<{
    rawMaterial?: { name: string };
    quantity: number;
    unitPrice: number;
  }>;
}

interface PurchaseOrdersTableProps {
  orders: PurchaseOrderItem[];
}

export default function PurchaseOrdersTable({ orders }: PurchaseOrdersTableProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Purchase Order Bahan</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pesanan pembelian bahan baku tekstil ke mitra pabrik &amp; distributor kain
        </p>
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
              <th className="pb-3 font-semibold">Status Penerimaan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {orders && orders.length > 0 ? (
              orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">{po.poNumber}</td>
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-200">
                    {po.supplier?.name || "Supplier Bahan"}
                  </td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300">
                    {po.items?.[0]?.rawMaterial?.name} ({formatNumber(po.items?.[0]?.quantity)} kg)
                  </td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                    {formatRupiah(po.totalAmount)}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(po.orderDate)}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        po.status === "RECEIVED"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 animate-pulse"
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Tidak ada catatan purchase order supplier.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
