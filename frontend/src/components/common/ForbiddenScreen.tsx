"use client";

import { ShieldAlert } from "lucide-react";

/** Ditampilkan bila role pengguna tidak punya satu pun halaman yang boleh dibuka. */
export default function ForbiddenScreen({ role }: { role?: string }) {
  const logout = () => {
    localStorage.removeItem("winner_token");
    localStorage.removeItem("winner_user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-8 text-center shadow-xl space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h1 className="text-base font-bold text-slate-900 dark:text-white">Akses ditolak</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Akun dengan peran <span className="font-bold">{role || "-"}</span> belum memiliki akses ke halaman mana pun.
          Hubungi pemilik sistem untuk mengatur hak akses.
        </p>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
