"use client";

import { useRef, useState } from "react";
import NumberInput from "@/components/common/NumberInput";

interface StockOpnameModalProps {
  materials: Array<{ id: string; name: string; currentStock: number; unit?: { symbol: string } }>;
  products: Array<{ id: string; name: string; currentStock: number }>;
  onClose: () => void;
  onSubmit: (data: {
    itemType: "MATERIAL" | "PRODUCT";
    itemId: string;
    systemQty: number;
    physicalQty: number;
    discrepancy: number;
    notes: string;
  }) => Promise<void>;
}

export default function StockOpnameModal({
  materials,
  products,
  onClose,
  onSubmit
}: StockOpnameModalProps) {
  const [itemType, setItemType] = useState<"MATERIAL" | "PRODUCT">("MATERIAL");
  const [selectedId, setSelectedId] = useState(
    itemType === "MATERIAL" ? materials[0]?.id || "" : products[0]?.id || ""
  );
  const [physicalQty, setPhysicalQty] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const pending = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const currentItem =
    itemType === "MATERIAL"
      ? materials.find((m) => m.id === selectedId) || materials[0]
      : products.find((p) => p.id === selectedId) || products[0];

  const systemQty = currentItem ? Number(currentItem.currentStock) : 0;
  const discrepancy = Number(physicalQty) - systemQty;
  const unitSymbol = itemType === "MATERIAL" ? materials.find((m) => m.id === selectedId)?.unit?.symbol || "satuan dasar" : "pcs";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current || !selectedId || physicalQty === "") return;
    pending.current = true;
    setSubmitting(true);
    try {
      await onSubmit({
        itemType,
        itemId: selectedId,
        systemQty,
        physicalQty,
        discrepancy,
        notes
      });
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sesi Stock Opname Fisik Gudang
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pencocokan stok fisik nyata dengan saldo buku sistem
            </p>
          </div>
          <button
            disabled={submitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tipe Item Gudang</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setItemType("MATERIAL");
                  setSelectedId(materials[0]?.id || ""); setPhysicalQty("");
                }}
                className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                  itemType === "MATERIAL"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 dark:bg-[#141b2d] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1a2236]"
                }`}
              >
                Bahan Baku Kain
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType("PRODUCT");
                  setSelectedId(products[0]?.id || ""); setPhysicalQty("");
                }}
                className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                  itemType === "PRODUCT"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 dark:bg-[#141b2d] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1a2236]"
                }`}
              >
                Produk Pakaian Jadi
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pilih Barang</label>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setPhysicalQty(""); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            >
              {itemType === "MATERIAL"
                ? materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok Buku: {m.currentStock} {m.unit?.symbol || "kg"})
                    </option>
                  ))
                : products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Buku: {p.currentStock} pcs)
                    </option>
                  ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#141b2d] rounded-xl border border-slate-200 dark:border-[#1a2236]">
              <span className="text-slate-500 block text-[11px]">Saldo Buku Sistem:</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {systemQty} {unitSymbol}
              </span>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Hitungan Fisik Nyata:
              </label>
              <NumberInput
                value={physicalQty}
                onChange={(val) => setPhysicalQty(val || 0)}
                allowDecimals={itemType === "MATERIAL"}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-blue-300 dark:border-blue-500/40 text-slate-900 dark:text-slate-100 font-black text-base focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Variance Display */}
          <div
            className={`p-3 rounded-xl border flex justify-between items-center ${
              discrepancy === 0
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : discrepancy < 0
                ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
            }`}
          >
            <span className="font-bold">Selisih Stok (Discrepancy):</span>
            <span className="font-black text-sm">
              {discrepancy > 0 ? `+${discrepancy}` : discrepancy}{" "}
              {unitSymbol}
            </span>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Alasan / Keterangan Selisih
            </label>
            <input
              type="text"
              placeholder="Contoh: Susut kain saat potong, rijek cacat jahit, hilang..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
            onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedId || physicalQty === ""}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Draft Opname"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
