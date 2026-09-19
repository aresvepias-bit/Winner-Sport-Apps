"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface CreateRawMaterialModalProps {
  onClose: () => void;
  onSubmit: (data: {
    sku: string;
    name: string;
    standardCost: number;
    currentStock: number;
    minimumStock: number;
    unitSymbol: string;
    categoryName: string;
  }) => Promise<void>;
}

export default function CreateRawMaterialModal({ onClose, onSubmit }: CreateRawMaterialModalProps) {
  const [form, setForm] = useState({
    sku: `RAW-${Date.now().toString().slice(-4)}`,
    name: "",
    standardCost: 85000,
    currentStock: 50,
    minimumStock: 15,
    unitSymbol: "kg",
    categoryName: "Kain Utama"
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Bahan Baku Kain Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">SKU / Kode Bahan</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Kategori</label>
              <select
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="Kain Utama">Kain Utama</option>
                <option value="Kain Rib / Kerah">Kain Rib / Kerah</option>
                <option value="Benang & Obras">Benang &amp; Obras</option>
                <option value="Aksesoris & Label">Aksesoris &amp; Label</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Bahan / Jenis Kain</label>
            <input
              type="text"
              placeholder="Contoh: Kain Dryfit Milano Putih, Cotton Combed 24s Navy..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Standar Beli (Rp)</label>
              <NumberInput
                value={form.standardCost}
                onChange={(val) => setForm({ ...form, standardCost: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Satuan Ukur</label>
              <select
                value={form.unitSymbol}
                onChange={(e) => setForm({ ...form, unitSymbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="yard">yard (Yard Kain)</option>
                <option value="meter">meter</option>
                <option value="roll">roll (Gulungan)</option>
                <option value="pcs">pcs</option>
                <option value="cone">cone (Benang)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Stok Awal</label>
              <NumberInput
                value={form.currentStock}
                onChange={(val) => setForm({ ...form, currentStock: val || 0 })}
                allowDecimals={true}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Peringatan Min. Stok</label>
              <NumberInput
                value={form.minimumStock}
                onChange={(val) => setForm({ ...form, minimumStock: val || 0 })}
                allowDecimals={true}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
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
              {submitting ? "Menyimpan..." : "Simpan Bahan Baku"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
