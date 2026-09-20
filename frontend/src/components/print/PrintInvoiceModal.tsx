"use client";

import { Printer, X } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import CompanyContact from "@/components/print/CompanyContact";

interface PrintInvoiceModalProps {
  order: {
    soNumber: string;
    customer?: { name: string; phone?: string; address?: string };
    orderType: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
    status: string;
    createdAt: string | Date;
    items?: Array<{
      customDescription?: string;
      product?: { name: string };
      quantity: number;
      pricePerUnit: number;
      unitName?: string;
    }>;
  };
  onClose: () => void;
}

export default function PrintInvoiceModal({ order, onClose }: PrintInvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const remainingBalance = Math.max(0, order.totalAmount - order.paidAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border border-slate-200 print:border-none print:shadow-none print:w-full print:max-w-none print:p-4">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Pratinjau Cetak Faktur Invoice &amp; Surat Jalan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/25 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Faktur (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="space-y-6 text-slate-900 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-red-600 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center">
                <img src="/logo.png" alt="Winner Sport" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-red-600">THE WINNER SPORT</h1>
                <p className="text-xs font-bold text-slate-700">KONVEKSI &amp; DISTRIBUSI PAKAIAN OLAHRAGA</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Spesialis Jersey Printing, Kodian, Grosir, Celana Training &amp; Kaos Distro
                </p>
                <CompanyContact />
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-base font-black text-slate-900 uppercase">FAKTUR PENJUALAN</h2>
              <p className="text-xs font-mono font-bold text-red-600 mt-0.5">{order.soNumber}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tanggal: <span className="font-semibold text-slate-800">{formatDate(order.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Customer & Order Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Ditujukan Kepada:
              </span>
              <p className="font-bold text-slate-900 text-sm">{order.customer?.name || "Pelanggan Umum"}</p>
              <p className="text-slate-600 mt-0.5">{order.customer?.address || "Alamat Kirim Sesuai Pesanan"}</p>
              <p className="text-slate-600">{order.customer?.phone ? `Telp: ${order.customer.phone}` : ""}</p>
            </div>
            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-500">Tipe Pesanan: </span>
                <span className="font-bold text-slate-800">{order.orderType}</span>
              </div>
              <div>
                <span className="text-slate-500">Status Pembayaran: </span>
                <span className={`font-bold ${order.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Status Pengiriman: </span>
                <span className="font-bold text-slate-800">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5 border-r border-slate-200">No.</th>
                <th className="p-2.5 border-r border-slate-200">Deskripsi Barang / Produk Pakaian</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Qty</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Harga Satuan</th>
                <th className="p-2.5 text-right">Total Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 font-medium">
                      {item.customDescription || item.product?.name || "Pesanan Pakaian Olahraga"}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">
                      {item.quantity} {item.unitName || "pcs"}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-right">
                      {formatRupiah(item.pricePerUnit)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(item.quantity * item.pricePerUnit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-center">1</td>
                  <td className="p-2.5 border-r border-slate-200 font-medium">Pesanan Pakaian Olahraga (Kodian / Custom)</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold">1 Lot</td>
                  <td className="p-2.5 border-r border-slate-200 text-right">{formatRupiah(order.totalAmount)}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(order.totalAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Payment Summary & Bank Details */}
          <div className="grid grid-cols-2 gap-4 items-start pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-800 block mb-1">Informasi Rekening Pembayaran:</span>
              <p className="text-slate-600">Bank: <span className="font-bold text-slate-900">BCA (Bank Central Asia)</span></p>
              <p className="text-slate-600">No. Rekening: <span className="font-bold font-mono text-slate-900">882-019-3829</span></p>
              <p className="text-slate-600">Atas Nama: <span className="font-bold text-slate-900">WINNER SPORT INDONESIA</span></p>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Total Nilai Tagihan:</span>
                <span className="font-bold text-slate-900">{formatRupiah(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                <span>Sudah Dibayar (DP / Lunas):</span>
                <span className="font-bold">- {formatRupiah(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-black text-sm bg-red-50 px-2 rounded text-red-700">
                <span>SISA TAGIHAN:</span>
                <span>{formatRupiah(remainingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-12">Penerima Barang / Customer</p>
              <div className="border-t border-slate-300 w-44 mx-auto pt-1 font-bold text-slate-800">
                ( .................................... )
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Hormat Kami, THE WINNER SPORT</p>
              <div className="border-t border-slate-300 w-44 mx-auto pt-1 font-bold text-slate-800">
                ( Staff Administrasi )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
