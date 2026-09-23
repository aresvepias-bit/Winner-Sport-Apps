"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Boxes, CheckCircle2, Printer, X } from "lucide-react";
import { formatRupiah, formatNumber, formatDate } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";
import { backdropModal, panelModal } from "@/lib/motion";
import { STATUS_SPK, type WorkOrder } from "./WorkOrdersTable";

export interface PengeluaranBahan {
  rawMaterialId: string;
  issuedQty: number;
}

interface Props {
  workOrder: WorkOrder;
  onClose: () => void;
  onCetak: (wo: WorkOrder) => void;
  onSelesaikan: (wo: WorkOrder) => void;
  onKeluarkanBahan: (materials: PengeluaranBahan[]) => Promise<void>;
}

const sisaRencana = (m: any) => Math.max(0, Number(m.plannedQty) - Number(m.actualIssuedQty || 0));

export default function WorkOrderProcessDrawer({
  workOrder,
  onClose,
  onCetak,
  onSelesaikan,
  onKeluarkanBahan
}: Props) {
  const [mode, setMode] = useState<"rincian" | "bahan">("rincian");
  const [jumlah, setJumlah] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bahan = workOrder.materials || [];
  const selesai = workOrder.status === "COMPLETED";
  const dibatalkan = workOrder.status === "CANCELLED";
  const badge = STATUS_SPK[workOrder.status] || { label: workOrder.status, kelas: "" };

  const isiSemuaSisa = () =>
    setJumlah(Object.fromEntries(bahan.map((m) => [m.rawMaterialId, sisaRencana(m)])));

  const adaIsi = bahan.some((m) => (jumlah[m.rawMaterialId] || 0) > 0);
  const melebihiStok = bahan.some(
    (m) => (jumlah[m.rawMaterialId] || 0) > Number(m.rawMaterial?.currentStock ?? Infinity)
  );

  const kirimBahan = async () => {
    setError("");
    setSubmitting(true);
    try {
      const materials = bahan
        .filter((m) => (jumlah[m.rawMaterialId] || 0) > 0)
        .map((m) => ({ rawMaterialId: m.rawMaterialId, issuedQty: jumlah[m.rawMaterialId] }));
      await onKeluarkanBahan(materials);
    } catch (err: any) {
      // Pesan server tampil di panel, bukan alert, supaya angka yang sudah
      // diisi tidak hilang dan bisa langsung diperbaiki.
      setError(err?.message || "Pengeluaran bahan gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  const rincian: Array<{ label: string; nilai: string }> = [
    { label: "Produk", nilai: workOrder.product?.name || "-" },
    { label: "Target produksi", nilai: `${formatNumber(workOrder.targetQty)} pcs` },
    { label: "Hasil jadi", nilai: selesai ? `${formatNumber(workOrder.completedQty)} pcs` : "Belum diselesaikan" },
    { label: "Rijek / cacat", nilai: `${formatNumber(workOrder.scrapQty ?? 0)} pcs` },
    { label: "Biaya bahan terpakai", nilai: formatRupiah(workOrder.materialCost) },
    { label: "Biaya jahit", nilai: formatRupiah(workOrder.sewingCost ?? 0) },
    { label: "Upah potong / finishing", nilai: formatRupiah(workOrder.laborCost ?? 0) },
    { label: "Overhead", nilai: formatRupiah(workOrder.overheadCost ?? 0) },
    {
      label: "HPP aktual per pcs",
      nilai: selesai && workOrder.hppPerPcs ? formatRupiah(workOrder.hppPerPcs) : "Menunggu SPK selesai"
    },
    { label: "Tenggat waktu", nilai: formatDate(workOrder.dueDate) },
    { label: "Catatan", nilai: workOrder.notes || "-" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        variants={backdropModal}
        initial="awal"
        animate="masuk"
        exit="keluar"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
      />
      <motion.div
        variants={panelModal}
        initial="awal"
        animate="masuk"
        exit="keluar"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1a2236] dark:bg-[#0d1424]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-[#1a2236]">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              Proses Surat Perintah Kerja
            </p>
            <h2 className="truncate text-lg font-black text-slate-900 dark:text-white">{workOrder.woNumber}</h2>
            <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.kelas}`}>
              {badge.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Tutup"
            className="cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-6 pt-4 text-xs font-bold dark:border-[#1a2236]">
          {(["rincian", "bahan"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-t-xl px-4 py-2 transition-colors ${
                mode === m
                  ? "bg-slate-100 text-slate-900 dark:bg-[#141c2e] dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {m === "rincian" ? "Rincian & Biaya" : `Bahan (${bahan.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6">
          {mode === "rincian" ? (
            <dl className="divide-y divide-slate-100 text-xs dark:divide-[#1a2236]/60">
              {rincian.map((b) => (
                <div key={b.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0">
                  <dt className="shrink-0 text-slate-500 dark:text-slate-400">{b.label}</dt>
                  <dd className="text-right font-semibold text-slate-900 dark:text-slate-200">{b.nilai}</dd>
                </div>
              ))}
            </dl>
          ) : bahan.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              SPK ini tidak punya rencana pemakaian bahan. Formula BOM produknya belum diisi.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi jumlah bahan yang benar-benar dikeluarkan ke lantai produksi.
                </p>
                {!selesai && !dibatalkan && (
                  <button
                    type="button"
                    onClick={isiSemuaSisa}
                    className="shrink-0 cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Isi sesuai rencana
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 dark:border-[#1a2236] dark:text-slate-400">
                      <th className="pb-2 font-semibold">Bahan</th>
                      <th className="pb-2 text-right font-semibold">Rencana</th>
                      <th className="pb-2 text-right font-semibold">Sudah Keluar</th>
                      <th className="pb-2 text-right font-semibold">Stok Gudang</th>
                      {!selesai && !dibatalkan && <th className="w-32 pb-2 text-right font-semibold">Keluarkan</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
                    {bahan.map((m) => {
                      const satuan = m.rawMaterial?.unit?.symbol || "";
                      const stok = Number(m.rawMaterial?.currentStock ?? 0);
                      const kurang = (jumlah[m.rawMaterialId] || 0) > stok;
                      return (
                        <tr key={m.id}>
                          <td className="py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-200">
                              {m.rawMaterial?.name || "Bahan"}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {formatRupiah(m.unitCost || m.rawMaterial?.standardCost || 0)} / {satuan || "satuan"}
                            </p>
                          </td>
                          <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                            {formatNumber(m.plannedQty)} {satuan}
                          </td>
                          <td className="py-3 text-right text-slate-500 dark:text-slate-400">
                            {formatNumber(m.actualIssuedQty || 0)} {satuan}
                          </td>
                          <td
                            className={`py-3 text-right font-semibold ${
                              stok < sisaRencana(m) ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {formatNumber(stok)} {satuan}
                          </td>
                          {!selesai && !dibatalkan && (
                            <td className="py-3 text-right">
                              <NumberInput
                                allowDecimals
                                value={jumlah[m.rawMaterialId] ?? 0}
                                onChange={(v) => setJumlah((s) => ({ ...s, [m.rawMaterialId]: v }))}
                                className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-right text-xs text-slate-900 focus:outline-none focus:ring-2 dark:bg-[#141c2e] dark:text-slate-200 ${
                                  kurang
                                    ? "border-rose-400 focus:ring-rose-500/40 dark:border-rose-500/60"
                                    : "border-slate-200 focus:ring-red-500/30 dark:border-[#1a2236]"
                                }`}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {melebihiStok && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Ada jumlah yang melebihi stok gudang. Perbaiki dulu sebelum menyimpan.
                </p>
              )}
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-6 sm:flex-row sm:justify-end dark:border-[#1a2236]">
          <button
            type="button"
            onClick={() => onCetak(workOrder)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak SPK
          </button>

          {mode === "bahan" && !selesai && !dibatalkan && bahan.length > 0 && (
            <button
              type="button"
              onClick={kirimBahan}
              disabled={submitting || !adaIsi || melebihiStok}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Boxes className="h-3.5 w-3.5" />
              {submitting ? "Menyimpan..." : "Keluarkan Bahan"}
            </button>
          )}

          {!selesai && !dibatalkan && (
            <button
              type="button"
              onClick={() => onSelesaikan(workOrder)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Selesaikan &amp; Hitung HPP
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
