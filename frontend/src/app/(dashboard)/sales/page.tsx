"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesOrdersTable, { SalesOrderItem } from "@/components/sales/SalesOrdersTable";
import CreateOrderModal from "@/components/sales/CreateOrderModal";
import PrintInvoiceModal from "@/components/print/PrintInvoiceModal";

export default function SalesPage() {
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
    const rows = orders.map((o) => [
      o.soNumber,
      new Date(o.createdAt).toLocaleDateString("id-ID"),
      o.customer?.name || "Pelanggan Umum",
      salesTypeLabels[o.orderType] || o.orderType,
      o.totalAmount,
      o.paidAmount,
      o.paymentStatus,
      o.status
    ]);
    exportToCsv("Daftar_Sales_Order_Winner_Sport", headers, rows);
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

      {/* 2. Sales Orders Table */}
      <SalesOrdersTable
        orders={orders}
        salesTypeLabels={salesTypeLabels}
        onOpenPrintModal={handleOpenPrint}
        onExportCsv={handleExportSales}
      />

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
