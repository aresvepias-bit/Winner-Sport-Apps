"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

interface OrderItem {
  id: string;
  soNumber: string;
  customer?: { name: string };
  orderType: string;
  totalAmount: number;
  status: string;
}

interface DashboardRecentOrdersProps {
  recentOrders: OrderItem[];
  hidePrices: boolean;
}

export default function DashboardRecentOrders({ recentOrders, hidePrices }: DashboardRecentOrdersProps) {
  const renderAmount = (amount: number) => {
    if (hidePrices) return "Rp ••••••••";
    return formatRupiah(amount);
  };

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Order Penjualan Terbaru</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar transaksi pesanan kodi, grosir, dan custom yang masuk
          </p>
        </div>
        <Link
          href="/sales"
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
        >
          Lihat Semua Order &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. SO</th>
              <th className="pb-3 font-semibold">Pelanggan</th>
              <th className="pb-3 font-semibold">Tipe Penjualan</th>
              <th className="pb-3 font-semibold">Total Tagihan</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-red-600 dark:text-red-400">{order.soNumber}</td>
                  <td className="py-3 text-slate-800 dark:text-slate-200 font-medium">
                    {order.customer?.name || "Pelanggan Umum"}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a2236] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                      {order.orderType}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {renderAmount(order.totalAmount)}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-[10px]">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Belum ada transaksi pesanan masuk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
