"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";
import CreateContactModal from "@/components/master/CreateContactModal";

interface CustomerOption {
  id: string;
  name: string;
}

export interface SalesTypeOption {
  code: string;
  name: string;
}

export interface UnitOption {
  name: string;
  symbol: string;
  ratioToPcs?: number | string;
}

interface CreateOrderModalProps {
  customers: CustomerOption[];
  salesTypes: SalesTypeOption[];
  units: UnitOption[];
  onClose: () => void;
  /** Menyimpan pelanggan baru; mengembalikan datanya agar langsung terpilih. */
  onCreateCustomer: (data: Record<string, unknown>) => Promise<{ id: string; name: string } | null>;
  onSubmit: (newOrder: {
    customerId: string;
    orderType: string;
    quantity: number;
    unitName: string;
    pricePerUnit: number;
    notes: string;
  }) => Promise<void>;
}

const selectClass =
  "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-red-500";

export default function CreateOrderModal({
  customers,
  salesTypes,
  units,
  onClose,
  onCreateCustomer,
  onSubmit
}: CreateOrderModalProps) {
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    orderType: salesTypes[0]?.code || "",
    quantity: 5,
    unitName: units[0]?.symbol || "",
    pricePerUnit: 1200000,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const satuanTerpilih = units.find((u) => u.symbol === form.unitName);
  const isiPerSatuan = Number(satuanTerpilih?.ratioToPcs) || 1;
  const totalPcs = form.quantity * isiPerSatuan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (data: Record<string, unknown>) => {
    const created = await onCreateCustomer(data);
    if (created) {
      setForm((prev) => ({ ...prev, customerId: created.id }));
      setShowCustomerModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Input Order Penjualan Baru</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pelanggan</label>
              <div className="flex gap-2">
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className={selectClass}
                  required
                >
                  {customers.length === 0 && <option value="">Belum ada pelanggan</option>}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  title="Tambah pelanggan baru"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 cursor-pointer shadow-md shadow-blue-600/25 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Baru</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tipe Penjualan</label>
              <select
                value={form.orderType}
                onChange={(e) => setForm({ ...form, orderType: e.target.value })}
                className={selectClass}
                required
              >
                {salesTypes.length === 0 && <option value="">Belum ada tipe penjualan</option>}
                {salesTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Kuantitas</label>
                <NumberInput
                  value={form.quantity}
                  onChange={(val) => setForm({ ...form, quantity: val || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Satuan</label>
                <select
                  value={form.unitName}
                  onChange={(e) => setForm({ ...form, unitName: e.target.value })}
                  className={selectClass}
                  required
                >
                  {units.length === 0 && <option value="">Belum ada satuan</option>}
                  {units.map((u) => (
                    <option key={u.symbol} value={u.symbol}>
                      {u.name}
                      {Number(u.ratioToPcs) > 1 ? ` (${formatNumber(Number(u.ratioToPcs))} pcs)` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga per Satuan (Rp)</label>
              <NumberInput
                value={form.pricePerUnit}
                onChange={(val) => setForm({ ...form, pricePerUnit: val || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#141b2d] rounded-xl border border-slate-200 dark:border-[#1a2236] space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total Tagihan SO:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatRupiah(form.quantity * form.pricePerUnit)}
                </span>
              </div>
              {isiPerSatuan > 1 && (
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-[#1a2236]">
                  <span>Setara stok keluar:</span>
                  <span className="font-bold">{formatNumber(totalPcs)} pcs</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1a2236] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || !form.customerId || !form.orderType || !form.unitName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan & Terbitkan Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tambah pelanggan tanpa meninggalkan form order */}
      {showCustomerModal && (
        <CreateContactModal
          defaultType="CUSTOMER"
          onClose={() => setShowCustomerModal(false)}
          onSubmit={handleCreateCustomer}
        />
      )}
    </>
  );
}
