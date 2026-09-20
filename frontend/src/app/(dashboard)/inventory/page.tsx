"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
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
  const [loadError, setLoadError] = useState("");
  const [showOpnameModal, setShowOpnameModal] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  const loadInventory = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [resMat, resProd, resMov] = await Promise.all([
        api.get("/master/raw-materials"),
        api.get("/master/products"),
        api.get("/inventory/movements")
      ]);
      setMaterials(Array.isArray(resMat) ? resMat : []);
      setProducts(Array.isArray(resProd) ? resProd : []);
      setMovements(Array.isArray(resMov) ? resMov : []);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeTab]);

  const handleApplyOpname = async (data: any) => {
    const isMaterial = data.itemType === "MATERIAL";
    try {
      // Backend: buat sesi opname (DRAFT) lalu terapkan agar stok & mutasi ikut berubah.
      const opname = await api.post("/inventory/opname", {
        itemType: isMaterial ? "RAW_MATERIAL" : "PRODUCT",
        notes: data.notes,
        items: [
          {
            [isMaterial ? "rawMaterialId" : "productId"]: data.itemId,
            systemQty: data.systemQty,
            physicalQty: data.physicalQty,
            notes: data.notes
          }
        ]
      });
      await api.post(`/inventory/opname/${opname.id}/apply`);
      alert("Stock Opname Berhasil Diterapkan & Saldo Stok Telah Disesuaikan!");
      setShowOpnameModal(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || "Gagal menerapkan Stock Opname. Stok belum berubah.");
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

  const handleExportMaterials = () => {
    const headers = ["SKU", "Nama Bahan", "Stok Saat Ini", "Satuan", "Stok Minimum", "Nilai Per Satuan (Rp)", "Total Nilai Stok (Rp)", "Status"];
    const rows = materials.map((m) => [
      m.sku,
      m.name,
      Number(m.currentStock),
      m.unit?.symbol || "kg",
      Number(m.minimumStock),
      Number(m.standardCost),
      Number(m.currentStock) * Number(m.standardCost),
      Number(m.currentStock) <= Number(m.minimumStock) ? "Perlu Restock" : "Cukup"
    ]);
    exportToCsv("Persediaan_Bahan_Baku_Winner_Sport", headers, rows);
  };

  const handleExportProducts = () => {
    const headers = ["SKU", "Nama Produk", "Stok (Pcs)", "Kodi", "Sisa Pcs", "HPP Per Pcs (Rp)", "Nilai HPP Persediaan (Rp)"];
    const rows = products.map((p) => [
      p.sku,
      p.name,
      Number(p.currentStock),
      Math.floor(Number(p.currentStock) / 20),
      Number(p.currentStock) % 20,
      Number(p.standardCost),
      Number(p.currentStock) * Number(p.standardCost)
    ]);
    exportToCsv("Persediaan_Produk_Jadi_Winner_Sport", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <InventoryHeader loading={loading} onRefresh={loadInventory} />

      <ErrorBanner message={loadError} onRetry={loadInventory} />

      {/* 2. Navigation Tabs */}
      <InventoryNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Tab Views */}
      {activeTab === "materials" && (
        <MaterialsInventoryTable materials={materials} onExportCsv={handleExportMaterials} />
      )}
      {activeTab === "products" && (
        <ProductsInventoryTable products={products} onExportCsv={handleExportProducts} />
      )}
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
