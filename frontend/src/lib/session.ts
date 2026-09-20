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
 * - role diverifikasi ke /auth/me (bukan hanya percaya localStorage) dan disimpan kembali
 * - halaman yang tidak diizinkan untuk role tsb -> dialihkan ke halaman pertama yang boleh
 * Backend tetap penentu akhir hak akses; guard ini hanya untuk UX.
 */
export function useAuthGuard(): { status: GuardStatus; role?: string } {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!localStorage.getItem("winner_token")) {
        window.location.href = "/login";
        return;
      }
      let user = getStoredUser();
      try {
        const me = await api.get("/auth/me");
        user = { ...user, id: me.id, name: me.name, email: me.email, role: me.role };
        localStorage.setItem("winner_user", JSON.stringify(user));
      } catch {
        // 401 sudah ditangani api.ts (logout). Gangguan jaringan: pakai data tersimpan.
      }
      if (cancelled) return;
      if (!user?.role) {
        window.location.href = "/login";
        return;
      }
      setRole(user.role);
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allowed = checked && canAccess(role, pathname);
  const home = checked ? homeFor(role) : null;

  useEffect(() => {
    if (checked && !allowed && home) router.replace(home);
  }, [checked, allowed, home, router]);

  if (!checked) return { status: "checking" };
  if (allowed) return { status: "ok", role };
  return { status: home ? "redirecting" : "forbidden", role };
}
