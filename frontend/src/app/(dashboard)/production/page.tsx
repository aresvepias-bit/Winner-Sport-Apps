"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DatabaseZap } from "lucide-react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import { kontenBerganti } from "@/lib/motion";
import ErrorBanner from "@/components/common/ErrorBanner";
import ProductionHeader from "@/components/production/ProductionHeader";
import WorkOrdersTable, { WorkOrder, STATUS_SPK, persenBahanKeluar } from "@/components/production/WorkOrdersTable";
import WorkOrderFilters, { FILTER_SPK_KOSONG, SpkFilterState } from "@/components/production/WorkOrderFilters";
import ProductionSummary from "@/components/production/ProductionSummary";
import WorkOrderProcessDrawer, { PengeluaranBahan } from "@/components/production/WorkOrderProcessDrawer";
import CompleteWorkOrderModal from "@/components/production/CompleteWorkOrderModal";
import CreateWorkOrderModal from "@/components/production/CreateWorkOrderModal";
import PrintSpkModal from "@/components/print/PrintSpkModal";

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sudahDimuat, setSudahDimuat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [filter, setFilter] = useState<SpkFilterState>(FILTER_SPK_KOSONG);
  const [woDiproses, setWoDiproses] = useState<WorkOrder | null>(null);

  // Tidak ada useEffect pemuat: halaman terbuka seketika, data ditarik saat
  // tombol Proses ditekan.
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
      setSudahDimuat(true);
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const woTersaring = useMemo(() => {
    const kata = filter.cari.trim().toLowerCase();
    return workOrders.filter((wo) => {
      if (filter.productId !== "SEMUA" && wo.productId !== filter.productId) return false;

      if (filter.status === "BELUM_SELESAI") {
        if (wo.status === "COMPLETED" || wo.status === "CANCELLED") return false;
      } else if (filter.status !== "SEMUA" && wo.status !== filter.status) {
        return false;
      }

      if (!kata) return true;
      return `${wo.woNumber} ${wo.product?.name || ""} ${wo.notes || ""}`.toLowerCase().includes(kata);
    });
  }, [workOrders, filter]);

  const handleOpenPrint = (wo: WorkOrder) => {
    setWoDiproses(null);
    setSelectedWO(wo);
    setShowPrintModal(true);
  };

  const handleOpenComplete = (wo: WorkOrder) => {
    setWoDiproses(null);
    setSelectedWO(wo);
    setShowCompleteModal(true);
  };

  const handleExportSPK = () => {
    const headers = [
      "No. SPK",
      "Produk Target",
      "Target Qty",
      "Hasil Jadi",
      "Reject/Scrap",
      "Bahan Keluar (%)",
      "Biaya Bahan (Rp)",
      "HPP Aktual / pcs (Rp)",
      "Tenggat Waktu",
      "Status",
      "Catatan"
    ];
    // Yang diekspor adalah baris yang sedang tampil, agar cocok dengan filter di layar.
    const rows = woTersaring.map((wo) => [
      wo.woNumber,
      wo.product?.name || "-",
      wo.targetQty,
      wo.completedQty,
      wo.scrapQty ?? 0,
      persenBahanKeluar(wo),
      wo.materialCost,
      wo.hppPerPcs ?? 0,
      new Date(wo.dueDate).toLocaleDateString("id-ID"),
      STATUS_SPK[wo.status]?.label || wo.status,
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

  const handleKeluarkanBahan = async (materials: PengeluaranBahan[]) => {
    if (!woDiproses) return;
    // Error dilempar kembali agar panel yang menampilkannya; panel hanya
    // ditutup kalau penyimpanan benar-benar berhasil.
    const hasil = await api.post(`/production/work-orders/${woDiproses.id}/issue-materials`, { materials });
    setWoDiproses(null);
    await loadWorkOrders();
    alert(hasil?.message || "Bahan berhasil dikeluarkan ke produksi.");
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

      {/* 2. Filter daftar SPK */}
      <WorkOrderFilters
        nilai={filter}
        onChange={setFilter}
        products={products}
        jumlahTampil={woTersaring.length}
        jumlahTotal={workOrders.length}
        tampilkanJumlah={sudahDimuat}
      />

      <AnimatePresence mode="wait">
        {!sudahDimuat ? (
          <motion.div
            key="belum"
            variants={kontenBerganti}
            initial="awal"
            animate="masuk"
            exit="keluar"
            className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]"
          >
            <DatabaseZap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-3 text-base font-bold">Data belum diambil</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Atur filter di atas bila perlu, lalu tekan Proses untuk mengambil daftar SPK dari server.
            </p>
            <button
              type="button"
              onClick={loadWorkOrders}
              disabled={loading}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DatabaseZap className="h-4 w-4" />
              {loading ? "Memuat data..." : "Proses & Tampilkan Data"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="daftar"
            variants={kontenBerganti}
            initial="awal"
            animate="masuk"
            exit="keluar"
            className="space-y-6"
          >
            {/* 3. Ringkasan produksi */}
            <ProductionSummary workOrders={workOrders} />

            {/* 4. Daftar SPK */}
            <WorkOrdersTable
              workOrders={woTersaring}
              onProses={setWoDiproses}
              onExportCsv={handleExportSPK}
              resetKey={`${filter.cari}|${filter.status}|${filter.productId}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Panel proses satu SPK: rincian, bahan, cetak, selesaikan */}
      <AnimatePresence>
        {woDiproses && (
          <WorkOrderProcessDrawer
            workOrder={woDiproses}
            onClose={() => setWoDiproses(null)}
            onCetak={handleOpenPrint}
            onSelesaikan={handleOpenComplete}
            onKeluarkanBahan={handleKeluarkanBahan}
          />
        )}
      </AnimatePresence>

      {/* 6. Create Work Order Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSPK}
        />
      )}

      {/* 7. Complete Work Order & Calculate HPP Modal */}
      {showCompleteModal && selectedWO && (
        <CompleteWorkOrderModal
          workOrder={selectedWO}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleCompleteSubmit}
        />
      )}

      {/* 8. Print SPK Modal */}
      {showPrintModal && selectedWO && (
        <PrintSpkModal
          workOrder={selectedWO}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
