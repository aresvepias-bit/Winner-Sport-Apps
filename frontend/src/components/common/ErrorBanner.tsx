"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { banner } from "@/lib/motion";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/** Ditampilkan saat data gagal dimuat, agar tidak terlihat seperti "data kosong". */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="galat"
          variants={banner}
          initial="awal"
          animate="masuk"
          exit="keluar"
          className="flex items-center justify-between gap-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl px-5 py-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <span className="font-bold">Gagal memuat data.</span> {message}
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 font-bold hover:underline shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
