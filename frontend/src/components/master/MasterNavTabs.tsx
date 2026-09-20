"use client";

import { Package, Layers, Scissors, Users , Ruler, Tags} from "lucide-react";

export type MasterTabType = "materials" | "products" | "boms" | "contacts" | "employees" | "units" | "salesTypes";

interface MasterNavTabsProps {
  activeTab: MasterTabType;
  onTabChange: (tab: MasterTabType) => void;
}

const TABS: Array<{ key: MasterTabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "materials", label: "Bahan Baku (Kain & Aksesoris)", icon: Package },
  { key: "products", label: "Produk Jadi (Pakaian)", icon: Layers },
  { key: "boms", label: "BOM (Formula Resep)", icon: Scissors },
  { key: "contacts", label: "Supplier & Customer", icon: Users },
  { key: "employees", label: "Penjahit & Karyawan", icon: Users },
  { key: "units", label: "Satuan", icon: Ruler },
  { key: "salesTypes", label: "Tipe Penjualan", icon: Tags },
];

export default function MasterNavTabs({ activeTab, onTabChange }: MasterNavTabsProps) {
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
