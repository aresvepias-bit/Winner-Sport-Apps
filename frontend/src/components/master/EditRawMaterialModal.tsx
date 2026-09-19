"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface EditRawMaterialModalProps {
  material: {
    id: string;
    sku: string;
    name: string;
    standardCost: number;
    currentStock: number;
    minimumStock: number;
    description?: string;
    category?: { name: string };
    unit?: { symbol: string };
  };
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
}

export default function EditRawMaterialModal({ material, onClose, onSubmit }: EditRawMaterialModalProps) {
  const [form, setForm] = useState({
    name: material.name || "",
    standardCost: Number(material.standardCost) || 0,
    minimumStock: Number(material.minimumStock) || 0,
    description: material.description || ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(material.id, form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Bahan Baku Kain</h3>
            <p className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">{material.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Bahan / Jenis Kain</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Standar / Beli (Rp)</label>
              <NumberInput
                value={form.standardCost}
                onChange={(val) => setForm({ ...form, standardCost: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Batas Minimum Stok</label>
              <NumberInput
                value={form.minimumStock}
                onChange={(val) => setForm({ ...form, minimumStock: val || 0 })}
                allowDecimals={true}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Catatan / Keterangan Spesifikasi</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Gramasi, lebar kain, setting, atau supplier langganan..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1a2236]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
