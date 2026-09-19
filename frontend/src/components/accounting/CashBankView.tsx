"use client";

import { Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface CashAccount {
  id: string;
  code: string;
  name: string;
  balance: number;
}

interface CashBankViewProps {
  cashAccounts: CashAccount[];
}

export default function CashBankView({ cashAccounts }: CashBankViewProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Rekening Kas &amp; Bank Konveksi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Saldo likuiditas tunai kas kecil dan rekening bank operasional
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cashAccounts && cashAccounts.length > 0 ? (
          cashAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236]"
            >
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">{acc.code}</span>
                <Wallet className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{acc.name}</h3>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatRupiah(acc.balance)}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center text-slate-400">
            Tidak ada data akun kas &amp; bank.
          </div>
        )}
      </div>
    </div>
  );
}
