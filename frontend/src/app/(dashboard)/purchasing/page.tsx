"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
import PurchasingHeader from "@/components/purchasing/PurchasingHeader";
import PurchaseOrdersTable, { PurchaseOrderItem } from "@/components/purchasing/PurchaseOrdersTable";
import CreatePurchaseOrderModal from "@/components/purchasing/CreatePurchaseOrderModal";

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPurchasing = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [resPO, resSup, resMat] = await Promise.all([
        api.get("/purchasing/orders"),
        api.get("/master/contacts"),
        api.get("/master/raw-materials")
      ]);
      setOrders(Array.isArray(resPO) ? resPO : []);
      setSuppliers(
        Array.isArray(resSup) ? resSup.filter((c: any) => c.type === "SUPPLIER" || c.type === "BOTH") : []
      );
      setMaterials(Array.isArray(resMat) ? resMat : []);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchasing();
  }, []);

  const handleExportPO = () => {
    const headers = ["No. PO", "Tanggal Order", "Supplier", "Bahan", "Qty", "Harga Satuan (Rp)", "Total Pembelian (Rp)", "Status"];
    const rows = orders.map((po) => [
      po.poNumber,
      new Date(po.orderDate).toLocaleDateString("id-ID"),
      po.supplier?.name || "-",
      po.items?.map((i) => i.rawMaterial?.name).filter(Boolean).join("; ") || "-",
      po.items?.reduce((sum, i) => sum + Number(i.quantity), 0) ?? 0,
      po.items?.[0]?.unitPrice ?? 0,
      po.totalAmount,
      po.status
    ]);
    exportToCsv("Daftar_Purchase_Order_Winner_Sport", headers, rows);
  };

  const handleCreatePO = async (formData: {
    supplierId: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
    orderDate: string;
    notes: string;
  }) => {
    try {
      // Backend menerima PO sebagai header + daftar item.
      await api.post("/purchasing/orders", {
        supplierId: formData.supplierId,
        expectedDate: formData.orderDate,
        notes: formData.notes,
        items: [
          {
            rawMaterialId: formData.rawMaterialId,
            quantity: formData.quantity,
            unitPrice: formData.unitPrice
          }
        ]
      });
      alert("Purchase Order (PO) Berhasil Diterbitkan ke Supplier!");
      setShowCreateModal(false);
      loadPurchasing();
    } catch (err: any) {
      alert(err.message || "Gagal menerbitkan Purchase Order. Data belum tersimpan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Create PO button */}
      <PurchasingHeader
        loading={loading}
        onRefresh={loadPurchasing}
        onCreatePO={() => setShowCreateModal(true)}
      />

      <ErrorBanner message={loadError} onRetry={loadPurchasing} />

      {/* 2. Purchase Orders Table */}
      <PurchaseOrdersTable orders={orders} onExportCsv={handleExportPO} />

      {/* 3. Create PO Modal */}
      {showCreateModal && (
        <CreatePurchaseOrderModal
          suppliers={suppliers}
          materials={materials}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePO}
        />
      )}
    </div>
  );
}
