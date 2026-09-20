"use client";

import { Printer, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import CompanyContact from "@/components/print/CompanyContact";

interface PrintSpkModalProps {
  workOrder: {
    woNumber: string;
    product?: { name: string };
    targetQty: number;
    dueDate: string | Date;
    notes?: string;
    status: string;
  };
  onClose: () => void;
}

export default function PrintSpkModal({ workOrder, onClose }: PrintSpkModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const kodi = Math.floor(workOrder.targetQty / 20);
  const sisaPcs = workOrder.targetQty % 20;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border border-slate-200 print:border-none print:shadow-none print:w-full print:max-w-none print:p-4">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Pratinjau Cetak SPK Bengkel Konveksi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/25 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar SPK (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable SPK Content Area */}
        <div className="space-y-6 text-slate-900 font-sans">
          {/* Company Header */}
          <div className="flex justify-between items-start border-b-2 border-red-600 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center">
                <img src="/logo.png" alt="Winner Sport" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-red-600">THE WINNER SPORT</h1>
                <p className="text-xs font-bold text-slate-700">PABRIK &amp; KONVEKSI PAKAIAN OLAHRAGA</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Workshop Produksi &bull; Spesialis Jersey Custom, Kaos Distro, Kodian &amp; Seragam Olahraga
                </p>
                <CompanyContact />
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-red-50 border border-red-200 text-red-700 font-black text-xs font-mono">
                {workOrder.woNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Tgl Terbit: <span className="font-semibold text-slate-800">{formatDate(new Date())}</span>
              </p>
            </div>
          </div>

          {/* SPK Title Banner */}
          <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-200">
            <h2 className="text-base font-black tracking-wider uppercase text-slate-900">
              SURAT PERINTAH KERJA (SPK) PRODUKSI
            </h2>
            <p className="text-[11px] text-slate-600">
              Instruksi Kerja Pemotongan Kain (Cutting), Penjahitan (Sewing), &amp; Finishing
            </p>
          </div>

          {/* Key Job Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Produk Pakaian yang Dibuat:</span>
              <span className="font-bold text-slate-900 text-sm">{workOrder.product?.name || "Jersey Futsal Dryfit"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Target Jumlah Jadi:</span>
              <span className="font-black text-red-600 text-base">
                {workOrder.targetQty} Pcs
                {kodi > 0 && (
                  <span className="text-xs font-normal text-slate-600 ml-1.5">
                    ({kodi} Kodi {sisaPcs > 0 ? `+ ${sisaPcs} Pcs` : ""})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Batas Waktu Selesai (Due Date):</span>
              <span className="font-bold text-slate-900">{formatDate(workOrder.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status SPK Saat Ini:</span>
              <span className="font-bold text-red-600">{workOrder.status}</span>
            </div>
          </div>

          {/* BOM Material Estimation Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Kebutuhan &amp; Alokasi Bahan Baku (Resep BOM):
            </h3>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2 border-r border-slate-200">No.</th>
                  <th className="p-2 border-r border-slate-200">Komponen Bahan</th>
                  <th className="p-2 border-r border-slate-200">Takaran per Pcs</th>
                  <th className="p-2 border-r border-slate-200">Total Dibutuhkan</th>
                  <th className="p-2">Paraf Pengambil Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 border-r border-slate-200 font-mono">1</td>
                  <td className="p-2 border-r border-slate-200 font-medium">Kain Utama (Dryfit Milano / Combed 30s)</td>
                  <td className="p-2 border-r border-slate-200">0.25 kg (+3% waste)</td>
                  <td className="p-2 border-r border-slate-200 font-bold text-red-600">
                    {(workOrder.targetQty * 0.25 * 1.03).toFixed(2)} kg
                  </td>
                  <td className="p-2 text-slate-400 italic">Gudang Bahan Baku</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-200 font-mono">2</td>
                  <td className="p-2 border-r border-slate-200 font-medium">Benang Jahit &amp; Obras Warna Senada</td>
                  <td className="p-2 border-r border-slate-200">1 cone / 50 pcs</td>
                  <td className="p-2 border-r border-slate-200 font-bold text-red-600">
                    {Math.ceil(workOrder.targetQty / 50)} Cone
                  </td>
                  <td className="p-2 text-slate-400 italic">Gudang Aksesoris</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-200 font-mono">3</td>
                  <td className="p-2 border-r border-slate-200 font-medium">Label Woven Damask Winner Sport</td>
                  <td className="p-2 border-r border-slate-200">1 pcs</td>
                  <td className="p-2 border-r border-slate-200 font-bold text-red-600">{workOrder.targetQty} Pcs</td>
                  <td className="p-2 text-slate-400 italic">Gudang Aksesoris</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-200 font-mono">4</td>
                  <td className="p-2 border-r border-slate-200 font-medium">Plastik Packing OPP Tebal Sablon Logo</td>
                  <td className="p-2 border-r border-slate-200">1 pcs</td>
                  <td className="p-2 border-r border-slate-200 font-bold text-red-600">{workOrder.targetQty} Pcs</td>
                  <td className="p-2 text-slate-400 italic">Finishing / Packing</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {workOrder.notes && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block">Catatan Khusus Produksi:</span>
              <p className="text-amber-800 mt-0.5">{workOrder.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-12">Kepala Bagian Potong (Cutting)</p>
              <div className="border-t border-slate-300 w-36 mx-auto pt-1 font-bold text-slate-800">
                ( .................................... )
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Koordinator Jahit (Sewing)</p>
              <div className="border-t border-slate-300 w-36 mx-auto pt-1 font-bold text-slate-800">
                ( .................................... )
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Quality Control &amp; Finishing</p>
              <div className="border-t border-slate-300 w-36 mx-auto pt-1 font-bold text-slate-800">
                ( .................................... )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
