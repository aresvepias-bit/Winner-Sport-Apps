"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
import ProductionHeader from "@/components/production/ProductionHeader";
import WorkOrdersTable, { WorkOrder } from "@/components/production/WorkOrdersTable";
import CompleteWorkOrderModal from "@/components/production/CompleteWorkOrderModal";
import CreateWorkOrderModal from "@/components/production/CreateWorkOrderModal";
import PrintSpkModal from "@/components/print/PrintSpkModal";

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const loadWorkOrders = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [resWO, resProd] = await Promise.all([
        api.get("/production/work-orders"),
        api.get("/master/products")
      ]);
      setProducts(Array.isArray(resProd) ? resProd : []);
      setWorkOrders(Array.isArray(resWO) ? resWO : []);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const handleOpenComplete = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setShowCompleteModal(true);
  };

  const handleOpenPrint = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setShowPrintModal(true);
  };

  const handleExportSPK = () => {
    const headers = [
      "No. SPK",
      "Produk Target",
      "Target Qty",
      "Hasil Jadi",
      "Reject/Scrap",
      "Biaya Bahan (Rp)",
      "HPP Aktual / pcs (Rp)",
      "Tenggat Waktu",
      "Status",
      "Catatan"
    ];
    const rows = workOrders.map((wo) => [
      wo.woNumber,
      wo.product?.name || "-",
      wo.targetQty,
      wo.completedQty,
      wo.scrapQty ?? 0,
      wo.materialCost,
      wo.hppPerPcs ?? 0,
      new Date(wo.dueDate).toLocaleDateString("id-ID"),
      wo.status,
      wo.notes || "-"
    ]);
    exportToCsv("Daftar_SPK_Produksi_Winner_Sport", headers, rows);
  };

  const handleCreateSPK = async (formData: {
    productId: string;
    targetQty: number;
    dueDate: string;
    notes: string;
  }) => {
    try {
      await api.post("/production/work-orders", formData);
      alert("Surat Perintah Kerja (SPK) Baru Berhasil Diterbitkan!");
      setShowCreateModal(false);
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message || "Gagal menerbitkan SPK. Data belum tersimpan.");
    }
  };

  const handleCompleteSubmit = async (formData: {
    completedQty: number;
    scrapQty: number;
    sewingCost: number;
    laborCost: number;
    overheadCost: number;
  }) => {
    if (!selectedWO) return;

    try {
      await api.post(`/production/work-orders/${selectedWO.id}/complete`, formData);
      alert("SPK Berhasil Diselesaikan! HPP telah dihitung dan stok produk telah masuk ke gudang.");
      setShowCompleteModal(false);
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message || "Gagal menyelesaikan SPK. Stok dan HPP belum berubah.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <ProductionHeader
        loading={loading}
        onRefresh={loadWorkOrders}
        onCreateSPK={() => setShowCreateModal(true)}
      />

      <ErrorBanner message={loadError} onRetry={loadWorkOrders} />

      {/* 2. Work Orders Table */}
      <WorkOrdersTable
        workOrders={workOrders}
        onOpenCompleteModal={handleOpenComplete}
        onOpenPrintModal={handleOpenPrint}
        onExportCsv={handleExportSPK}
      />

      {/* 3. Create Work Order Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSPK}
        />
      )}

      {/* 4. Complete Work Order & Calculate HPP Modal */}
      {showCompleteModal && selectedWO && (
        <CompleteWorkOrderModal
          workOrder={selectedWO}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleCompleteSubmit}
        />
      )}

      {/* 5. Print SPK Modal */}
      {showPrintModal && selectedWO && (
        <PrintSpkModal
          workOrder={selectedWO}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
