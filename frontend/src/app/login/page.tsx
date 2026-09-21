"use client";

import { useState } from "react";
import { Lock, Mail, ArrowRight, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      if (res && res.token) {
        localStorage.setItem("winner_token", res.token);
        localStorage.setItem("winner_user", JSON.stringify(res.user));
        window.location.href = "/";
      } else {
        throw new Error("Respon server tidak valid.");
      }
    } catch (err: any) {
      setError(
        err instanceof TypeError
          ? "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan."
          : err.message || "Login gagal."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-10 text-slate-900 dark:text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(185,28,28,0.38), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(51,65,85,0.55), transparent 55%), linear-gradient(135deg, #161322 0%, #0b1020 55%, #111827 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-1/4 -z-10 h-96 w-96 rotate-45 rounded-[64px] border border-white/[0.06] sm:-left-24" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-48 bottom-1/4 -z-10 h-96 w-96 rotate-45 rounded-[64px] border border-red-400/10 sm:-right-24" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/35 ring-1 ring-white/5 transition-colors sm:p-9 dark:border-white/10 dark:bg-[#0d1424]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-md shadow-red-600/15 dark:border-slate-700/60">
            <img src="/logo.png" alt="Logo Winner Sport" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-slate-900 dark:text-white">THE WINNER SPORT</h1>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-500">Operations Management System</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Masuk ke portal operasional terpadu manufaktur konveksi &amp; akuntansi.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} aria-busy={loading} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 text-sm font-medium placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-colors"
                placeholder="Masukkan email Anda"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Kata sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 text-sm font-medium placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm shadow-red-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
            {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <p className="relative z-10 mt-6 text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} Winner Sport. Seluruh hak cipta dilindungi.
      </p>
    </div>
  );
}
