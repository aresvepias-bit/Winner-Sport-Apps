"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";
import type { UnitItem } from "@/components/master/UnitsTable";

interface UnitModalProps {
  unit?: UnitItem | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500";

export default function UnitModal({ unit, onClose, onSubmit }: UnitModalProps) {
  const isEdit = Boolean(unit);
  const [form, setForm] = useState({
    name: unit?.name || "",
    symbol: unit?.symbol || "",
    ratioToPcs: Number(unit?.ratioToPcs) || 1,
    description: unit?.description || "",
    isActive: unit?.isActive !== false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(isEdit ? form : { name: form.name, symbol: form.symbol, ratioToPcs: form.ratioToPcs, description: form.description });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? "Ubah Satuan" : "Tambah Satuan"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Satuan</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Contoh: Kodi"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Simbol</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className={inputClass}
                placeholder="Contoh: kodi"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Isi Satuan (berapa Pcs)</label>
            <NumberInput
              value={form.ratioToPcs}
              onChange={(val) => setForm({ ...form, ratioToPcs: val || 1 })}
              className={inputClass}
              required
            />
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Angka ini dipakai menghitung HPP dan mengurangi stok. Kodi = 20, Lusin = 12, satuan lain = 1.
            </p>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Keterangan</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="Opsional"
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Aktif (muncul sebagai pilihan di form)
              </span>
            </label>
          )}

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
              {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Satuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
