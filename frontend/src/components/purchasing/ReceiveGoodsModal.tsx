"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PackageCheck, X } from "lucide-react";
import { formatRupiah, formatNumber, formatDate } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";
import { backdropModal, panelModal } from "@/lib/motion";
import type { PurchaseOrderItem } from "./PurchaseOrdersTable";

export interface PenerimaanBaris {
  itemId: string;
  receivedQty: number;
}

interface Props {
  po: PurchaseOrderItem;
  onClose: () => void;
  onSubmit: (data: { items: PenerimaanBaris[]; notes: string }) => Promise<void>;
}

const sisaBaris = (qty: number | string, diterima: number | string | undefined) =>
  Math.max(0, Number(qty) - Number(diterima || 0));

export default function ReceiveGoodsModal({ po, onClose, onSubmit }: Props) {
  const baris = po.items || [];
  const [jumlah, setJumlah] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isiSemuaSisa = () =>
    setJumlah(Object.fromEntries(baris.map((i) => [i.id, sisaBaris(i.quantity, i.receivedQty)])));

  const nilaiPenerimaan = baris.reduce(
    (total, i) => total + (jumlah[i.id] || 0) * Number(i.unitPrice),
    0
  );
  const adaIsi = baris.some((i) => (jumlah[i.id] || 0) > 0);
  const melebihiSisa = baris.some((i) => (jumlah[i.id] || 0) > sisaBaris(i.quantity, i.receivedQty));

  const kirim = async () => {
    setError("");
    setSubmitting(true);
    try {
      const items = baris
        .filter((i) => (jumlah[i.id] || 0) > 0)
        .map((i) => ({ itemId: i.id, receivedQty: jumlah[i.id] }));
      await onSubmit({ items, notes });
    } catch (err: any) {
      // Pesan server ditampilkan di modal, bukan alert, supaya angka yang sudah
      // diisi tidak hilang dan bisa langsung diperbaiki.
      setError(err?.message || "Penerimaan gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  };

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
        className="relative z-10 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 dark:border-[#1a2236]">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-wider mb-1">
              <PackageCheck className="w-4 h-4" />
              Proses Penerimaan Barang
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{po.poNumber}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {po.supplier?.name || "Supplier"} &middot; dipesan {formatDate(po.orderDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Isi jumlah yang benar-benar diterima. Sisa yang belum datang tetap terbuka untuk kiriman berikutnya.
            </p>
            <button
              onClick={isiSemuaSisa}
              className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Terima semua sisa
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Bahan</th>
                  <th className="pb-2 font-semibold text-right">Dipesan</th>
                  <th className="pb-2 font-semibold text-right">Sudah Diterima</th>
                  <th className="pb-2 font-semibold text-right">Sisa</th>
                  <th className="pb-2 font-semibold text-right w-36">Terima Sekarang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
                {baris.map((i) => {
                  const sisa = sisaBaris(i.quantity, i.receivedQty);
                  const satuan = i.rawMaterial?.unit?.symbol || "";
                  const kelebihan = (jumlah[i.id] || 0) > sisa;
                  return (
                    <tr key={i.id}>
                      <td className="py-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-200">
                          {i.rawMaterial?.name || "Bahan"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatRupiah(i.unitPrice)} / {satuan || "satuan"}
                        </p>
                      </td>
                      <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                        {formatNumber(i.quantity)} {satuan}
                      </td>
                      <td className="py-3 text-right text-slate-500 dark:text-slate-400">
                        {formatNumber(i.receivedQty || 0)} {satuan}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatNumber(sisa)} {satuan}
                      </td>
                      <td className="py-3 text-right">
                        <NumberInput
                          allowDecimals
                          value={jumlah[i.id] ?? 0}
                          onChange={(v) => setJumlah((s) => ({ ...s, [i.id]: v }))}
                          disabled={sisa <= 0}
                          className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141c2e] border text-xs text-right text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 disabled:opacity-40 ${
                            kelebihan
                              ? "border-rose-400 dark:border-rose-500/60 focus:ring-rose-500/40"
                              : "border-slate-200 dark:border-[#1a2236] focus:ring-blue-500/40"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Catatan penerimaan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Nomor surat jalan, kondisi barang, atau catatan QC..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141c2e] border border-slate-200 dark:border-[#1a2236] text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {melebihiSisa && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Ada jumlah yang melebihi sisa pesanan. Perbaiki dulu sebelum menyimpan.
            </p>
          )}
          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-t border-slate-200 dark:border-[#1a2236]">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Nilai barang diterima:{" "}
            <strong className="text-slate-900 dark:text-white">{formatRupiah(nilaiPenerimaan)}</strong>
            <span className="block text-[11px]">Menambah persediaan bahan dan hutang ke supplier.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={kirim}
              disabled={submitting || !adaIsi || melebihiSisa}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-blue-600/25 cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Penerimaan"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
