"use client";

import { motion } from "framer-motion";
import { ClipboardList, Truck, PackageCheck, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { kartuNaik, wadahBerurutan } from "@/lib/motion";
import type { PurchaseOrderItem } from "./PurchaseOrdersTable";

/** Nilai barang yang sudah dipesan tapi belum sampai di gudang. */
export function nilaiBelumDiterima(po: PurchaseOrderItem): number {
  if (po.status === "CANCELLED" || po.status === "RECEIVED") return 0;
  return (po.items || []).reduce((total, i) => {
    const sisa = Number(i.quantity) - Number(i.receivedQty || 0);
    return total + (sisa > 0 ? sisa * Number(i.unitPrice) : 0);
  }, 0);
}

interface Props {
  orders: PurchaseOrderItem[];
}

export default function PurchasingSummary({ orders }: Props) {
  const menungguKiriman = orders.filter((po) => po.status === "ORDERED" || po.status === "DRAFT").length;
  const sebagian = orders.filter((po) => po.status === "PARTIAL").length;
  const selesai = orders.filter((po) => po.status === "RECEIVED").length;
  const nilaiTerhutang = orders.reduce((t, po) => t + nilaiBelumDiterima(po), 0);

  const kartu = [
    {
      label: "Menunggu Kiriman",
      nilai: String(menungguKiriman),
      catatan: "PO sudah dipesan, barang belum datang",
      Icon: Truck,
      warna: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10"
    },
    {
      label: "Diterima Sebagian",
      nilai: String(sebagian),
      catatan: "Masih ada sisa kiriman yang ditunggu",
      Icon: ClipboardList,
      warna: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
    },
    {
      label: "Selesai Diterima",
      nilai: String(selesai),
      catatan: "Seluruh barang sudah masuk gudang",
      Icon: PackageCheck,
      warna: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      label: "Nilai Belum Diterima",
      nilai: formatRupiah(nilaiTerhutang),
      catatan: "Barang dipesan yang belum jadi persediaan",
      Icon: Wallet,
      warna: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-500/10"
    }
  ];

  return (
    <motion.div
      variants={wadahBerurutan}
      initial="awal"
      animate="masuk"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {kartu.map(({ label, nilai, catatan, Icon, warna }) => (
        <motion.div
          key={label}
          variants={kartuNaik}
          className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white truncate">{nilai}</p>
            </div>
            <span className={`shrink-0 p-2 rounded-xl ${warna}`}>
              <Icon className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{catatan}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
