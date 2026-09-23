"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Info, Scale, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { kartuNaik, wadahBerurutan } from "@/lib/motion";

export interface ArusKas {
  masuk: {
    total: number;
    perMetode: Record<string, number>;
    jumlahTransaksi: number;
  };
  keluar: {
    total: number;
    keSupplier: number;
    bebanOperasional: number;
    bebanPerKategori: Record<string, number>;
    jumlahTransaksi: number;
  };
  arusKasBersih: number;
}

export interface ArusKasResponse extends ArusKas {
  periode: { from: string; to: string };
  sebelumnya: ArusKas;
  saldoKasSekarang: {
    accounts: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
}

const NAMA_METODE: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  GIRO: "Giro"
};

interface Props {
  data: ArusKasResponse;
}

export default function CashFlowReport({ data }: Props) {
  const { masuk, keluar, arusKasBersih, sebelumnya, saldoKasSekarang } = data;
  const surplus = arusKasBersih >= 0;

  const kartu = [
    {
      label: "Kas Masuk",
      nilai: formatRupiah(masuk.total),
      catatan: `${masuk.jumlahTransaksi} penerimaan dari pelanggan`,
      Icon: ArrowDownLeft,
      warna: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      label: "Kas Keluar",
      nilai: formatRupiah(keluar.total),
      catatan: `${keluar.jumlahTransaksi} pembayaran & beban`,
      Icon: ArrowUpRight,
      warna: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
    },
    {
      label: surplus ? "Surplus Kas" : "Defisit Kas",
      nilai: formatRupiah(arusKasBersih),
      catatan: `Periode sebelumnya ${formatRupiah(sebelumnya.arusKasBersih)}`,
      Icon: Scale,
      warna: surplus
        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
        : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
    },
    {
      label: "Saldo Kas & Bank",
      nilai: formatRupiah(saldoKasSekarang.total),
      catatan: "Posisi hari ini, bukan akhir periode",
      Icon: Wallet,
      warna: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-500/10"
    }
  ];

  const rincianMasuk = Object.entries(masuk.perMetode);
  const rincianKeluar: Array<[string, number]> = [
    ["Pembayaran ke supplier", keluar.keSupplier],
    ...Object.entries(keluar.bebanPerKategori).map(([n, v]) => [`Beban ${n}`, v] as [string, number])
  ];

  return (
    <div className="space-y-6">
      <motion.div
        variants={wadahBerurutan}
        initial="awal"
        animate="masuk"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kartu.map(({ label, nilai, catatan, Icon, warna }) => (
          <motion.div
            key={label}
            variants={kartuNaik}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1.5 truncate text-2xl font-black text-slate-900 dark:text-white">{nilai}</p>
              </div>
              <span className={`shrink-0 rounded-xl p-2 ${warna}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{catatan}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Rincian Kas Masuk</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Menurut cara pelanggan membayar</p>
          {rincianMasuk.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada penerimaan di periode ini.</p>
          ) : (
            <dl className="divide-y divide-slate-100 text-xs dark:divide-[#1a2236]/60">
              {rincianMasuk.map(([metode, jumlah]) => (
                <div key={metode} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                  <dt className="text-slate-600 dark:text-slate-300">{NAMA_METODE[metode] || metode}</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">{formatRupiah(jumlah)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-2.5 font-black">
                <dt className="text-slate-900 dark:text-white">Total</dt>
                <dd className="text-emerald-600 dark:text-emerald-400">{formatRupiah(masuk.total)}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Rincian Kas Keluar</h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Pembayaran hutang dan beban operasional</p>
          {rincianKeluar.every(([, v]) => !v) ? (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada pengeluaran di periode ini.</p>
          ) : (
            <dl className="divide-y divide-slate-100 text-xs dark:divide-[#1a2236]/60">
              {rincianKeluar
                .filter(([, v]) => v)
                .map(([nama, jumlah]) => (
                  <div key={nama} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                    <dt className="text-slate-600 dark:text-slate-300">{nama}</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatRupiah(jumlah)}</dd>
                  </div>
                ))}
              <div className="flex items-center justify-between gap-4 py-2.5 font-black">
                <dt className="text-slate-900 dark:text-white">Total</dt>
                <dd className="text-rose-600 dark:text-rose-400">{formatRupiah(keluar.total)}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1a2236] dark:bg-[#0d1424] dark:shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Posisi Kas &amp; Bank</h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Saldo berjalan tiap rekening</p>
        <dl className="divide-y divide-slate-100 text-xs dark:divide-[#1a2236]/60">
          {saldoKasSekarang.accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
              <dt className="text-slate-600 dark:text-slate-300">
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{a.code}</span> {a.name}
              </dt>
              <dd className="font-bold text-slate-900 dark:text-white">{formatRupiah(a.balance)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600 dark:border-[#1a2236] dark:bg-slate-800/30 dark:text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Arus kas ini disusun dari penerimaan pembayaran, pembayaran ke supplier, dan pengeluaran kas yang
          tercatat. Aplikasi belum mencatat transaksi investasi maupun pendanaan, jadi laporan ini hanya
          mencakup kegiatan operasional. Saldo kas &amp; bank adalah posisi hari ini, bukan saldo akhir periode —
          sistem belum menyimpan riwayat saldo per tanggal.
        </span>
      </div>
    </div>
  );
}
