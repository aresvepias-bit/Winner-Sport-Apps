"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import ErrorBanner from "@/components/common/ErrorBanner";
import PurchasingHeader from "@/components/purchasing/PurchasingHeader";
import PurchaseOrdersTable, {
  PurchaseOrderItem,
  persenDiterima,
  STATUS_PO
} from "@/components/purchasing/PurchaseOrdersTable";
import CreatePurchaseOrderModal from "@/components/purchasing/CreatePurchaseOrderModal";
import PurchaseOrderFilters, {
  FILTER_KOSONG,
  PurchaseFilterState
} from "@/components/purchasing/PurchaseOrderFilters";
import PurchasingSummary from "@/components/purchasing/PurchasingSummary";
import ReceiveGoodsModal, { PenerimaanBaris } from "@/components/purchasing/ReceiveGoodsModal";

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<PurchaseFilterState>(FILTER_KOSONG);
  const [poDiproses, setPoDiproses] = useState<PurchaseOrderItem | null>(null);

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

  // Penyaringan dilakukan di sisi klien: daftar PO satu perusahaan konveksi
  // masih kecil, dan hasilnya langsung terasa tanpa bolak-balik ke server.
  const orderTersaring = useMemo(() => {
    const kata = filter.cari.trim().toLowerCase();
    return orders.filter((po) => {
      if (filter.supplierId !== "SEMUA" && po.supplierId !== filter.supplierId) return false;

      if (filter.status === "BELUM_SELESAI") {
        if (po.status === "RECEIVED" || po.status === "CANCELLED") return false;
      } else if (filter.status !== "SEMUA" && po.status !== filter.status) {
        return false;
      }

      if (!kata) return true;
      const bahan = (po.items || []).map((i) => i.rawMaterial?.name || "").join(" ");
      return `${po.poNumber} ${po.supplier?.name || ""} ${bahan}`.toLowerCase().includes(kata);
    });
  }, [orders, filter]);

  const handleExportPO = () => {
    const headers = [
      "No. PO",
      "Tanggal Order",
      "Supplier",
      "Bahan",
      "Qty Dipesan",
      "Qty Diterima",
      "Total Pembelian (Rp)",
      "Progres Terima (%)",
      "Status"
    ];
    // Yang diekspor adalah baris yang sedang tampil, agar cocok dengan filter di layar.
    const rows = orderTersaring.map((po) => [
      po.poNumber,
      new Date(po.orderDate).toLocaleDateString("id-ID"),
      po.supplier?.name || "-",
      po.items?.map((i) => i.rawMaterial?.name).filter(Boolean).join("; ") || "-",
      po.items?.reduce((sum, i) => sum + Number(i.quantity), 0) ?? 0,
      po.items?.reduce((sum, i) => sum + Number(i.receivedQty || 0), 0) ?? 0,
      po.totalAmount,
      persenDiterima(po),
      STATUS_PO[po.status]?.label || po.status
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

  const handleTerimaBarang = async (data: { items: PenerimaanBaris[]; notes: string }) => {
    if (!poDiproses) return;
    // Error sengaja dilempar kembali agar modal yang menampilkannya; halaman
    // hanya menutup modal kalau penyimpanan benar-benar berhasil.
    const hasil = await api.post(`/purchasing/orders/${poDiproses.id}/receive`, data);
    setPoDiproses(null);
    await loadPurchasing();
    alert(hasil?.message || "Penerimaan barang tersimpan.");
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

      {/* 2. Ringkasan status pengadaan */}
      <PurchasingSummary orders={orders} />

      {/* 3. Filter daftar PO */}
      <PurchaseOrderFilters
        nilai={filter}
        onChange={setFilter}
        suppliers={suppliers}
        jumlahTampil={orderTersaring.length}
        jumlahTotal={orders.length}
      />

      {/* 4. Purchase Orders Table */}
      <PurchaseOrdersTable
        orders={orderTersaring}
        onExportCsv={handleExportPO}
        onProses={setPoDiproses}
      />

      {/* 5. Create PO Modal */}
      {showCreateModal && (
        <CreatePurchaseOrderModal
          suppliers={suppliers}
          materials={materials}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePO}
        />
      )}

      {/* 6. Proses penerimaan barang */}
      <AnimatePresence>
        {poDiproses && (
          <ReceiveGoodsModal
            po={poDiproses}
            onClose={() => setPoDiproses(null)}
            onSubmit={handleTerimaBarang}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
