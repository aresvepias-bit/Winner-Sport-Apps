"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export default function ExportButton({ onClick, label = "Ekspor CSV", disabled }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5 text-slate-500" />
      <span>{label}</span>
    </button>
  );
}
