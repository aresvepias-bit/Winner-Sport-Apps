"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    role: string;
    wageType: string;
    ratePerPcs: number;
    baseSalary: number;
    phone: string;
  }) => Promise<void>;
}

export default function CreateEmployeeModal({ onClose, onSubmit }: CreateEmployeeModalProps) {
  const [form, setForm] = useState({
    name: "",
    role: "Penjahit (Sewing)",
    wageType: "BORONGAN",
    ratePerPcs: 6500,
    baseSalary: 0,
    phone: ""
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Tenaga Kerja / Penjahit</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Tenaga Kerja</label>
            <input
              type="text"
              placeholder="Contoh: Pak Joko Santoso"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Divisi / Peran</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="Penjahit (Sewing)">Penjahit (Sewing)</option>
                <option value="Operator Potong (Cutting)">Operator Potong (Cutting)</option>
                <option value="Quality Control (QC)">Quality Control (QC)</option>
                <option value="Finishing & Packing">Finishing &amp; Packing</option>
                <option value="Staff Gudang">Staff Gudang</option>
                <option value="Staff Administrasi">Staff Administrasi</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Sistem Upah</label>
              <select
                value={form.wageType}
                onChange={(e) => setForm({ ...form, wageType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="BORONGAN">Borongan (Per Pcs Selesai)</option>
                <option value="BULANAN">Gaji Pokok Bulanan</option>
                <option value="HARIAN">Harian Lepas</option>
              </select>
            </div>
          </div>

          {form.wageType === "BORONGAN" ? (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tarif Borongan per Pcs (Rp)</label>
              <NumberInput
                value={form.ratePerPcs}
                onChange={(val) => setForm({ ...form, ratePerPcs: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Gaji Pokok Bulanan (Rp)</label>
              <NumberInput
                value={form.baseSalary}
                onChange={(val) => setForm({ ...form, baseSalary: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. Telepon / WhatsApp</label>
            <input
              type="text"
              placeholder="08xx-xxxx-xxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
            />
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
              {submitting ? "Menyimpan..." : "Simpan Karyawan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
