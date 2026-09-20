"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { canAccess, homeFor } from "@/lib/routeAccess";

export interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  /** Modul yang boleh diakses, dikirim server lewat /auth/me. */
  modules?: string[];
}

export function getStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("winner_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type GuardStatus = "checking" | "ok" | "redirecting" | "forbidden";

/**
 * Guard halaman dashboard:
 * - tanpa token -> /login
 * - role & daftar modul diambil dari /auth/me (bukan sekadar percaya localStorage),
 *   sehingga perubahan hak akses berlaku pada muat halaman berikutnya
 * - halaman yang tidak diizinkan -> dialihkan ke halaman pertama yang boleh
 * Backend tetap penentu akhir; guard ini hanya untuk UX.
 */
export function useAuthGuard(): { status: GuardStatus; role?: string; modules?: string[] } {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!localStorage.getItem("winner_token")) {
        window.location.href = "/login";
        return;
      }
      let current = getStoredUser();
      try {
        const me = await api.get("/auth/me");
        current = { id: me.id, name: me.name, email: me.email, role: me.role, modules: me.modules || [] };
        localStorage.setItem("winner_user", JSON.stringify(current));
      } catch {
        // 401 sudah ditangani api.ts (logout). Gangguan jaringan: pakai data tersimpan.
      }
      if (cancelled) return;
      if (!current?.role) {
        window.location.href = "/login";
        return;
      }
      setUser(current);
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = user?.modules;
  const allowed = checked && canAccess(modules, pathname);
  const home = checked ? homeFor(modules) : null;

  useEffect(() => {
    if (checked && !allowed && home) router.replace(home);
  }, [checked, allowed, home, router]);

  if (!checked) return { status: "checking" };
  if (allowed) return { status: "ok", role: user?.role, modules };
  return { status: home ? "redirecting" : "forbidden", role: user?.role, modules };
}
