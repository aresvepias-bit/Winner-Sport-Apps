"use client";

import { Printer, X } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { COMPANY } from "@/lib/companyInfo";
import CompanyContact from "@/components/print/CompanyContact";
import type { LabaRugiResponse } from "./ProfitLossReport";
import type { ArusKasResponse } from "./CashFlowReport";
import type { TitikPeriode } from "./ReportTrendChart";

/**
 * Lembar laporan keuangan siap cetak. Menyimpan sebagai PDF memakai dialog cetak
 * peramban ("Simpan sebagai PDF"), sama seperti invoice dan SPK, sehingga tidak
 * ada pustaka PDF tambahan yang perlu diikutkan ke bundel.
 */

interface Props {
  labelPeriode: string;
  pnl: LabaRugiResponse | null;
  arusKas: ArusKasResponse | null;
  series: TitikPeriode[];
  modeSeries: "bulan" | "kuartal";
  tahun: number;
  onClose: () => void;
}

const Baris = ({
  label,
  nilai,
  tebal = false,
  indent = false
}: {
  label: string;
  nilai: number;
  tebal?: boolean;
  indent?: boolean;
}) => (
  <tr className={tebal ? "border-t border-slate-300" : ""}>
    <td className={`py-1.5 ${indent ? "pl-4" : ""} ${tebal ? "font-bold" : ""}`}>{label}</td>
    <td className={`py-1.5 text-right ${tebal ? "font-bold" : ""}`}>{formatRupiah(nilai)}</td>
  </tr>
);

export default function PrintFinancialReportModal({
  labelPeriode,
  pnl,
  arusKas,
  series,
  modeSeries,
  tahun,
  onClose
}: Props) {
  const dicetakPada = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs print:static print:bg-white print:p-0">
      <div className="relative w-full max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl print:max-w-none print:border-none print:p-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Pratinjau Cetak Laporan Keuangan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/25 transition-all hover:bg-red-700"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Kop surat */}
        <div className="flex items-start justify-between border-b-2 border-red-600 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-1">
              <img src="/logo-emblem.png" alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">{COMPANY.name}</h1>
              <CompanyContact />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Laporan Keuangan</p>
            <p className="text-base font-black">{labelPeriode}</p>
            <p className="mt-1 text-[10px] text-slate-500">Dicetak {dicetakPada}</p>
          </div>
        </div>

        {/* Laba rugi */}
        {pnl && (
          <section className="break-inside-avoid">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wider">Laporan Laba Rugi</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-1.5 text-left font-semibold">Komponen</th>
                  <th className="pb-1.5 text-right font-semibold">Nominal</th>
                </tr>
              </thead>
              <tbody>
                <Baris label="Pendapatan Penjualan" nilai={pnl.totalRevenue} />
                <Baris label="Beban Pokok Penjualan (HPP)" nilai={-pnl.totalHpp} />
                <Baris label="LABA KOTOR" nilai={pnl.grossProfit} tebal />
                {Object.entries(pnl.expenseBreakdown).map(([nama, jumlah]) => (
                  <Baris key={nama} label={`Beban ${nama}`} nilai={-jumlah} indent />
                ))}
                <Baris label="Total Beban Operasional" nilai={-pnl.totalExpenses} />
                <Baris label="LABA BERSIH" nilai={pnl.netProfit} tebal />
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-slate-500">
              Margin laba kotor {pnl.grossProfitMargin.toFixed(1).replace(".", ",")}% &middot; margin laba bersih{" "}
              {pnl.netProfitMargin.toFixed(1).replace(".", ",")}%
            </p>
            {pnl.coverage && pnl.coverage.itemsWithHpp < pnl.coverage.itemsTotal && (
              <p className="mt-1 text-[10px] font-semibold text-amber-700">
                Catatan: HPP baru terekam pada {pnl.coverage.itemsWithHpp} dari {pnl.coverage.itemsTotal} baris
                penjualan periode ini, sehingga laba kotor di atas masih terlalu tinggi.
              </p>
            )}
          </section>
        )}

        {/* Arus kas */}
        {arusKas && (
          <section className="break-inside-avoid">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wider">Laporan Arus Kas (Operasional)</h2>
            <table className="w-full text-xs">
              <tbody>
                <Baris label="Penerimaan dari pelanggan" nilai={arusKas.masuk.total} />
                <Baris label="Pembayaran ke supplier" nilai={-arusKas.keluar.keSupplier} />
                {Object.entries(arusKas.keluar.bebanPerKategori).map(([nama, jumlah]) => (
                  <Baris key={nama} label={`Beban ${nama}`} nilai={-jumlah} indent />
                ))}
                <Baris label="Total kas keluar" nilai={-arusKas.keluar.total} />
                <Baris
                  label={arusKas.arusKasBersih >= 0 ? "SURPLUS KAS PERIODE" : "DEFISIT KAS PERIODE"}
                  nilai={arusKas.arusKasBersih}
                  tebal
                />
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-slate-500">
              Saldo kas &amp; bank per hari cetak: {formatRupiah(arusKas.saldoKasSekarang.total)}. Laporan ini
              hanya mencakup kegiatan operasional; transaksi investasi dan pendanaan belum dicatat sistem.
            </p>
          </section>
        )}

        {/* Rekap periode */}
        {series.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wider">
              Rekap {modeSeries === "kuartal" ? "Kuartalan" : "Bulanan"} {tahun}
            </h2>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-1.5 text-left font-semibold">Periode</th>
                  <th className="pb-1.5 text-right font-semibold">Pendapatan</th>
                  <th className="pb-1.5 text-right font-semibold">HPP</th>
                  <th className="pb-1.5 text-right font-semibold">Beban</th>
                  <th className="pb-1.5 text-right font-semibold">Laba Bersih</th>
                </tr>
              </thead>
              <tbody>
                {series.map((p) => (
                  <tr key={p.label} className="border-b border-slate-100">
                    <td className="py-1 font-semibold">{p.label}</td>
                    <td className="py-1 text-right">{formatRupiah(p.pendapatan)}</td>
                    <td className="py-1 text-right">{formatRupiah(p.hpp)}</td>
                    <td className="py-1 text-right">{formatRupiah(p.beban)}</td>
                    <td className="py-1 text-right font-bold">{formatRupiah(p.labaBersih)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="flex justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
          <span>Laporan dihasilkan otomatis dari transaksi yang tercatat di sistem.</span>
          <span>{COMPANY.name}</span>
        </div>
      </div>
    </div>
  );
}
