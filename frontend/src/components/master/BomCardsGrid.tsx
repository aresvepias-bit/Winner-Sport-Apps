"use client";

interface BomItem {
  id: string;
  name: string;
  targetProduct?: string;
  product?: { name: string };
  version?: string;
  items?: Array<{
    materialName?: string;
    rawMaterial?: { name: string };
    quantity: number;
    unit?: string;
    wastePercentage?: number;
  }>;
}

import { Trash2 } from "lucide-react";

interface BomCardsGridProps {
  boms: BomItem[];
  onDelete?: (id: string, name: string) => void;
}

export default function BomCardsGrid({ boms, onDelete }: BomCardsGridProps) {
  // If no dynamic BOMs loaded yet, display the default standard konveksi BOM formulas
  const hasDynamicBoms = boms && boms.length > 0;

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Bill of Materials (BOM Resep Bahan)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Formula takaran bahan baku per 1 pcs baju konveksi untuk alokasi otomatis di SPK.
        </p>
      </div>

      {hasDynamicBoms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boms.map((bom) => (
            <div
              key={bom.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] relative group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{bom.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-[10px]">
                    {bom.version || "v1.0"}
                  </span>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(bom.id, bom.name)}
                      title="Hapus Formula BOM"
                      className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Target: {bom.product?.name || bom.targetProduct || "Produk Pakaian"}
              </p>
              <div className="mt-3 space-y-1 text-xs border-t border-slate-200 dark:border-[#1a2236] pt-2">
                {bom.items && bom.items.length > 0 ? (
                  bom.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{item.rawMaterial?.name || item.materialName}:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {item.quantity} {item.unit || "unit"}{" "}
                        {item.wastePercentage ? `(+${item.wastePercentage}% waste)` : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Belum ada rincian bahan.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Template 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">BOM Standar Jersey Futsal Dewasa</h3>
              <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-[10px]">
                Aktif v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: Jersey Futsal Winner Dryfit (Custom)</p>
            <div className="mt-3 space-y-1 text-xs border-t border-slate-200 dark:border-[#1a2236] pt-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Kain Dryfit Milano:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">0.25 kg / pcs (+3% waste)</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Label Woven Damask:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">1 pcs / pcs</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Plastik Packaging OPP:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">1 pcs / pcs</span>
              </div>
            </div>
          </div>

          {/* Default Template 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">BOM Standar Kaos Distro Combed 30s</h3>
              <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-[10px]">
                Aktif v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: Kaos Polos Cotton Combed 30s Hitam</p>
            <div className="mt-3 space-y-1 text-xs border-t border-slate-200 dark:border-[#1a2236] pt-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Kain Cotton Combed 30s:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">0.285 kg / pcs (+4% waste)</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Label Woven Damask:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">1 pcs / pcs</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Plastik Packaging OPP:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">1 pcs / pcs</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
