"use client";

import { Users, ShieldCheck, History } from "lucide-react";
import { cn } from "@/lib/utils";

export type UsersTabType = "accounts" | "permissions" | "audit";

const TABS: Array<{ key: UsersTabType; label: string; icon: typeof Users }> = [
  { key: "accounts", label: "Akun Pengguna", icon: Users },
  { key: "permissions", label: "Matriks Hak Akses", icon: ShieldCheck },
  { key: "audit", label: "Riwayat Login", icon: History }
];

interface UsersNavTabsProps {
  activeTab: UsersTabType;
  onTabChange: (tab: UsersTabType) => void;
}

export default function UsersNavTabs({ activeTab, onTabChange }: UsersNavTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1a2236] pb-px overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap border border-b-0",
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
