"use client";

/**
 * Ilustrasi latar bertema konveksi modern: gulungan kain, mesin jahit industri,
 * jersey, benang, dan gunting. Digambar sebagai SVG (bukan berkas gambar) supaya
 * tetap tajam, ikut warna tema, dan tidak menambah unduhan.
 * Sisi kiri dibuat memudar lewat mask agar tidak mengganggu keterbacaan teks.
 */
function KonveksiBackdrop() {
  return (
    <svg
      viewBox="0 0 560 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-full w-auto text-red-600 dark:text-red-500 opacity-[0.12] dark:opacity-[0.13] hidden sm:block"
    >
      <defs>
        <linearGradient id="ws-konveksi-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="ws-konveksi-mask">
          <rect width="560" height="160" fill="url(#ws-konveksi-fade)" />
        </mask>
      </defs>

      <g mask="url(#ws-konveksi-mask)">
        {/* Jahitan putus-putus atas & bawah */}
        <path d="M0 22H560" strokeDasharray="10 9" />
        <path d="M0 142H560" strokeDasharray="10 9" />

        {/* Gulungan kain */}
        <ellipse cx="42" cy="80" rx="9" ry="24" />
        <path d="M42 56H108M42 104H108" />
        <path d="M108 56a9 24 0 0 1 0 48" />
        <path d="M64 58v44M84 58v44" strokeOpacity="0.55" />

        {/* Mesin jahit industri */}
        <rect x="146" y="100" width="148" height="22" rx="7" />
        <path d="M262 100V58a9 9 0 0 1 9-9h14a9 9 0 0 1 9 9v42" />
        <path d="M262 53H176a9 9 0 0 0-9 9v8" />
        <rect x="158" y="68" width="18" height="15" rx="4" />
        <path d="M167 83v17" />
        <circle cx="278" cy="76" r="11" />
        <path d="M240 49V38" strokeOpacity="0.7" />
        <rect x="233" y="26" width="14" height="12" rx="3" strokeOpacity="0.7" />

        {/* Jersey / kaos */}
        <path d="M330 62l19-11h34l19 11-11 19-8-5v46a6 6 0 0 1-6 6h-22a6 6 0 0 1-6-6V76l-8 5z" />
        <path d="M349 51a17 11 0 0 0 34 0" />
        <path d="M357 96h18" strokeOpacity="0.55" />

        {/* Gulungan benang */}
        <ellipse cx="440" cy="62" rx="16" ry="5" />
        <path d="M424 62v42M456 62v42" />
        <ellipse cx="440" cy="104" rx="16" ry="5" />
        <path d="M428 74h24M428 84h24" strokeOpacity="0.55" />

        {/* Gunting */}
        <path d="M500 56l34 44M534 56l-34 44" />
        <circle cx="517" cy="78" r="2.5" />
        <circle cx="497" cy="108" r="7" />
        <circle cx="537" cy="108" r="7" />
      </g>
    </svg>
  );
}

export default function DashboardHeader() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-6 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <KonveksiBackdrop />

      <div className="relative">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Executive Operational Cockpit
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dashboard Operasional Konveksi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kendali operasional produksi, stok, dan keuangan konveksi.
        </p>
      </div>
    </div>
  );
}
