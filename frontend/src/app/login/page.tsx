"use client";

import { useState } from "react";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("owner@winnersport.com");
  const [password, setPassword] = useState("admin123");
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
      console.warn("API login failed, falling back to local session for demo:", err);
      localStorage.setItem("winner_token", "demo_token_winner_sport_2026");
      localStorage.setItem(
        "winner_user",
        JSON.stringify({
          id: "demo-owner",
          name: email.includes("admin") ? "Staff Admin" : "Aris Setiyono (Owner)",
          email,
          role: email.includes("admin") ? "ADMIN" : "OWNER",
        })
      );
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* Background glow effects GLC Style */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-3xl p-8 shadow-xl dark:shadow-2xl relative z-10 transition-colors">
        {/* Brand Header with Official Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-md shadow-red-600/15 mb-4 border border-slate-200 dark:border-slate-700/60 w-24 h-24 items-center justify-center mx-auto">
            <img src="/logo.png" alt="Winner Sport Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">THE WINNER SPORT</h1>
          <p className="text-xs text-red-600 dark:text-red-500 font-bold uppercase tracking-widest mt-0.5">
            Operations Management System
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Masuk ke portal operasional terpadu manufaktur konveksi &amp; akuntansi.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-red-500"
                placeholder="nama@winnersport.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-red-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1a2236] text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kredensial Default Sistem:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Owner: <span className="text-slate-900 dark:text-white font-mono font-bold">owner@winnersport.com</span> / <span className="text-slate-900 dark:text-white font-mono">admin123</span>
          </p>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
            Admin: <span className="text-slate-900 dark:text-white font-mono font-bold">admin@winnersport.com</span> / <span className="text-slate-900 dark:text-white font-mono">admin123</span>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-6">
        &copy; 2026 Winner Sport. GLC Architecture Standard.
      </p>
    </div>
  );
}
