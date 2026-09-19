"use client";

import { Package, ArrowDownUp, ClipboardCheck } from "lucide-react";

export type InventoryTabType = "materials" | "products" | "movements" | "opname";

interface InventoryNavTabsProps {
  activeTab: InventoryTabType;
  onTabChange: (tab: InventoryTabType) => void;
}

const TABS: Array<{ key: InventoryTabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "materials", label: "Stok Bahan Baku (Kain & Benang)", icon: Package },
  { key: "products", label: "Stok Pakaian Jadi (Gudang Jadi)", icon: Package },
  { key: "movements", label: "Kartu Stok & Mutasi", icon: ArrowDownUp },
  { key: "opname", label: "Stock Opname Fisik", icon: ClipboardCheck },
];

export default function InventoryNavTabs({ activeTab, onTabChange }: InventoryNavTabsProps) {
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
