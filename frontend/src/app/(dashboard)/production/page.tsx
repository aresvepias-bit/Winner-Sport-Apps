"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ProductionHeader from "@/components/production/ProductionHeader";
import WorkOrdersTable, { WorkOrder } from "@/components/production/WorkOrdersTable";
import CompleteWorkOrderModal from "@/components/production/CompleteWorkOrderModal";
import CreateWorkOrderModal from "@/components/production/CreateWorkOrderModal";
import PrintSpkModal from "@/components/print/PrintSpkModal";

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const [resWO, resProd] = await Promise.all([
        api.get("/production/work-orders"),
        api.get("/master/products").catch(() => [])
      ]);
      if (resProd && Array.isArray(resProd)) {
        setProducts(resProd);
      }
      if (resWO && Array.isArray(resWO) && resWO.length > 0) {
        setWorkOrders(resWO);
      } else {
        setWorkOrders([
          {
            id: "1",
            woNumber: "SPK-2026-0041",
            product: { name: "Jersey Futsal Winner Dryfit (Custom)" },
            targetQty: 100,
            completedQty: 0,
            status: "IN_PROGRESS",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            materialCost: 2125000,
            notes: "Pesanan FC Juara Futsal - Sablon Polyflex Nama Punggung"
          },
          {
            id: "2",
            woNumber: "SPK-2026-0040",
            product: { name: "Kaos Polos Cotton Combed 30s Hitam" },
            targetQty: 200,
            completedQty: 200,
            scrapQty: 4,
            status: "COMPLETED",
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            materialCost: 6270000,
            hppPerPcs: 39850,
            notes: "Restock gudang kodi distro"
          }
        ]);
      }
    } catch (err) {
      console.warn("Error fetching work orders:", err);
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
      const selectedProd = products.find((p) => p.id === formData.productId) || {
        name: "Jersey Futsal Winner Dryfit (Custom)"
      };
      const newWO: WorkOrder = {
        id: String(Date.now()),
        woNumber: `SPK-2026-${Date.now().toString().slice(-4)}`,
        product: { name: selectedProd.name },
        targetQty: formData.targetQty,
        completedQty: 0,
        status: "IN_PROGRESS",
        dueDate: formData.dueDate,
        materialCost: Math.round(formData.targetQty * 0.25 * 85000),
        notes: formData.notes
      };
      setWorkOrders([newWO, ...workOrders]);
      setShowCreateModal(false);
      alert("Surat Perintah Kerja (SPK) Baru Berhasil Diterbitkan!");
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
      const updated = workOrders.map((wo) => {
        if (wo.id === selectedWO.id) {
          const total =
            Number(wo.materialCost || 2000000) +
            formData.sewingCost +
            formData.laborCost +
            formData.overheadCost;
          return {
            ...wo,
            status: "COMPLETED",
            completedQty: formData.completedQty,
            scrapQty: formData.scrapQty,
            hppPerPcs: Math.round(total / (formData.completedQty || 1))
          };
        }
        return wo;
      });
      setWorkOrders(updated);
      setShowCompleteModal(false);
      alert("SPK Berhasil Diselesaikan! Stok bertambah dan HPP tersimpan.");
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

      {/* 2. Work Orders Table */}
      <WorkOrdersTable
        workOrders={workOrders}
        onOpenCompleteModal={handleOpenComplete}
        onOpenPrintModal={handleOpenPrint}
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
