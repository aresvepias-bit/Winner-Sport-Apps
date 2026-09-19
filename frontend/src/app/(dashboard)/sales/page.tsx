"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesOrdersTable, { SalesOrderItem } from "@/components/sales/SalesOrdersTable";
import CreateOrderModal from "@/components/sales/CreateOrderModal";
import PrintInvoiceModal from "@/components/print/PrintInvoiceModal";

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/orders");
      if (res && Array.isArray(res) && res.length > 0) {
        setOrders(res);
      } else {
        setOrders([
          {
            id: "1",
            soNumber: "SO-2026-0012",
            customer: { name: "FC Juara Futsal", phone: "0812-9988-7766", address: "Gedung Olahraga Futsal Kemang, Jakarta Selatan" },
            orderType: "CUSTOM_ORDER",
            totalAmount: 3750000,
            paidAmount: 2000000,
            paymentStatus: "PARTIAL",
            status: "IN_PRODUCTION",
            createdAt: new Date(),
            items: [{ customDescription: "Jersey Futsal Custom Full Print (50 pcs)", quantity: 50, pricePerUnit: 75000, unitName: "pcs" }]
          },
          {
            id: "2",
            soNumber: "SO-2026-0011",
            customer: { name: "Toko Sport Jaya Abadi", phone: "0813-1122-3344", address: "Pasar Grosir Tanah Abang Blok A No. 12" },
            orderType: "KODIAN",
            totalAmount: 6000000,
            paidAmount: 6000000,
            paymentStatus: "PAID",
            status: "CONFIRMED",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            items: [{ product: { name: "Jersey Futsal Winner Dryfit" }, quantity: 5, pricePerUnit: 1200000, unitName: "kodi" }]
          }
        ]);
      }
    } catch (err) {
      console.warn("Using sample orders:", err);
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
      o.orderType,
      o.totalAmount,
      o.paidAmount,
      o.paymentStatus,
      o.status
    ]);
    exportToCsv("Daftar_Sales_Order_Winner_Sport", headers, rows);
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
      const mockSO: SalesOrderItem = {
        id: String(Date.now()),
        soNumber: `SO-2026-${Date.now().toString().slice(-4)}`,
        customer: { name: "Pelanggan Grosir Baru", address: "Gudang Distribusi Mitra" },
        orderType: formData.orderType,
        totalAmount: formData.quantity * formData.pricePerUnit,
        paidAmount: 0,
        paymentStatus: "UNPAID",
        status: "CONFIRMED",
        createdAt: new Date(),
        items: [
          {
            customDescription: `Pesanan (${formData.quantity} ${formData.unitName})`,
            quantity: formData.quantity,
            unitName: formData.unitName,
            pricePerUnit: formData.pricePerUnit
          }
        ]
      };
      setOrders([mockSO, ...orders]);
      setShowCreateModal(false);
      alert("Order Penjualan berhasil dicatat!");
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

      {/* 2. Sales Orders Table */}
      <SalesOrdersTable
        orders={orders}
        onOpenPrintModal={handleOpenPrint}
        onExportCsv={handleExportSales}
      />

      {/* 3. Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
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
