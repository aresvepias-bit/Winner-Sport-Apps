"use client";

import { useState, useEffect } from "react";
import { Save, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/components/users/userRoles";

export interface PermissionData {
  matrix: Record<string, { label: string; roles: Record<string, boolean> }>;
  roles: string[];
  modules: string[];
}

interface PermissionMatrixProps {
  data: PermissionData;
  /** Peran pengguna saat ini; ADMIN tidak boleh mencabut hak perannya sendiri. */
  currentRole?: string;
  onSave: (changes: Array<{ role: string; module: string; allowed: boolean }>) => Promise<void>;
}

export default function PermissionMatrix({ data, currentRole, onSave }: PermissionMatrixProps) {
  const [draft, setDraft] = useState(data.matrix);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(data.matrix), [data.matrix]);

  const isOwner = currentRole === "OWNER";

  const changes = data.modules.flatMap((mod) =>
    data.roles
      .filter((role) => draft[mod]?.roles[role] !== data.matrix[mod]?.roles[role])
      .map((role) => ({ role, module: mod, allowed: draft[mod].roles[role] }))
  );

  const toggle = (mod: string, role: string) => {
    setDraft((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], roles: { ...prev[mod].roles, [role]: !prev[mod].roles[role] } }
    }));
  };

  /** ADMIN tidak boleh mencabut izin perannya sendiri (backend juga menolak). */
  const isLocked = (role: string, mod: string) => !isOwner && role === currentRole && draft[mod]?.roles[role];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(changes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Matriks Hak Akses per Peran</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centang modul yang boleh diakses tiap peran. Perubahan langsung berlaku tanpa restart server.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || changes.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Menyimpan..." : changes.length > 0 ? `Simpan ${changes.length} Perubahan` : "Tidak Ada Perubahan"}</span>
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-[11px] text-slate-500 dark:text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
        <p>
          <span className="font-bold text-slate-700 dark:text-slate-300">Owner</span> selalu punya akses penuh dan tidak
          bisa dibatasi, supaya sistem tidak terkunci. Menu <span className="font-bold">Pengguna &amp; Hak Akses</span> ini
          sendiri juga tetap hanya untuk Owner dan Admin.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Modul</th>
              <th className="pb-3 font-semibold text-center">
                <span className="text-red-600 dark:text-red-400">Owner</span>
              </th>
              {data.roles.map((role) => (
                <th key={role} className="pb-3 font-semibold text-center whitespace-nowrap">
                  {ROLE_LABELS[role]?.replace(" (akses penuh)", "") || role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {data.modules.map((mod) => (
              <tr key={mod} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 font-semibold text-slate-900 dark:text-slate-200">{draft[mod]?.label || mod}</td>
                <td className="py-3 text-center">
                  <ShieldCheck className="w-4 h-4 text-red-500 mx-auto" aria-label="Selalu boleh" />
                </td>
                {data.roles.map((role) => {
                  const checked = Boolean(draft[mod]?.roles[role]);
                  const locked = isLocked(role, mod);
                  const berubah = checked !== data.matrix[mod]?.roles[role];
                  return (
                    <td key={role} className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggle(mod, role)}
                        title={locked ? "Anda tidak bisa mencabut hak akses peran Anda sendiri" : undefined}
                        className={cn(
                          "w-4 h-4 rounded cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40",
                          berubah && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-[#0d1424]"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
