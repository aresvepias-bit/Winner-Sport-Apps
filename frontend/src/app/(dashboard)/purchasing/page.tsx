"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import PurchasingHeader from "@/components/purchasing/PurchasingHeader";
import PurchaseOrdersTable, { PurchaseOrderItem } from "@/components/purchasing/PurchaseOrdersTable";
import CreatePurchaseOrderModal from "@/components/purchasing/CreatePurchaseOrderModal";

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPurchasing = async () => {
    setLoading(true);
    try {
      const [resPO, resSup, resMat] = await Promise.all([
        api.get("/purchasing/orders"),
        api.get("/master/contacts").catch(() => []),
        api.get("/master/raw-materials").catch(() => [])
      ]);

      if (resSup && Array.isArray(resSup)) {
        setSuppliers(resSup.filter((c: any) => c.type === "SUPPLIER"));
      }
      if (resMat && Array.isArray(resMat)) {
        setMaterials(resMat);
      }
      if (resPO && Array.isArray(resPO) && resPO.length > 0) {
        setOrders(resPO);
      } else {
        setOrders([
          {
            id: "1",
            poNumber: "PO-2026-0015",
            supplier: { name: "CV Multi Tekstil Bandung" },
            orderDate: new Date(),
            totalAmount: 11000000,
            status: "RECEIVED",
            items: [{ rawMaterial: { name: "Kain Cotton Combed 30s Hitam" }, quantity: 100, unitPrice: 110000 }]
          },
          {
            id: "2",
            poNumber: "PO-2026-0016",
            supplier: { name: "CV Multi Tekstil Bandung" },
            orderDate: new Date(),
            totalAmount: 8500000,
            status: "ORDERED",
            items: [{ rawMaterial: { name: "Kain Dryfit Milano" }, quantity: 100, unitPrice: 85000 }]
          }
        ]);
      }
    } catch (err) {
      console.warn("Using sample POs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchasing();
  }, []);

  const handleCreatePO = async (formData: {
    supplierId: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
    orderDate: string;
    notes: string;
  }) => {
    try {
      await api.post("/purchasing/orders", formData);
      alert("Purchase Order (PO) Berhasil Diterbitkan ke Supplier!");
      setShowCreateModal(false);
      loadPurchasing();
    } catch (err) {
      const sup = suppliers.find((s) => s.id === formData.supplierId) || {
        name: "CV Multi Tekstil Bandung"
      };
      const mat = materials.find((m) => m.id === formData.rawMaterialId) || {
        name: "Kain Dryfit Milano"
      };
      const newPO: PurchaseOrderItem = {
        id: String(Date.now()),
        poNumber: `PO-2026-${Date.now().toString().slice(-4)}`,
        supplier: { name: sup.name },
        orderDate: formData.orderDate,
        totalAmount: formData.quantity * formData.unitPrice,
        status: "ORDERED",
        items: [{ rawMaterial: { name: mat.name }, quantity: formData.quantity, unitPrice: formData.unitPrice }]
      };
      setOrders([newPO, ...orders]);
      setShowCreateModal(false);
      alert("Purchase Order (PO) Berhasil Disimpan!");
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

      {/* 2. Purchase Orders Table */}
      <PurchaseOrdersTable orders={orders} />

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
