"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface DashboardQuickNavProps {
  cashPosition: number;
  receivable: number;
  payable: number;
  hidePrices: boolean;
}

export default function DashboardQuickNav({
  cashPosition,
  receivable,
  payable,
  hidePrices
}: DashboardQuickNavProps) {
  const renderAmount = (amount: number) => {
    if (hidePrices) return "Rp ••••••••";
    return formatRupiah(amount);
  };

  return (
    <div className="space-y-4">
      {/* Kas & Bank */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Posisi Kas &amp; Bank
        </h3>
        <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">{renderAmount(cashPosition)}</p>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#1a2236] grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">Piutang Penjualan</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{renderAmount(receivable)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Hutang Supplier</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{renderAmount(payable)}</span>
          </div>
        </div>
      </div>

      {/* Navigasi Operasional Cepat */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-5 rounded-2xl shadow-sm dark:shadow-xl space-y-2 transition-colors">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Navigasi Operasional Cepat
        </h3>
        <Link
          href="/sales"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] hover:bg-red-50 dark:hover:bg-[#1a2236] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all group border border-slate-200 dark:border-transparent hover:border-red-300 dark:hover:border-red-500/30"
        >
          <span>+ Order Penjualan (Kodian / Grosir)</span>
          <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
        <Link
          href="/purchasing"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] hover:bg-red-50 dark:hover:bg-[#1a2236] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all group border border-slate-200 dark:border-transparent hover:border-red-300 dark:hover:border-red-500/30"
        >
          <span>+ Order Bahan Kain (PO Supplier)</span>
          <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
        <Link
          href="/inventory"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] hover:bg-red-50 dark:hover:bg-[#1a2236] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all group border border-slate-200 dark:border-transparent hover:border-red-300 dark:hover:border-red-500/30"
        >
          <span>Cek Stok Kain &amp; Opname Fisik</span>
          <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
