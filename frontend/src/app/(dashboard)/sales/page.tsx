"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import SalesOverview from "@/components/sales/SalesOverview";
import { salesMonth, salesSegment, summarizeSales } from "@/components/sales/salesAnalytics";
import { CalendarDays, LayoutDashboard, ListFilter, Search } from "lucide-react";
import ErrorBanner from "@/components/common/ErrorBanner";
import SalesMonthPicker from "@/components/sales/SalesMonthPicker";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesOrdersTable, { SalesOrderItem } from "@/components/sales/SalesOrdersTable";
import CreateOrderModal from "@/components/sales/CreateOrderModal";
import PrintInvoiceModal from "@/components/print/PrintInvoiceModal";

export default function SalesPage() {
  const [month, setMonth] = useState(() => salesMonth());
  const [view, setView] = useState<"overview" | "transactions">("overview");
  const [segment, setSegment] = useState<"ALL" | "CORPORATE" | "CUSTOMER">("ALL");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesTypes, setSalesTypes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [resOrders, resContacts, resTypes, resUnits] = await Promise.all([
        api.get("/sales/orders"),
        api.get("/master/contacts"),
        api.get("/master/sales-types?activeOnly=true"),
        api.get("/master/units?activeOnly=true")
      ]);
      setOrders(Array.isArray(resOrders) ? resOrders : []);
      setCustomers(
        Array.isArray(resContacts) ? resContacts.filter((c: any) => c.type === "CUSTOMER" || c.type === "BOTH") : []
      );
      setSalesTypes(Array.isArray(resTypes) ? resTypes : []);
      setUnits(Array.isArray(resUnits) ? resUnits : []);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenPrint = (order: SalesOrderItem) => {
    setSelectedOrder(order);
    setShowPrintModal(true);
  };

  // Kode tipe disimpan di order; namanya diambil dari master agar mudah dibaca.
  const salesTypeLabels: Record<string, string> = Object.fromEntries(
    salesTypes.map((t: any) => [t.code, t.name])
  );

  const summary = summarizeSales(orders, month);
  const filteredOrders = summary.period.filter((order) => {
    const matchesSegment = segment === "ALL" || salesSegment(order) === segment;
    return matchesSegment && `${order.soNumber} ${order.customer?.name || ""} ${order.customer?.companyName || ""}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));

  const handleExportSales = () => {
    const headers = [
      "No. SO",
      "Tanggal",
      "Pelanggan",
      "Tipe Penjualan",
      "Total Tagihan (Rp)",
      "Sudah Terbayar (Rp)",
      "Status Bayar",
      "Status Produksi"
    ];
    const rows = filteredOrders.map((o) => [
      o.soNumber,
      new Date(o.createdAt).toLocaleDateString("id-ID"),
      o.customer?.name || "Pelanggan Umum",
      salesTypeLabels[o.orderType] || o.orderType,
      o.totalAmount,
      o.paidAmount,
      o.paymentStatus,
      o.status
    ]);
    exportToCsv(`Penjualan_${month}_${segment}`, headers, rows);
  };

  /** Menyimpan pelanggan baru dari dalam form order, lalu menambahkannya ke daftar. */
  const handleCreateCustomer = async (data: Record<string, unknown>) => {
    try {
      const created = await api.post("/master/contacts", { ...data, type: "CUSTOMER" });
      setCustomers((prev) => [...prev, created]);
      alert("Pelanggan baru berhasil ditambahkan dan langsung dipilih.");
      return { id: created.id, name: created.name };
    } catch (err: any) {
      alert(err.message || "Gagal menambah pelanggan. Data belum tersimpan.");
      return null;
    }
  };

  const handleCreateOrder = async (formData: {
    customerId: string;
    orderType: string;
    quantity: number;
    unitName: string;
    pricePerUnit: number;
    notes: string;
  }) => {
    try {
      const payload = {
        customerId: formData.customerId,
        orderType: formData.orderType,
        notes: formData.notes,
        items: [
          {
            customDescription: `Pesanan Pakaian (${formData.quantity} ${formData.unitName})`,
            quantity: formData.quantity,
            unitName: formData.unitName,
            pricePerUnit: formData.pricePerUnit
          }
        ]
      };
      await api.post("/sales/orders", payload);
      alert("Order Penjualan berhasil dibuat & invoice telah diterbitkan!");
      setShowCreateModal(false);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Gagal membuat order penjualan. Data belum tersimpan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <SalesHeader
        loading={loading}
        onRefresh={loadOrders}
        onCreateOrder={() => setShowCreateModal(true)}
      />

      <ErrorBanner message={loadError} onRetry={loadOrders} />

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#0d1424]">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-red-50 p-3 text-red-600 dark:bg-red-500/10"><CalendarDays className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Periode penjualan</p><h2 className="mt-1 font-bold">{monthLabel}</h2></div></div>
        <div className="flex flex-wrap items-center gap-2"><SalesMonthPicker value={month} onChange={setMonth} /><button onClick={() => setMonth(salesMonth())} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700">Bulan ini</button></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button aria-pressed={view === "overview"} onClick={() => setView("overview")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${view === "overview" ? "bg-red-600 text-white" : "bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}><LayoutDashboard className="h-4 w-4" />Ringkasan</button>
        <button aria-pressed={view === "transactions"} onClick={() => setView("transactions")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${view === "transactions" ? "bg-red-600 text-white" : "bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}><ListFilter className="h-4 w-4" />Transaksi <span className="rounded-md bg-black/5 px-1.5 py-0.5">{summary.period.length}</span></button>
      </div>
      {view === "overview" ? <SalesOverview summary={summary} loading={loading} onSegment={(nextSegment) => { setSegment(nextSegment); setSearch(""); setView("transactions"); }} /> : <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{([['ALL', 'Semua'], ['CORPORATE', 'Corporate'], ['CUSTOMER', 'Customer']] as const).map(([value, label]) => <button key={value} aria-pressed={segment === value} onClick={() => setSegment(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${segment === value ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "border-slate-200 dark:border-slate-700"}`}>{label}</button>)}</div><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Cari nomor order atau pelanggan" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari order atau pelanggan..." className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-900" /></label></div>
        <SalesOrdersTable key={`${month}-${segment}-${search}`} orders={filteredOrders} salesTypeLabels={salesTypeLabels} onOpenPrintModal={handleOpenPrint} onExportCsv={handleExportSales} />
      </div>}

      {/* 3. Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          customers={customers}
          salesTypes={salesTypes}
          units={units}
          onCreateCustomer={handleCreateCustomer}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {/* 4. Print Invoice Modal */}
      {showPrintModal && selectedOrder && (
        <PrintInvoiceModal
          order={selectedOrder}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
