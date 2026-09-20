"use client";

import { useState } from "react";
import { ALL_ROLES, ROLE_LABELS, type AppUser } from "@/components/users/userRoles";

interface UserFormModalProps {
  /** Diisi saat mengubah akun; kosong berarti membuat akun baru. */
  user?: AppUser | null;
  /** OWNER boleh memberi peran OWNER; ADMIN tidak. */
  canAssignOwner: boolean;
  isSelf: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500";

export default function UserFormModal({ user, canAssignOwner, isSelf, onClose, onSubmit }: UserFormModalProps) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "ADMIN",
    phone: user?.phone || ""
  });
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = ALL_ROLES.filter((r) => r !== "OWNER" || canAssignOwner || user?.role === "OWNER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone
      };
      if (!isEdit) payload.password = form.password;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? "Ubah Akun Pengguna" : "Tambah Akun Pengguna"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Email (dipakai untuk login)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="nama@winnersport.com"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Password Awal</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Minimal 10 karakter, ada huruf dan angka"
                autoComplete="new-password"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">Sampaikan ke pengguna, lalu minta segera diganti.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Peran</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
                disabled={isSelf}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              {isSelf && <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Peran sendiri tidak bisa diubah.</p>}
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Telepon</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="08xxxxxxxxxx"
              />
            </div>
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
              {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
