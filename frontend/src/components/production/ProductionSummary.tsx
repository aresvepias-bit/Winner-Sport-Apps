"use client";

import { motion } from "framer-motion";
import { ClipboardList, Scissors, PackageCheck, Coins } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { kartuNaik, wadahBerurutan } from "@/lib/motion";
import type { WorkOrder } from "./WorkOrdersTable";

interface Props {
  workOrders: WorkOrder[];
}

const berjalan = (wo: WorkOrder) => wo.status !== "COMPLETED" && wo.status !== "CANCELLED";

export default function ProductionSummary({ workOrders }: Props) {
  const antrean = workOrders.filter((wo) => wo.status === "DRAFT" || wo.status === "PENDING_MATERIAL").length;
  const dikerjakan = workOrders.filter((wo) => wo.status === "IN_PROGRESS").length;
  const selesai = workOrders.filter((wo) => wo.status === "COMPLETED");
  const targetBerjalan = workOrders.filter(berjalan).reduce((t, wo) => t + Number(wo.targetQty), 0);

  // Rata-rata HPP ditimbang jumlah pcs, bukan rata-rata dari rata-rata:
  // SPK 1000 pcs tidak boleh berbobot sama dengan SPK 10 pcs.
  const pcsSelesai = selesai.reduce((t, wo) => t + Number(wo.completedQty), 0);
  const biayaSelesai = selesai.reduce((t, wo) => t + Number(wo.hppPerPcs || 0) * Number(wo.completedQty), 0);
  const hppRata = pcsSelesai > 0 ? biayaSelesai / pcsSelesai : 0;

  const kartu = [
    {
      label: "Antrean SPK",
      nilai: String(antrean),
      catatan: "Sudah diterbitkan, bahan belum keluar",
      Icon: ClipboardList,
      warna: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10"
    },
    {
      label: "Sedang Dikerjakan",
      nilai: String(dikerjakan),
      catatan: `${formatNumber(targetBerjalan)} pcs target berjalan`,
      Icon: Scissors,
      warna: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
    },
    {
      label: "Selesai Produksi",
      nilai: String(selesai.length),
      catatan: `${formatNumber(pcsSelesai)} pcs masuk gudang`,
      Icon: PackageCheck,
      warna: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      label: "Rata-rata HPP / pcs",
      nilai: pcsSelesai > 0 ? formatRupiah(hppRata) : "-",
      catatan: "Dari SPK yang sudah dihitung HPP-nya",
      Icon: Coins,
      warna: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-500/10"
    }
  ];

  return (
    <motion.div
      variants={wadahBerurutan}
      initial="awal"
      animate="masuk"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kartu.map(({ label, nilai, catatan, Icon, warna }) => (
        <motion.div
          key={label}
          variants={kartuNaik}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1.5 truncate text-2xl font-black text-slate-900 dark:text-white">{nilai}</p>
            </div>
            <span className={`shrink-0 rounded-xl p-2 ${warna}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{catatan}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
