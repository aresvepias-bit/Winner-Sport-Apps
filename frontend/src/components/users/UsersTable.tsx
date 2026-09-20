"use client";

import { Pencil, KeyRound, UserX, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";
import { ROLE_LABELS, ROLE_BADGE, type AppUser } from "@/components/users/userRoles";

interface UsersTableProps {
  users: AppUser[];
  currentUserId?: string;
  canManage: (user: AppUser) => boolean;
  onEdit: (user: AppUser) => void;
  onResetPassword: (user: AppUser) => void;
  onToggleActive: (user: AppUser) => void;
}

export default function UsersTable({
  users,
  currentUserId,
  canManage,
  onEdit,
  onResetPassword,
  onToggleActive
}: UsersTableProps) {
  const pg = usePagination(users, 10);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Akun Pengguna</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Akun nonaktif tidak bisa masuk, tetapi riwayat transaksinya tetap tersimpan
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Nama</th>
              <th className="pb-3 font-semibold">Email</th>
              <th className="pb-3 font-semibold">Peran</th>
              <th className="pb-3 font-semibold">Telepon</th>
              <th className="pb-3 font-semibold">Dibuat</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {users.length > 0 ? (
              pg.pageItems.map((u) => {
                const isSelf = u.id === currentUserId;
                const manageable = canManage(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-200">
                      {u.name}
                      {isSelf && <span className="ml-1.5 text-[10px] text-slate-400">(Anda)</span>}
                    </td>
                    <td className="py-3.5 font-mono text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${ROLE_BADGE[u.role] || ""}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{u.phone || "-"}</td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{u.createdAt ? formatDate(u.createdAt) : "-"}</td>
                    <td className="py-3.5">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 font-bold text-[10px]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      {manageable ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(u)}
                            title="Ubah data akun"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 border border-blue-200 dark:border-blue-500/20 cursor-pointer transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onResetPassword(u)}
                            title="Ganti password akun ini"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2236] dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleActive(u)}
                            disabled={isSelf}
                            title={isSelf ? "Tidak bisa menonaktifkan akun sendiri" : u.isActive ? "Nonaktifkan akun" : "Aktifkan kembali"}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-200 dark:border-rose-500/20 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Hanya OWNER</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  Belum ada akun pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination {...pg} />
    </div>
  );
}
