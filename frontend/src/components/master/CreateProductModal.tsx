"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface CreateProductModalProps {
  onClose: () => void;
  onSubmit: (data: {
    sku: string;
    name: string;
    standardCost: number;
    priceSatuan: number;
    priceGrosir: number;
    priceKodi: number;
    currentStock: number;
  }) => Promise<void>;
}

export default function CreateProductModal({ onClose, onSubmit }: CreateProductModalProps) {
  const [form, setForm] = useState({
    sku: `PROD-${Date.now().toString().slice(-4)}`,
    name: "",
    standardCost: 38000,
    priceSatuan: 65000,
    priceGrosir: 55000,
    priceKodi: 1000000,
    currentStock: 0
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Produk Pakaian Jadi Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">SKU / Kode Produk</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Stok Awal Siap Kirim</label>
              <NumberInput
                value={form.currentStock}
                onChange={(val) => setForm({ ...form, currentStock: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Produk Pakaian</label>
            <input
              type="text"
              placeholder="Contoh: Jersey Futsal Garuda Merah Putih, Celana Running..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Estimasi HPP Acuan (Rp)</label>
              <NumberInput
                value={form.standardCost}
                onChange={(val) => setForm({ ...form, standardCost: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Eceran Satuan (Rp)</label>
              <NumberInput
                value={form.priceSatuan}
                onChange={(val) => setForm({ ...form, priceSatuan: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Grosir Lusinan (Rp)</label>
              <NumberInput
                value={form.priceGrosir}
                onChange={(val) => setForm({ ...form, priceGrosir: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga per Kodi (20 Pcs)</label>
              <NumberInput
                value={form.priceKodi}
                onChange={(val) => setForm({ ...form, priceKodi: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
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
              {submitting ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
