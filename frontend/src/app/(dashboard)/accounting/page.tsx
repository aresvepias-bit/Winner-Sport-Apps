"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
import AccountingHeader from "@/components/accounting/AccountingHeader";
import AccountingNavTabs, { AccountingTabType } from "@/components/accounting/AccountingNavTabs";
import ProfitAndLossView from "@/components/accounting/ProfitAndLossView";
import CashBankView from "@/components/accounting/CashBankView";
import ExpensesTableView from "@/components/accounting/ExpensesTableView";
import TailorPayrollView from "@/components/accounting/TailorPayrollView";
import CreateExpenseModal from "@/components/accounting/CreateExpenseModal";

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<AccountingTabType>("pnl");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [pnl, setPnl] = useState<any>(null);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      if (activeTab === "pnl") {
        const res = await api.get("/accounting/profit-and-loss");
        if (res && res.totalRevenue !== undefined) setPnl(res);
      } else if (activeTab === "cash") {
        const res = await api.get("/accounting/cash-bank");
        if (res && res.accounts) setCashAccounts(res.accounts);
      } else if (activeTab === "expenses") {
        const res = await api.get("/accounting/expenses");
        if (res && Array.isArray(res)) setExpenses(res);
      }
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
    if (activeTab === "pnl" && pnl) {
      const headers = ["Komponen Laba Rugi", "Nominal (Rp)", "Rasio %"];
      const rows = [
        ["Pendapatan Penjualan (Revenue)", pnl.totalRevenue, "100%"],
        ["Beban Pokok Produksi (HPP)", -pnl.totalHpp, `${pnl.totalRevenue > 0 ? ((pnl.totalHpp / pnl.totalRevenue) * 100).toFixed(1) : 0}%`],
        ["LABA KOTOR (Gross Profit)", pnl.grossProfit, `${pnl.grossProfitMargin}%`],
        ["Total Beban Operasional", -pnl.totalExpenses, `${pnl.totalRevenue > 0 ? ((pnl.totalExpenses / pnl.totalRevenue) * 100).toFixed(1) : 0}%`],
        ["LABA BERSIH BERJALAN (Net Profit)", pnl.netProfit, `${pnl.netProfitMargin}%`]
      ];
      exportToCsv("Laporan_Laba_Rugi_Winner_Sport", headers, rows);
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
    } else if (activeTab === "cash") {
      const headers = ["Kode Akun", "Nama Rekening / Kas", "Saldo Berjalan (Rp)"];
      const rows = cashAccounts.map((a) => [a.code, a.name, a.balance]);
      exportToCsv("Buku_Kas_Bank_Winner_Sport", headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <AccountingHeader
        loading={loading}
        onRefresh={loadData}
        onCreateExpense={openExpenseModal}
        onExportCsv={activeTab !== "payroll" ? handleExportCsv : undefined}
      />

      <ErrorBanner message={loadError} onRetry={loadData} />

      {/* 2. Navigation Tabs */}
      <AccountingNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Tab Views with Skeleton Loading */}
      {activeTab === "pnl" && (
        loading && !pnl ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl shadow-sm" />
              ))}
            </div>
            <div className="h-96 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl shadow-sm" />
          </div>
        ) : pnl ? (
          <ProfitAndLossView pnl={pnl} />
        ) : null
      )}

      {activeTab === "cash" && (
        loading && cashAccounts.length === 0 ? (
          <div className="h-64 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl animate-pulse shadow-sm" />
        ) : (
          <CashBankView cashAccounts={cashAccounts} />
        )
      )}

      {activeTab === "expenses" && (
        loading && expenses.length === 0 ? (
          <div className="h-64 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl animate-pulse shadow-sm" />
        ) : (
          <ExpensesTableView expenses={expenses} />
        )
      )}

      {activeTab === "payroll" && <TailorPayrollView />}

      {/* 4. Create Expense Modal */}
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
