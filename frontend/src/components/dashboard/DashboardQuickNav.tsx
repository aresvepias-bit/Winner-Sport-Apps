"use client";

import Link from "next/link";
import { ArrowUpRight, ShoppingCart, Truck, Scissors, Package, TrendingUp } from "lucide-react";
import { canAccess } from "@/lib/routeAccess";
import { getStoredUser } from "@/lib/session";

const SHORTCUTS = [
  { href: "/sales", label: "Buat Order Penjualan", hint: "Kodian, grosir, custom", icon: ShoppingCart },
  { href: "/production", label: "Terbitkan SPK Produksi", hint: "Perintah kerja jahit", icon: Scissors },
  { href: "/purchasing", label: "Order Bahan ke Supplier", hint: "PO kain & aksesoris", icon: Truck },
  { href: "/inventory", label: "Cek Stok & Opname", hint: "Hitung fisik gudang", icon: Package },
  { href: "/accounting", label: "Catat Pengeluaran Kas", hint: "Beban operasional", icon: TrendingUp }
];

/** Hanya menampilkan pintasan yang memang boleh dibuka pengguna ini. */
export default function DashboardQuickNav() {
  const modules = getStoredUser()?.modules;
  const shortcuts = SHORTCUTS.filter((s) => canAccess(modules, s.href));

  if (shortcuts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Aksi Cepat</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Pekerjaan harian yang paling sering dibuka</p>

      <div className="space-y-2">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-transparent hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/60 dark:hover:bg-[#1a2236] transition-all group"
            >
              <span className="p-2 rounded-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] text-slate-500 group-hover:text-blue-600 transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 truncate">{s.hint}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
