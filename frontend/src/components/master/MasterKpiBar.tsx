"use client";

import { Package, Shirt, Users, Layers, AlertTriangle } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import type { MasterEntity } from "./masterEntities";

interface MasterKpiBarProps {
  activeTab: MasterEntity;
  materials: any[];
  products: any[];
  boms: any[];
  contacts: any[];
  employees: any[];
}

export default function MasterKpiBar({
  activeTab,
  materials,
  products,
  boms,
  contacts,
  employees
}: MasterKpiBarProps) {
  if (activeTab === "materials") {
    const totalItems = materials.length;
    const totalValuation = materials.reduce(
      (sum, m) => sum + (Number(m.currentStock) * Number(m.standardCost) || 0),
      0
    );
    const lowStockCount = materials.filter(
      (m) => Number(m.currentStock) <= Number(m.minimumStock)
    ).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Item Bahan</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalItems} SKU</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Persediaan Kain</span>
          <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{formatRupiah(totalValuation)}</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stok Kritis / Restock</span>
          <p className={`text-xl font-black mt-1 ${lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {lowStockCount} SKU {lowStockCount > 0 ? "Perlu PO" : "Aman"}
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === "products") {
    const totalProducts = products.length;
    const totalReadyStock = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);
    const totalProductValuation = products.reduce(
      (sum, p) => sum + (Number(p.currentStock) * Number(p.standardCost) || 0),
      0
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Koleksi Model Pakaian</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalProducts} Model</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stok Siap Kirim</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatNumber(totalReadyStock)} Pcs</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimasi Nilai Aset Jadi</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{formatRupiah(totalProductValuation)}</p>
        </div>
      </div>
    );
  }

  if (activeTab === "contacts") {
    const customers = contacts.filter((c) => c.type === "CUSTOMER").length;
    const suppliers = contacts.filter((c) => c.type === "SUPPLIER").length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rekanan Terdaftar</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{contacts.length} Mitra</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pelanggan Grosir / Retail</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{customers} Pelanggan</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pemasok Kain &amp; Aksesoris</span>
          <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{suppliers} Supplier</p>
        </div>
      </div>
    );
  }

  if (activeTab === "employees") {
    const borongan = employees.filter((e) => e.wageType === "BORONGAN").length;
    const bulanan = employees.filter((e) => e.wageType === "BULANAN").length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tim Produksi</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{employees.length} Orang</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Penjahit Sistem Borongan</span>
          <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{borongan} Penjahit</p>
        </div>
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Karyawan Bulanan Tetap</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{bulanan} Staff</p>
        </div>
      </div>
    );
  }

  return null;
}
