"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, Filter } from "lucide-react";
import { formatNumber, maskEmail } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

export interface LoginAuditEntry {
  id: string;
  email: string;
  success: boolean;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface LoginAuditSummary {
  total: number;
  berhasil: number;
  gagal: number;
  akunDicoba: number;
}

interface LoginAuditTableProps {
  entries: LoginAuditEntry[];
  summary?: LoginAuditSummary;
  retentionDays?: number;
  onlyFailed: boolean;
  onToggleFilter: (onlyFailed: boolean) => void;
}

const REASON_LABEL: Record<string, string> = {
  EMAIL_TIDAK_DIKENAL: "Email tidak dikenal",
  PASSWORD_SALAH: "Password salah",
  AKUN_NONAKTIF: "Akun nonaktif",
  TERKUNCI: "Ditolak karena terkunci"
};

/** Peramban disingkat agar kolom tidak melebar oleh user-agent yang panjang. */
function ringkasPerangkat(ua?: string | null): string {
  if (!ua) return "-";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/curl|PostmanRuntime|node/i.test(ua)) return "Skrip / alat";
  return "Lainnya";
}

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function LoginAuditTable({
  entries,
  summary,
  retentionDays,
  onlyFailed,
  onToggleFilter
}: LoginAuditTableProps) {
  const [revealed, setRevealed] = useState(false);
  const pg = usePagination(entries, 15, String(onlyFailed));

  const adaKecurigaan = (summary?.gagal ?? 0) > 10;

  return (
    <div className="space-y-4">
      {summary && (
        <div
          className={`rounded-2xl border p-5 ${
            adaKecurigaan
              ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
              : "bg-white dark:bg-[#0d1424] border-slate-200 dark:border-[#1a2236]"
          }`}
        >
          <div className="flex items-start gap-3">
            {adaKecurigaan ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">24 jam terakhir</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(summary.berhasil)}</span> berhasil
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                <span className={`font-bold ${summary.gagal > 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>
                  {formatNumber(summary.gagal)}
                </span>{" "}
                gagal
                {summary.gagal > 0 && <> pada {formatNumber(summary.akunDicoba)} alamat email</>}
              </p>
              {adaKecurigaan && (
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1.5">
                  Kegagalan cukup banyak. Periksa daftar di bawah; bila berasal dari satu IP asing, kemungkinan ada yang menebak password.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Riwayat Percobaan Login</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Password tidak pernah dicatat di sini
              {retentionDays ? `. Disimpan ${retentionDays} hari terakhir` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRevealed((v) => !v)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              {revealed ? "Samarkan email" : "Tampilkan email"}
            </button>
            <button
              onClick={() => onToggleFilter(!onlyFailed)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                onlyFailed
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "bg-slate-100 dark:bg-[#1a2236] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {onlyFailed ? "Hanya yang gagal" : "Semua percobaan"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Waktu</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Hasil</th>
                <th className="pb-3 font-semibold">Keterangan</th>
                <th className="pb-3 font-semibold">IP</th>
                <th className="pb-3 font-semibold">Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
              {entries.length > 0 ? (
                pg.pageItems.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{waktu(e.createdAt)}</td>
                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                      {revealed ? e.email : maskEmail(e.email)}
                    </td>
                    <td className="py-3">
                      {e.success ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
                          Berhasil
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-[10px]">
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {e.reason ? REASON_LABEL[e.reason] || e.reason : "-"}
                    </td>
                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{e.ip || "-"}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{ringkasPerangkat(e.userAgent)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Belum ada percobaan login tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination {...pg} />
      </div>
    </div>
  );
}
