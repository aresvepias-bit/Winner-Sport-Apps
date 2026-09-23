"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DatabaseZap, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import { kontenBerganti } from "@/lib/motion";
import ErrorBanner from "@/components/common/ErrorBanner";
import AccountingHeader from "@/components/accounting/AccountingHeader";
import AccountingNavTabs, { AccountingTabType } from "@/components/accounting/AccountingNavTabs";
import ExpensesTableView from "@/components/accounting/ExpensesTableView";
import TailorPayrollView from "@/components/accounting/TailorPayrollView";
import CreateExpenseModal from "@/components/accounting/CreateExpenseModal";
import ReportPeriodBar, {
  PeriodeLaporan,
  labelPeriode,
  periodeBulanIni
} from "@/components/accounting/ReportPeriodBar";
import ProfitLossReport, { LabaRugiResponse } from "@/components/accounting/ProfitLossReport";
import CashFlowReport, { ArusKasResponse } from "@/components/accounting/CashFlowReport";
import ReportTrendChart, { TitikPeriode } from "@/components/accounting/ReportTrendChart";
import PrintFinancialReportModal from "@/components/accounting/PrintFinancialReportModal";

/** Tab yang isinya laporan berperiode. */
const TAB_LAPORAN: AccountingTabType[] = ["pnl", "cash"];

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<AccountingTabType>("pnl");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [termuat, setTermuat] = useState<Partial<Record<AccountingTabType, boolean>>>({});
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [periode, setPeriode] = useState<PeriodeLaporan>(periodeBulanIni());
  const [pnl, setPnl] = useState<LabaRugiResponse | null>(null);
  const [arusKas, setArusKas] = useState<ArusKasResponse | null>(null);
  const [series, setSeries] = useState<TitikPeriode[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const sudahDimuat = !!termuat[activeTab];
  const tabLaporan = TAB_LAPORAN.includes(activeTab);
  // Grafik tren mengikuti mode periode; rentang kustom tetap memakai rekap bulanan.
  const modeSeries: "bulan" | "kuartal" = periode.mode === "kuartal" ? "kuartal" : "bulan";

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const rentang = `from=${periode.from}&to=${periode.to}`;
      if (activeTab === "pnl") {
        const [resPnl, resSeries] = await Promise.all([
          api.get(`/reports/profit-loss?${rentang}`),
          api.get(`/reports/series?tahun=${periode.tahun}&mode=${modeSeries}`)
        ]);
        setPnl(resPnl);
        setSeries(resSeries?.periode || []);
      } else if (activeTab === "cash") {
        const [resKas, resSeries] = await Promise.all([
          api.get(`/reports/cash-flow?${rentang}`),
          api.get(`/reports/series?tahun=${periode.tahun}&mode=${modeSeries}`)
        ]);
        setArusKas(resKas);
        setSeries(resSeries?.periode || []);
        setCashAccounts(resKas?.saldoKasSekarang?.accounts || []);
      } else if (activeTab === "expenses") {
        const res = await api.get("/accounting/expenses");
        setExpenses(Array.isArray(res) ? res : []);
      }
      setTermuat((prev) => ({ ...prev, [activeTab]: true }));
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  // Ganti tab atau ganti periode mengembalikan status ke belum-diambil, supaya
  // angka di layar tidak pernah memakai judul periode yang berbeda.
  const pilihTab = (tab: AccountingTabType) => {
    setActiveTab(tab);
    if (tab === "payroll") setTermuat((prev) => ({ ...prev, payroll: true }));
  };

  const gantiPeriode = (p: PeriodeLaporan) => {
    setPeriode(p);
    setTermuat((prev) => ({ ...prev, pnl: false, cash: false }));
  };

  // Kategori beban & rekening kas dibutuhkan form pengeluaran (backend menyimpan berdasarkan ID).
  const openExpenseModal = async () => {
    try {
      const [cats, cash] = await Promise.all([
        api.get("/master/categories?type=EXPENSE"),
        api.get("/accounting/cash-bank")
      ]);
      setExpenseCategories(Array.isArray(cats) ? cats : []);
      setCashAccounts(cash?.accounts || []);
      setShowExpenseModal(true);
    } catch (err: any) {
      alert(err.message || "Gagal memuat kategori dan rekening kas.");
    }
  };

  const handleCreateExpense = async (formData: {
    categoryId: string;
    accountId: string;
    amount: number;
    recipient: string;
    notes: string;
  }) => {
    try {
      await api.post("/accounting/expenses", {
        ...formData,
        categoryId: formData.categoryId || undefined
      });
      alert("Pengeluaran Kas Berhasil Dicatat & saldo rekening telah dikurangi!");
      setShowExpenseModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat pengeluaran. Data belum tersimpan.");
    }
  };

  const handleExportCsv = () => {
    const judulPeriode = labelPeriode(periode);
    if (activeTab === "pnl" && pnl) {
      const headers = ["Komponen Laba Rugi", "Periode Ini (Rp)", "Periode Sebelumnya (Rp)"];
      const rows: Array<Array<string | number>> = [
        ["Pendapatan Penjualan", pnl.totalRevenue, pnl.sebelumnya.totalRevenue],
        ["Beban Pokok Penjualan (HPP)", -pnl.totalHpp, -pnl.sebelumnya.totalHpp],
        ["LABA KOTOR", pnl.grossProfit, pnl.sebelumnya.grossProfit],
        ...Object.entries(pnl.expenseBreakdown).map(([nama, jumlah]) => [
          `Beban ${nama}`,
          -jumlah,
          -(pnl.sebelumnya.expenseBreakdown?.[nama] || 0)
        ]),
        ["Total Beban Operasional", -pnl.totalExpenses, -pnl.sebelumnya.totalExpenses],
        ["LABA BERSIH", pnl.netProfit, pnl.sebelumnya.netProfit]
      ];
      exportToCsv(`Laba_Rugi_${judulPeriode.replace(/[^\w]+/g, "_")}`, headers, rows);
    } else if (activeTab === "cash" && arusKas) {
      const headers = ["Komponen Arus Kas", "Nominal (Rp)"];
      const rows: Array<Array<string | number>> = [
        ["Penerimaan dari pelanggan", arusKas.masuk.total],
        ["Pembayaran ke supplier", -arusKas.keluar.keSupplier],
        ...Object.entries(arusKas.keluar.bebanPerKategori).map(([nama, jumlah]) => [`Beban ${nama}`, -jumlah]),
        ["Total kas keluar", -arusKas.keluar.total],
        ["Arus kas bersih", arusKas.arusKasBersih]
      ];
      exportToCsv(`Arus_Kas_${judulPeriode.replace(/[^\w]+/g, "_")}`, headers, rows);
    } else if (activeTab === "expenses") {
      const headers = ["No. Bukti", "Tanggal", "Kategori Beban", "Penerima Dana", "Nominal (Rp)", "Keterangan"];
      const rows = expenses.map((e) => [
        e.expenseNumber,
        new Date(e.date).toLocaleDateString("id-ID"),
        e.category?.name || "Operasional",
        e.recipient || "-",
        e.amount,
        e.notes || "-"
      ]);
      exportToCsv("Daftar_Pengeluaran_Kas_Winner_Sport", headers, rows);
    }
  };

  const bisaCetak = tabLaporan && sudahDimuat && (pnl || arusKas);

  return (
    <div className="space-y-6">
      <AccountingHeader
        loading={loading}
        onRefresh={loadData}
        onCreateExpense={openExpenseModal}
        onExportCsv={activeTab !== "payroll" && sudahDimuat ? handleExportCsv : undefined}
      />

      <ErrorBanner message={loadError} onRetry={loadData} />

      <AccountingNavTabs activeTab={activeTab} onTabChange={pilihTab} />

      {tabLaporan && <ReportPeriodBar nilai={periode} onChange={gantiPeriode} />}

      {activeTab === "payroll" ? (
        <TailorPayrollView />
      ) : (
        <AnimatePresence mode="wait">
          {!sudahDimuat ? (
            <motion.div
              key={`belum-${activeTab}`}
              variants={kontenBerganti}
              initial="awal"
              animate="masuk"
              exit="keluar"
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]"
            >
              <DatabaseZap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-3 text-base font-bold">Laporan belum diambil</h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {tabLaporan
                  ? `Pastikan periodenya benar (${labelPeriode(periode)}), lalu tekan Proses untuk menyusun laporan.`
                  : "Tekan Proses untuk mengambil data dari server."}
              </p>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DatabaseZap className="h-4 w-4" />
                {loading ? "Menyusun laporan..." : "Proses & Tampilkan Laporan"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`isi-${activeTab}`}
              variants={kontenBerganti}
              initial="awal"
              animate="masuk"
              exit="keluar"
              className="space-y-6"
            >
              {tabLaporan && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#1a2236] dark:bg-[#0d1424]">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {activeTab === "pnl" ? "Laporan Laba Rugi" : "Laporan Arus Kas"}
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{labelPeriode(periode)}</p>
                  </div>
                  {bisaCetak && (
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Cetak / Simpan PDF
                    </button>
                  )}
                </div>
              )}

              {activeTab === "pnl" && pnl && <ProfitLossReport data={pnl} />}
              {activeTab === "cash" && arusKas && <CashFlowReport data={arusKas} />}

              {tabLaporan && series.length > 0 && (
                <ReportTrendChart
                  periode={series}
                  mode={modeSeries}
                  tahun={periode.tahun}
                  indeksAktif={periode.mode === "kustom" ? undefined : periode.indeks}
                />
              )}

              {activeTab === "expenses" && <ExpensesTableView expenses={expenses} />}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showPrintModal && (
          <PrintFinancialReportModal
            labelPeriode={labelPeriode(periode)}
            pnl={activeTab === "pnl" ? pnl : null}
            arusKas={activeTab === "cash" ? arusKas : null}
            series={series}
            modeSeries={modeSeries}
            tahun={periode.tahun}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </AnimatePresence>

      {showExpenseModal && (
        <CreateExpenseModal
          categories={expenseCategories}
          accounts={cashAccounts}
          onClose={() => setShowExpenseModal(false)}
          onSubmit={handleCreateExpense}
        />
      )}
    </div>
  );
}
