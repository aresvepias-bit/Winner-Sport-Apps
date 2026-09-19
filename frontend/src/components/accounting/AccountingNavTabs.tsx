"use client";

import { TrendingUp, Wallet, Receipt, Scissors } from "lucide-react";

export type AccountingTabType = "pnl" | "cash" | "expenses" | "payroll";

interface AccountingNavTabsProps {
  activeTab: AccountingTabType;
  onTabChange: (tab: AccountingTabType) => void;
}

const TABS: Array<{ key: AccountingTabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "pnl", label: "Laporan Laba Rugi (P&L)", icon: TrendingUp },
  { key: "cash", label: "Buku Kas & Bank", icon: Wallet },
  { key: "expenses", label: "Biaya Operasional (Expenses)", icon: Receipt },
  { key: "payroll", label: "Upah Penjahit Borongan", icon: Scissors },
];

export default function AccountingNavTabs({ activeTab, onTabChange }: AccountingNavTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-[#1a2236] pb-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              active
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "bg-white dark:bg-[#0d1424] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1a2236] border border-slate-200 dark:border-[#1a2236]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
