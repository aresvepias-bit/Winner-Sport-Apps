"use client";

import { RefreshCw, UserPlus } from "lucide-react";

interface UsersHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onCreate?: () => void;
}

export default function UsersHeader({ loading, onRefresh, onCreate }: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Pengguna &amp; Hak Akses</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola akun yang bisa masuk ke sistem beserta izin tiap peran
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </button>

        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Akun</span>
          </button>
        )}
      </div>
    </div>
  );
}
