"use client";

import { Printer, X } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface PrintPayrollSlipModalProps {
  tailor: {
    name: string;
    role: string;
    completedPcs: number;
    ratePerPcs: number;
    totalWage: number;
    spkCount: number;
    period: string;
  };
  onClose: () => void;
}

export default function PrintPayrollSlipModal({ tailor, onClose }: PrintPayrollSlipModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative border border-slate-200 print:border-none print:shadow-none print:w-full print:max-w-none print:p-4">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Pratinjau Slip Upah Penjahit
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/25 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="space-y-4 text-slate-900 font-sans text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-red-600 pb-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Winner Sport" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-base font-black text-red-600">THE WINNER SPORT</h1>
                <p className="text-[10px] text-slate-500">Bukti Pembayaran Upah Tenaga Kerja Borongan</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                LUNAS
              </span>
            </div>
          </div>

          <div className="text-center py-1 bg-slate-100 rounded font-bold uppercase text-[11px] text-slate-800">
            SLIP UPAH JAHIT BORONGAN &bull; PERIODE: {tailor.period || "Bulan Berjalan 2026"}
          </div>

          {/* Details */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Penjahit:</span>
              <span className="font-bold text-slate-900">{tailor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Divisi / Peran:</span>
              <span className="font-medium text-slate-800">{tailor.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah SPK Selesai:</span>
              <span className="font-semibold text-slate-800">{tailor.spkCount} Surat Perintah Kerja</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Baju Dijahit:</span>
              <span className="font-bold text-slate-900">{tailor.completedPcs} Pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tarif Borongan:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(tailor.ratePerPcs)} / pcs</span>
            </div>
          </div>

          {/* Total Pay */}
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex justify-between items-center text-sm font-black text-red-700">
            <span>TOTAL UPAH DITERIMA:</span>
            <span>{formatRupiah(tailor.totalWage)}</span>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-[11px]">
            <div>
              <p className="text-slate-500 mb-10">Penerima (Penjahit)</p>
              <p className="font-bold border-t border-slate-300 pt-1 text-slate-800">{tailor.name}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-10">Bendahara / Kasir</p>
              <p className="font-bold border-t border-slate-300 pt-1 text-slate-800">Winner Sport Finance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
