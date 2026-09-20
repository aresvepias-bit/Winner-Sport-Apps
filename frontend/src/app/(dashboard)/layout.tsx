"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { Menu, Eye, EyeOff, Calendar, Clock, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidePrices, setHidePrices] = useState(false);
  const [theme, setTheme] = useState("light");
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [authed, setAuthed] = useState(false);

  // Route guard: tanpa token, kembali ke halaman login.
  useEffect(() => {
    if (!localStorage.getItem("winner_token")) {
      window.location.href = "/login";
    } else {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    // Read theme state
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    // Read hide-prices
    setHidePrices(localStorage.getItem("hide-prices") === "true");

    // Live clock update (Format khas GLC Apps)
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDateString(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  const toggleHidePrices = () => {
    const nextVal = !hidePrices;
    setHidePrices(nextVal);
    localStorage.setItem("hide-prices", String(nextVal));
    window.dispatchEvent(new Event("storage"));
  };

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Desktop & Mobile */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        mobileOpen={mobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-20"
        )}
      >
        {/* Top Navbar GLC Style with Light/Dark & Red-White Accents */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0d1424]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1a2236] px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Clock & Date Badge */}
            <div className="hidden sm:flex items-center gap-3 text-xs border border-slate-200 dark:border-[#1a2236] bg-slate-100/80 dark:bg-[#090e1a] px-3.5 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                <span className="font-medium">{dateString || "Memuat tanggal..."}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                <span>{timeString} WIB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1a2236] bg-white dark:bg-[#141b2d] text-slate-600 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-600 transition-all cursor-pointer shadow-xs"
              title={theme === "dark" ? "Ganti ke Mode Terang (Light)" : "Ganti ke Mode Gelap (Dark)"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Hide Prices Toggle */}
            <button
              type="button"
              onClick={toggleHidePrices}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs",
                hidePrices
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-[#1a2236] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title={hidePrices ? "Tampilkan Angka" : "Sembunyikan Angka"}
            >
              {hidePrices ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{hidePrices ? "Nominal Disensor" : "Sensor Nominal"}</span>
            </button>

            {/* Scope / Brand Badge Merah Putih */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#090e1a] border border-red-200 dark:border-[#1a2236] rounded-xl text-slate-800 dark:text-slate-200 text-xs font-medium shadow-xs">
              <div className="w-5 h-5 bg-white p-0.5 rounded-md flex items-center justify-center border border-red-100 shadow-2xs">
                <img src="/logo-emblem.png" alt="Winner Sport Emblem" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-wide">The Winner Sport Hub</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
