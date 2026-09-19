"use client";

import { useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface EditEmployeeModalProps {
  employee: {
    id: string;
    name: string;
    role: string;
    wageType: string;
    ratePerPcs?: number;
    baseSalary?: number;
    phone?: string;
    isActive?: boolean;
  };
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
}

export default function EditEmployeeModal({ employee, onClose, onSubmit }: EditEmployeeModalProps) {
  const [form, setForm] = useState({
    name: employee.name || "",
    role: employee.role || "Penjahit",
    wageType: employee.wageType || "BORONGAN",
    ratePerPcs: Number(employee.ratePerPcs) || 0,
    baseSalary: Number(employee.baseSalary) || 0,
    phone: employee.phone || "",
    isActive: employee.isActive ?? true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(employee.id, form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Data Tenaga Kerja / Karyawan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Tenaga Kerja</label>
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
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Divisi / Posisi</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="Penjahit (Sewing)">Penjahit (Sewing)</option>
                <option value="Operator Potong (Cutting)">Operator Potong (Cutting)</option>
                <option value="Tukang Sablon / Bordir">Tukang Sablon / Bordir</option>
                <option value="Finishing & Packing">Finishing &amp; Packing</option>
                <option value="Kepala Workshop / Mandor">Kepala Workshop / Mandor</option>
                <option value="Staff Gudang & Logistik">Staff Gudang &amp; Logistik</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Sistem Penggajian</label>
              <select
                value={form.wageType}
                onChange={(e) => setForm({ ...form, wageType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="BORONGAN">Borongan (per pcs baju)</option>
                <option value="BULANAN">Gaji Bulanan Tetap</option>
                <option value="HARIAN">Upah Harian</option>
              </select>
            </div>
          </div>

          {form.wageType === "BORONGAN" ? (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tarif Upah Borongan per Pcs (Rp)</label>
              <NumberInput
                value={form.ratePerPcs}
                onChange={(val) => setForm({ ...form, ratePerPcs: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nominal Gaji Pokok (Rp)</label>
              <NumberInput
                value={form.baseSalary}
                onChange={(val) => setForm({ ...form, baseSalary: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">No. Handphone / WhatsApp</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
