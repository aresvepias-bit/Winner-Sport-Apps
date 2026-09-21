"use client";

import { useState } from "react";
import { Package, Layers, ArrowDownUp, ClipboardCheck, Search, ChevronDown, ChevronRight, Settings2, X } from "lucide-react";

export type InventoryTabType = "materials" | "products" | "movements" | "opname";

const GROUPS = ["Persediaan", "Kontrol Stok"];
export const INVENTORY_MENUS = [
  { key: "materials", label: "Stok Bahan Baku", description: "Pantau stok kain, benang, dan aksesoris sesuai satuannya.", keywords: "kg meter bahan mentah restock", group: GROUPS[0], icon: Package },
  { key: "products", label: "Stok Produk Jadi", description: "Persediaan pakaian siap jual dalam pcs dan kodi.", keywords: "pakaian gudang jadi konversi", group: GROUPS[0], icon: Layers },
  { key: "movements", label: "Kartu Stok & Mutasi", description: "Telusuri pergerakan stok masuk, keluar, dan penyesuaian.", keywords: "riwayat log dokumen spk", group: GROUPS[1], icon: ArrowDownUp },
  { key: "opname", label: "Stock Opname", description: "Cocokkan jumlah fisik di gudang dengan stok sistem.", keywords: "fisik audit hitung selisih", group: GROUPS[1], icon: ClipboardCheck },
] satisfies Array<{ key: InventoryTabType; label: string; description: string; keywords: string; group: string; icon: typeof Package }>;

interface InventoryNavTabsProps {
  activeTab: InventoryTabType;
  onTabChange: (tab: InventoryTabType) => void;
}

export default function InventoryNavTabs({ activeTab, onTabChange }: InventoryNavTabsProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const activeMenu = INVENTORY_MENUS.find((menu) => menu.key === activeTab)!;
  const query = search.trim().toLocaleLowerCase("id");
  const filtered = INVENTORY_MENUS.filter((menu) => `${menu.label} ${menu.description} ${menu.keywords} ${menu.group}`.toLocaleLowerCase("id").includes(query));

  return (
    <nav aria-label="Menu gudang dan persediaan" className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] xl:sticky xl:top-20">
      <div className="hidden items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1a2236] xl:flex">
        <Settings2 className="h-4 w-4 text-red-600 dark:text-red-400" />
        <h2 className="text-sm font-bold">Menu Gudang</h2>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{INVENTORY_MENUS.length}</span>
      </div>
      <button type="button" aria-expanded={expanded} aria-controls="inventory-menu-list" onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-2 focus-visible:outline-red-500 xl:hidden">
        <Settings2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        <span className="flex-1"><span className="block text-xs text-slate-500 dark:text-slate-400">Pilih menu gudang</span><span className="text-sm font-bold">{activeMenu.label}</span></span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <div id="inventory-menu-list" className={`${expanded ? "block" : "hidden"} xl:block`}>
        <div className="px-3 pt-3">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input aria-label="Cari menu gudang" placeholder="Cari menu gudang..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-slate-700 dark:bg-[#090e1a]" />
            {search && <button type="button" aria-label="Hapus pencarian menu" onClick={() => setSearch("")} className="absolute right-1 top-1 rounded-lg p-2 text-slate-500 hover:text-red-600"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="max-h-[min(60vh,36rem)] space-y-5 overflow-y-auto p-3 xl:max-h-[calc(100dvh-16rem)]">
          {GROUPS.map((group) => {
            const menus = filtered.filter((menu) => menu.group === group);
            if (!menus.length) return null;
            return <div key={group}>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{group}</p>
              <div className="space-y-1">
                {menus.map((menu) => {
                  const active = activeTab === menu.key;
                  const Icon = menu.icon;
                  return <button type="button" key={menu.key} aria-current={active ? "page" : undefined} onClick={() => { onTabChange(menu.key); setExpanded(false); setSearch(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-red-500 ${active ? "bg-red-50 font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400" : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}>
                    <Icon className="h-4 w-4 shrink-0" /><span className="flex-1">{menu.label}</span>{active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  </button>;
                })}
              </div>
            </div>;
          })}
          {!filtered.length && <div role="status" className="px-2 py-6 text-center"><p className="text-sm font-semibold">Menu tidak ditemukan</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Coba kata lain, seperti bahan atau mutasi.</p><button type="button" onClick={() => setSearch("")} className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">Tampilkan semua menu</button></div>}
        </div>
        <p className="hidden border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-500 dark:border-[#1a2236] dark:text-slate-400 xl:block">Pilih kategori atau cari menu untuk memantau persediaan gudang.</p>
      </div>
    </nav>
  );
}
