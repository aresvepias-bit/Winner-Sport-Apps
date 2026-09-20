"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";

interface SupplierOption {
  id: string;
  name: string;
}

interface MaterialOption {
  id: string;
  name: string;
  standardCost: number;
}

interface CreatePurchaseOrderModalProps {
  suppliers: SupplierOption[];
  materials: MaterialOption[];
  onClose: () => void;
  onSubmit: (formData: {
    supplierId: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
    orderDate: string;
    notes: string;
  }) => Promise<void>;
}

export default function CreatePurchaseOrderModal({
  suppliers,
  materials,
  onClose,
  onSubmit
}: CreatePurchaseOrderModalProps) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [rawMaterialId, setRawMaterialId] = useState(materials[0]?.id || "");
  const [quantity, setQuantity] = useState(100);
  const [unitPrice, setUnitPrice] = useState(materials[0]?.standardCost || 85000);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ supplierId, rawMaterialId, quantity, unitPrice, orderDate, notes });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = quantity * unitPrice;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Buat Purchase Order (PO) Bahan Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pemesanan bahan baku kain ke supplier pabrik
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pilih Supplier Tekstil</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            >
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">CV Multi Tekstil Bandung</option>
                  <option value="2">PT Indo Knitting Cikarang</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pilih Bahan Baku Kain</label>
            <select
              value={rawMaterialId}
              onChange={(e) => {
                setRawMaterialId(e.target.value);
                const found = materials.find((m) => m.id === e.target.value);
                if (found) setUnitPrice(found.standardCost);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            >
              {materials && materials.length > 0 ? (
                materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Kain Dryfit Milano</option>
                  <option value="2">Kain Cotton Combed 30s Hitam</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Jumlah Pesanan (kg)</label>
              <NumberInput
                value={quantity}
                onChange={(val) => setQuantity(val || 1)}
                allowDecimals={true}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Beli per kg (Rp)</label>
              <NumberInput
                value={unitPrice}
                onChange={(val) => setUnitPrice(val || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tanggal Order</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#141b2d] rounded-xl flex justify-between items-center text-xs border border-slate-200 dark:border-[#1a2236]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Total Estimasi Pembelian:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? "Menerbitkan..." : "Terbitkan PO Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
