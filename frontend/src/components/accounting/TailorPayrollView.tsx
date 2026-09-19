"use client";

import { useState } from "react";
import { Printer, CheckCircle2, DollarSign } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import PrintPayrollSlipModal from "@/components/print/PrintPayrollSlipModal";

export interface TailorPayrollItem {
  id: string;
  name: string;
  role: string;
  spkCount: number;
  completedPcs: number;
  ratePerPcs: number;
  totalWage: number;
  status: "LUNAS" | "MENUNGGU";
  period: string;
}

export default function TailorPayrollView() {
  const [tailors, setTailors] = useState<TailorPayrollItem[]>([
    {
      id: "1",
      name: "Siti Rahmawati",
      role: "Operator Jahit Utama",
      spkCount: 4,
      completedPcs: 350,
      ratePerPcs: 6500,
      totalWage: 2275000,
      status: "LUNAS",
      period: "September 2026"
    },
    {
      id: "2",
      name: "Budi Santoso",
      role: "Penjahit Kaos & Obras",
      spkCount: 3,
      completedPcs: 280,
      ratePerPcs: 6500,
      totalWage: 1820000,
      status: "MENUNGGU",
      period: "September 2026"
    },
    {
      id: "3",
      name: "Agus Prasetyo",
      role: "Operator Overdeck & Kerah",
      spkCount: 3,
      completedPcs: 200,
      ratePerPcs: 6500,
      totalWage: 1300000,
      status: "MENUNGGU",
      period: "September 2026"
    }
  ]);

  const [selectedTailor, setSelectedTailor] = useState<TailorPayrollItem | null>(null);

  const handleToggleStatus = (id: string) => {
    setTailors((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "LUNAS" ? "MENUNGGU" : "LUNAS" } : t
      )
    );
  };

  const totalPcs = tailors.reduce((acc, curr) => acc + curr.completedPcs, 0);
  const totalWages = tailors.reduce((acc, curr) => acc + curr.totalWage, 0);
  const paidWages = tailors
    .filter((t) => t.status === "LUNAS")
    .reduce((acc, curr) => acc + curr.totalWage, 0);

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Pcs Baju Dijahit
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatNumber(totalPcs)} Pcs
          </p>
          <p className="text-xs text-slate-500 mt-1">Akumulasi dari seluruh SPK selesai</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Kewajiban Upah Borongan
          </span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatRupiah(totalWages)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tarif rata-rata Rp 6.500 / pcs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-emerald-300 dark:border-emerald-500/30 shadow-sm dark:shadow-xl">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Upah Telah Dicairkan
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatRupiah(paidWages)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1 font-semibold">
            Sisa Belum Dibayar: {formatRupiah(totalWages - paidWages)}
          </p>
        </div>
      </div>

      {/* Tailor Table */}
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Rekapitulasi Upah Penjahit Borongan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kalkulasi otomatis hak upah penjahit dari kuantitas hasil produksi SPK selesai
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Nama Penjahit</th>
                <th className="pb-3 font-semibold">Peran / Mesin</th>
                <th className="pb-3 font-semibold">SPK Selesai</th>
                <th className="pb-3 font-semibold">Total Pcs Jadi</th>
                <th className="pb-3 font-semibold">Tarif / Pcs</th>
                <th className="pb-3 font-semibold">Total Upah Borongan</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
              {tailors.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 dark:text-slate-200">{t.name}</td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300">{t.role}</td>
                  <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {t.spkCount} SPK
                  </td>
                  <td className="py-3.5 font-bold text-red-600 dark:text-red-400">
                    {formatNumber(t.completedPcs)} pcs
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">
                    {formatRupiah(t.ratePerPcs)}
                  </td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(t.totalWage)}
                  </td>
                  <td className="py-3.5">
                    <button
                      onClick={() => handleToggleStatus(t.id)}
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer transition-colors ${
                        t.status === "LUNAS"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                      }`}
                    >
                      {t.status}
                    </button>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => setSelectedTailor(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm shadow-blue-600/20 cursor-pointer transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Slip Upah</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Print Modal */}
      {selectedTailor && (
        <PrintPayrollSlipModal
          tailor={selectedTailor}
          onClose={() => setSelectedTailor(null)}
        />
      )}
    </div>
  );
}
