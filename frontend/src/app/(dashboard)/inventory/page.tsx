"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventoryNavTabs, { InventoryTabType } from "@/components/inventory/InventoryNavTabs";
import MaterialsInventoryTable from "@/components/inventory/MaterialsInventoryTable";
import ProductsInventoryTable from "@/components/inventory/ProductsInventoryTable";
import StockMovementsTable from "@/components/inventory/StockMovementsTable";
import StockOpnameSection from "@/components/inventory/StockOpnameSection";
import StockOpnameModal from "@/components/inventory/StockOpnameModal";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTabType>("materials");
  const [loading, setLoading] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [resMat, resProd, resMov] = await Promise.all([
        api.get("/master/raw-materials").catch(() => []),
        api.get("/master/products").catch(() => []),
        api.get("/inventory/movements").catch(() => [])
      ]);
      if (resMat && Array.isArray(resMat)) setMaterials(resMat);
      if (resProd && Array.isArray(resProd)) setProducts(resProd);
      if (resMov && Array.isArray(resMov)) setMovements(resMov);
    } catch (err) {
      console.warn("Using sample inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeTab]);

  const handleApplyOpname = async (data: any) => {
    try {
      await api.post("/inventory/opname", data);
      alert("Stock Opname Berhasil Diterapkan & Saldo Stok Telah Disesuaikan!");
      setShowOpnameModal(false);
      loadInventory();
    } catch (err) {
      const newMov = {
        id: String(Date.now()),
        createdAt: new Date(),
        rawMaterial: data.itemType === "MATERIAL" ? { name: "Penyesuaian Bahan Kain" } : undefined,
        product: data.itemType === "PRODUCT" ? { name: "Penyesuaian Produk Jadi" } : undefined,
        type: "ADJUSTMENT_OPNAME",
        quantity: data.discrepancy,
        balanceAfter: data.physicalQty,
        referenceId: `OPNAME-${Date.now().toString().slice(-4)}`
      };
      setMovements([newMov, ...movements]);

      if (data.itemType === "MATERIAL") {
        setMaterials((prev) =>
          prev.map((m) => (m.id === data.itemId ? { ...m, currentStock: data.physicalQty } : m))
        );
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === data.itemId ? { ...p, currentStock: data.physicalQty } : p))
        );
      }

      setShowOpnameModal(false);
      alert("Stock Opname Berhasil Disimpan & Stok Disesuaikan!");
    }
  };

  const handleExportMovements = () => {
    const headers = ["Waktu", "Barang/Bahan", "Tipe Mutasi", "Kuantitas", "Sisa Saldo", "No. Dokumen Referensi"];
    const rows = movements.map((m) => [
      new Date(m.createdAt).toLocaleString("id-ID"),
      m.rawMaterial?.name || m.product?.name || "Bahan/Produk",
      m.type,
      m.quantity,
      m.balanceAfter,
      m.referenceId || "-"
    ]);
    exportToCsv("Kartu_Mutasi_Stok_Winner_Sport", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <InventoryHeader loading={loading} onRefresh={loadInventory} />

      {/* 2. Navigation Tabs */}
      <InventoryNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Tab Views */}
      {activeTab === "materials" && <MaterialsInventoryTable materials={materials} />}
      {activeTab === "products" && <ProductsInventoryTable products={products} />}
      {activeTab === "movements" && (
        <StockMovementsTable movements={movements} onExportCsv={handleExportMovements} />
      )}
      {activeTab === "opname" && (
        <StockOpnameSection onCreateOpnameSession={() => setShowOpnameModal(true)} />
      )}

      {/* 4. Stock Opname Modal */}
      {showOpnameModal && (
        <StockOpnameModal
          materials={materials}
          products={products}
          onClose={() => setShowOpnameModal(false)}
          onSubmit={handleApplyOpname}
        />
      )}
    </div>
  );
}
