"use client";

import { useState } from "react";
import type { SalesTypeItem } from "@/components/master/SalesTypesTable";

interface SalesTypeModalProps {
  salesType?: SalesTypeItem | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500";

export default function SalesTypeModal({ salesType, onClose, onSubmit }: SalesTypeModalProps) {
  const isEdit = Boolean(salesType);
  const [form, setForm] = useState({
    code: salesType?.code || "",
    name: salesType?.name || "",
    description: salesType?.description || "",
    sortOrder: salesType?.sortOrder ?? 0,
    isActive: salesType?.isActive !== false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Kode hanya dikirim saat membuat baru; order lama menyimpan kode ini.
      await onSubmit(
        isEdit
          ? { name: form.name, description: form.description, sortOrder: form.sortOrder, isActive: form.isActive }
          : { code: form.code, name: form.name, description: form.description, sortOrder: form.sortOrder }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? "Ubah Tipe Penjualan" : "Tambah Tipe Penjualan"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Kode</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={`${inputClass} font-mono ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="Contoh: EVENT_KOMUNITAS"
              disabled={isEdit}
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {isEdit
                ? "Kode tidak bisa diubah karena sudah tersimpan di order yang ada."
                : "Otomatis jadi HURUF BESAR tanpa spasi. Dipakai sebagai penanda di data order."}
            </p>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Tampilan</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Contoh: Paket Event & Komunitas"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Urutan Tampil</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className={inputClass}
                min={0}
              />
            </div>
            {isEdit && (
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Aktif</span>
                </label>
              </div>
            )}
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
              {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Tipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
