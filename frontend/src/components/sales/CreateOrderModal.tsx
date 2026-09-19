"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";

interface CreateOrderModalProps {
  onClose: () => void;
  onSubmit: (newOrder: {
    customerId: string;
    orderType: string;
    quantity: number;
    unitName: string;
    pricePerUnit: number;
    notes: string;
  }) => Promise<void>;
}

export default function CreateOrderModal({ onClose, onSubmit }: CreateOrderModalProps) {
  const [form, setForm] = useState({
    customerId: "1",
    orderType: "KODIAN",
    quantity: 5,
    unitName: "kodi",
    pricePerUnit: 1200000,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Input Order Penjualan Baru</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tipe Penjualan</label>
            <select
              value={form.orderType}
              onChange={(e) => setForm({ ...form, orderType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
            >
              <option value="KODIAN">Penjualan Kodian (1 Kodi = 20 Pcs)</option>
              <option value="BULK_GROSIR">Grosir / Partai Besar</option>
              <option value="CUSTOM_ORDER">Custom Order (Sablon / Tim)</option>
              <option value="SATUAN">Satuan / Eceran</option>
              <option value="PROJECT">Project Korporasi / Event</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Kuantitas</label>
              <NumberInput
                value={form.quantity}
                onChange={(val) => setForm({ ...form, quantity: val || 1 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Satuan</label>
              <select
                value={form.unitName}
                onChange={(e) => setForm({ ...form, unitName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="kodi">Kodi (20 pcs)</option>
                <option value="pcs">Pcs (Satuan)</option>
                <option value="lusin">Lusin (12 pcs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga per Satuan (Rp)</label>
            <NumberInput
              value={form.pricePerUnit}
              onChange={(val) => setForm({ ...form, pricePerUnit: val || 0 })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#141b2d] rounded-xl flex justify-between items-center text-xs border border-slate-200 dark:border-[#1a2236]">
            <span className="text-slate-600 dark:text-slate-400">Total Tagihan SO:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatRupiah(form.quantity * form.pricePerUnit)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3">
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
              {submitting ? "Menyimpan..." : "Simpan & Terbitkan Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
