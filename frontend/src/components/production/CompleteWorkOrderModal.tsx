"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import NumberInput from "@/components/common/NumberInput";
import { WorkOrder } from "./WorkOrdersTable";

interface CompleteWorkOrderModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onSubmit: (formData: {
    completedQty: number;
    scrapQty: number;
    sewingCost: number;
    laborCost: number;
    overheadCost: number;
  }) => Promise<void>;
}

export default function CompleteWorkOrderModal({
  workOrder,
  onClose,
  onSubmit
}: CompleteWorkOrderModalProps) {
  const [completeForm, setCompleteForm] = useState({
    completedQty: workOrder.targetQty,
    scrapQty: 0,
    sewingCost: workOrder.targetQty * 6500,
    laborCost: 100000,
    overheadCost: 50000
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(completeForm);
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedTotalCost =
    Number(workOrder.materialCost || 0) +
    completeForm.sewingCost +
    completeForm.laborCost +
    completeForm.overheadCost;
  const estimatedHppPerPcs = Math.round(
    estimatedTotalCost / (completeForm.completedQty || 1)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2236] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Selesaikan SPK: {workOrder.woNumber}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {workOrder.product?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Hasil Jadi Grade A (Pcs)
              </label>
              <NumberInput
                value={completeForm.completedQty}
                onChange={(val) =>
                  setCompleteForm({
                    ...completeForm,
                    completedQty: val || 0
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Cacat / Rijek / Scrap (Pcs)
              </label>
              <NumberInput
                value={completeForm.scrapQty}
                onChange={(val) =>
                  setCompleteForm({
                    ...completeForm,
                    scrapQty: val || 0
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-rose-600 dark:text-rose-300 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-[#141b2d] p-4 rounded-xl border border-slate-200 dark:border-[#1a2236]">
            <span className="font-bold text-slate-800 dark:text-slate-300 block mb-2">
              Komponen Biaya Produksi (HPP):
            </span>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">1. Biaya Bahan Baku:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatRupiah(workOrder.materialCost)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">2. Biaya Jahit / Maklon:</span>
              <NumberInput
                value={completeForm.sewingCost}
                onChange={(val) =>
                  setCompleteForm({
                    ...completeForm,
                    sewingCost: val || 0
                  })
                }
                className="w-36 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] text-right text-slate-900 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">3. Upah Cutting / Finishing:</span>
              <NumberInput
                value={completeForm.laborCost}
                onChange={(val) =>
                  setCompleteForm({
                    ...completeForm,
                    laborCost: val || 0
                  })
                }
                className="w-36 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] text-right text-slate-900 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">4. Biaya Overhead (Listrik, dll):</span>
              <NumberInput
                value={completeForm.overheadCost}
                onChange={(val) =>
                  setCompleteForm({
                    ...completeForm,
                    overheadCost: val || 0
                  })
                }
                className="w-36 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] text-right text-slate-900 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#1a2236] flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900 dark:text-white">Estimasi HPP per Pcs:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatRupiah(estimatedHppPerPcs)}
              </span>
            </div>
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
              {submitting ? "Memproses..." : "Konfirmasi Selesai & Tambah Stok"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
