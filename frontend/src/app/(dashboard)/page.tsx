"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { canAccess } from "@/lib/routeAccess";
import { getStoredUser } from "@/lib/session";
import { useLowStock } from "@/lib/useLowStock";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardKpiGrid from "@/components/dashboard/DashboardKpiGrid";
import DashboardTrendChart from "@/components/dashboard/DashboardTrendChart";
import DashboardFinancePanel from "@/components/dashboard/DashboardFinancePanel";
import DashboardTopProducts from "@/components/dashboard/DashboardTopProducts";
import DashboardQuickNav from "@/components/dashboard/DashboardQuickNav";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import ErrorBanner from "@/components/common/ErrorBanner";

export default function DashboardPage() {
  // Alert stok memakai endpoint inventori; role tanpa akses inventori tidak perlu memanggilnya.
  const { items: lowStockItems, reload: reloadLowStock } = useLowStock(canAccess(getStoredUser()?.modules, "/inventory"));
  const [loading, setLoading] = useState(true);
  const [hidePrices, setHidePrices] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadError, setLoadError] = useState("");

  const checkHidePrices = () => {
    setHidePrices(localStorage.getItem("hide-prices") === "true");
  };

  const loadStats = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.get("/dashboard/stats");
      if (data && data.sales) setStats(data);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHidePrices();
    loadStats();

    window.addEventListener("storage", checkHidePrices);
    return () => window.removeEventListener("storage", checkHidePrices);
  }, []);

  const refreshAll = () => {
    loadStats();
    reloadLowStock();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <DashboardHeader />

      <ErrorBanner message={loadError} onRetry={refreshAll} />

      {/* 2. Alert stok di bawah minimum */}
      <LowStockAlert items={lowStockItems} />

      {loading && !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl" />
            <div className="h-96 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl" />
            <div className="h-72 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl" />
          </div>
        </div>
      ) : stats ? (
        <>
          {/* 3. Angka utama */}
          <DashboardKpiGrid stats={stats} hidePrices={hidePrices} />

          {/* 4. Tren & posisi keuangan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardTrendChart trendData={stats.trendData || []} hidePrices={hidePrices} />
            <DashboardFinancePanel
              cashPosition={stats.cash?.position || 0}
              receivable={stats.debts?.receivable || 0}
              payable={stats.debts?.payable || 0}
              production={stats.production || { activeCount: 0, completedCount: 0 }}
              hidePrices={hidePrices}
            />
          </div>

          {/* 5. Produk teratas & pintasan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardTopProducts products={stats.topProducts || []} hidePrices={hidePrices} />
            </div>
            <DashboardQuickNav />
          </div>
        </>
      ) : null}
    </div>
  );
}
