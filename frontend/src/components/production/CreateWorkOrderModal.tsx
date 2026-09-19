"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";

interface ProductOption {
  id: string;
  name: string;
}

interface CreateWorkOrderModalProps {
  products: ProductOption[];
  onClose: () => void;
  onSubmit: (formData: {
    productId: string;
    targetQty: number;
    dueDate: string;
    notes: string;
  }) => Promise<void>;
}

export default function CreateWorkOrderModal({
  products,
  onClose,
  onSubmit
}: CreateWorkOrderModalProps) {
  const [productId, setProductId] = useState(products[0]?.id || "1");
  const [targetQty, setTargetQty] = useState(100);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ productId, targetQty, dueDate, notes });
    } finally {
      setSubmitting(false);
    }
  };

  const estFabricKg = (targetQty * 0.25 * 1.03).toFixed(2);
  const estFabricCost = Math.round(Number(estFabricKg) * 85000);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Buat Surat Perintah Kerja (SPK) Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alokasikan pemotongan kain dan jadwal penjahitan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Produk Pakaian Target
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            >
              {products && products.length > 0 ? (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Jersey Futsal Winner Dryfit (Custom)</option>
                  <option value="2">Kaos Polos Cotton Combed 30s Hitam</option>
                  <option value="3">Celana Training Parasut Despo</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Target Produksi (Pcs)
              </label>
              <NumberInput
                value={targetQty}
                onChange={(val) => setTargetQty(val || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Tenggat Waktu Selesai
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Automatic BOM calculation preview */}
          <div className="p-3 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl space-y-1">
            <span className="font-bold text-red-600 dark:text-red-400 block text-[11px] uppercase tracking-wider">
              Kalkulasi Alokasi Bahan Otomatis (BOM):
            </span>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Estimasi Kain Utama:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {estFabricKg} kg (inc. 3% waste)
              </span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Estimasi Nilai Bahan:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(estFabricCost)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Catatan Khusus SPK
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sablon polyflex nama & nomor punggung, kerah V-neck..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500 h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? "Menerbitkan..." : "Terbitkan SPK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
