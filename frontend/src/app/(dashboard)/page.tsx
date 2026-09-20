"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardKpiGrid from "@/components/dashboard/DashboardKpiGrid";
import DashboardTrendChart from "@/components/dashboard/DashboardTrendChart";
import DashboardQuickNav from "@/components/dashboard/DashboardQuickNav";
import DashboardRecentOrders from "@/components/dashboard/DashboardRecentOrders";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import ErrorBanner from "@/components/common/ErrorBanner";
import { useLowStock } from "@/lib/useLowStock";

export default function DashboardPage() {
  const { items: lowStockItems, reload: reloadLowStock } = useLowStock();
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
      if (data && data.sales) {
        setStats(data);
      }
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

  return (
    <div className="space-y-6">
      {/* 1. Executive Cockpit Header */}
      <DashboardHeader
        loading={loading}
        onRefresh={() => {
          loadStats();
          reloadLowStock();
        }}
      />

      <ErrorBanner message={loadError} onRetry={loadStats} />

      {/* 1b. Alert stok di bawah minimum */}
      <LowStockAlert items={lowStockItems} />

      {/* 2. Executive Cockpit Data or Skeleton Loader */}
      {loading && !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-5 shadow-sm" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl shadow-sm" />
            <div className="h-72 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl shadow-sm" />
          </div>
          <div className="h-64 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl shadow-sm" />
        </div>
      ) : stats ? (
        <>
          {/* Key Performance Indicators Grid */}
          <DashboardKpiGrid stats={stats} hidePrices={hidePrices} />

          {/* Operational Charts & Quick Financial Action Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardTrendChart trendData={stats.trendData} />
            <DashboardQuickNav
              cashPosition={stats.cash?.position || 0}
              receivable={stats.debts?.receivable || 0}
              payable={stats.debts?.payable || 0}
              hidePrices={hidePrices}
            />
          </div>

          {/* Recent Sales Orders Table */}
          <DashboardRecentOrders recentOrders={stats.recentOrders || []} hidePrices={hidePrices} />
        </>
      ) : null}
    </div>
  );
}
