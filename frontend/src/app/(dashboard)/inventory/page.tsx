"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { exportToCsv } from "@/lib/exportUtils";
import { Settings2 } from "lucide-react";
import ErrorBanner from "@/components/common/ErrorBanner";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventoryNavTabs, { INVENTORY_MENUS, InventoryTabType } from "@/components/inventory/InventoryNavTabs";
import MaterialsInventoryTable from "@/components/inventory/MaterialsInventoryTable";
import ProductsInventoryTable from "@/components/inventory/ProductsInventoryTable";
import StockMovementsTable from "@/components/inventory/StockMovementsTable";
import StockOpnameSection from "@/components/inventory/StockOpnameSection";
import ManualMovementModal, { MovementSelection } from "@/components/inventory/ManualMovementModal";
import StockOpnameModal from "@/components/inventory/StockOpnameModal";

/** Data apa saja yang benar-benar dibutuhkan tiap menu. */
const KEBUTUHAN: Record<InventoryTabType, Array<"materials" | "products" | "movements" | "opnames">> = {
  materials: ["materials"],
  products: ["products"],
  movements: ["movements"],
  opname: ["opnames"]
};

export default function InventoryPage() {
  // null = halaman baru dibuka, belum ada menu dipilih, jadi belum ada data diambil.
  const [activeTab, setActiveTab] = useState<InventoryTabType | null>(null);
  const activeMenu = INVENTORY_MENUS.find((menu) => menu.key === activeTab);
  const ActiveIcon = activeMenu?.icon;
  const [manual, setManual] = useState<MovementSelection | null>(null);
  const [opnames, setOpnames] = useState<any[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const applyingRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [movementFilter, setMovementFilter] = useState<{ itemType: "RAW_MATERIAL" | "PRODUCT"; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showOpnameModal, setShowOpnameModal] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  const loadRequest = useRef(0);
  // Data yang sudah pernah diambil, supaya kembali ke menu yang sama tidak menembak ulang.
  const sudahDimuat = useRef(new Set<string>());

  /**
   * Mengambil hanya data yang diminta. Sebelumnya membuka halaman ini langsung
   * menembak empat endpoint sekaligus (termasuk sampai 1.000 baris mutasi),
   * padahal yang ditampilkan cuma satu menu.
   */
  const ambilData = async (perlu: Array<"materials" | "products" | "movements" | "opnames">, paksa = false) => {
    const kurang = paksa ? perlu : perlu.filter((k) => !sudahDimuat.current.has(k));
    if (kurang.length === 0) return;

    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    try {
      const hasil = await Promise.all(
        kurang.map((k) => {
          if (k === "materials") return api.get("/master/raw-materials");
          if (k === "products") return api.get("/master/products");
          if (k === "opnames") return api.get("/inventory/opname");
          const filter = movementFilter
            ? `&itemType=${movementFilter.itemType}&itemId=${encodeURIComponent(movementFilter.id)}`
            : "";
          return api.get(`/inventory/movements?limit=1000${filter}`);
        })
      );
      if (request !== loadRequest.current) return;

      kurang.forEach((k, i) => {
        const data = Array.isArray(hasil[i]) ? hasil[i] : [];
        if (k === "materials") setMaterials(data);
        else if (k === "products") setProducts(data);
        else if (k === "opnames") setOpnames(data);
        else setMovements(data);
        sudahDimuat.current.add(k);
      });
    } catch (err: any) {
      if (request === loadRequest.current) setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  /** Menu dipilih: baru saat inilah datanya diambil. */
  const pilihMenu = (tab: InventoryTabType) => {
    setActiveTab(tab);
    void ambilData(KEBUTUHAN[tab]);
  };

  /** Modal mutasi & opname butuh daftar bahan sekaligus produk. */
  const bukaModal = async (aksi: () => void) => {
    await ambilData(["materials", "products"]);
    aksi();
  };

  /** Segarkan hanya data menu yang sedang dibuka. */
  const loadInventory = async () => {
    if (!activeTab) return;
    await ambilData(KEBUTUHAN[activeTab], true);
  };

  // Kartu stok difilter per barang: isinya berubah, jadi harus diambil ulang.
  useEffect(() => {
    if (activeTab !== "movements") return;
    void ambilData(["movements"], true);
  }, [movementFilter]);

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
      setNotice(`Draft ${opname.opnameNumber} tersimpan. Periksa hasil hitung lalu terapkan dari daftar opname.`);
      setShowOpnameModal(false);
      sudahDimuat.current.delete("opnames");
      pilihMenu("opname");
    } catch (err: any) {
      alert(err.message || "Gagal menerapkan Stock Opname. Stok belum berubah.");
    }
  };

  const applyOpname = async (id: string) => {
    if (applyingRef.current || !window.confirm("Terapkan hasil opname? Saldo stok akan disesuaikan dan mutasi dicatat.")) return;
    applyingRef.current = true; setApplying(id); setLoadError("");
    try { await api.post(`/inventory/opname/${id}/apply`); setNotice("Opname diterapkan dan mutasi tercatat."); await loadInventory(); }
    catch (err) { setLoadError(err instanceof Error ? err.message : "Gagal menerapkan opname."); }
    finally { applyingRef.current = false; setApplying(null); }
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

      {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Tutup pemberitahuan">?</button></div>}
      <ErrorBanner message={loadError} onRetry={loadInventory} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[248px_minmax(0,1fr)]">
      <InventoryNavTabs activeTab={activeTab} onTabChange={pilihMenu} />

      <section aria-labelledby="active-inventory-heading" className="min-w-0 space-y-5">
        {!activeMenu || !ActiveIcon ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]">
            <Settings2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h2 id="active-inventory-heading" className="mt-3 text-base font-bold">Pilih menu gudang</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Data baru diambil setelah menu dipilih, jadi halaman ini terbuka seketika.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {INVENTORY_MENUS.map((menu) => {
                const Icon = menu.icon;
                return (
                  <button
                    key={menu.key}
                    onClick={() => pilihMenu(menu.key)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-[#1a2236] dark:bg-[#141b2d] dark:text-slate-300 dark:hover:border-red-500/30"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {menu.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
        <>
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-2xl border border-red-100 bg-red-50 p-3 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{activeMenu.group}</p>
            <h2 id="active-inventory-heading" className="text-xl font-bold tracking-tight">{activeMenu.label}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeMenu.description}</p>
          </div>
        </div>
      {(activeTab === "materials" || activeTab === "products") && <div className="flex flex-wrap gap-2">
        <button disabled={loading} onClick={() => void bukaModal(() => setManual({ itemType: activeTab === "materials" ? "RAW_MATERIAL" : "PRODUCT", direction: "IN" }))} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">+ Stok Masuk</button>
        <button disabled={loading} onClick={() => void bukaModal(() => setManual({ itemType: activeTab === "materials" ? "RAW_MATERIAL" : "PRODUCT", direction: "OUT" }))} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold dark:border-slate-700 disabled:opacity-50">? Stok Keluar</button>
        <button onClick={() => void bukaModal(() => setShowOpnameModal(true))} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold dark:border-slate-700">Hitung Fisik / Opname</button>
      </div>}
      {activeTab === "movements" && <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500"><span>{movementFilter ? `Kartu stok: ${movementFilter.name}` : "Seluruh barang"} ? Maksimal 1.000 mutasi terbaru</span>{movementFilter && <button onClick={() => setMovementFilter(null)} className="font-bold text-red-600">Tampilkan semua barang</button>}</div>}
      {activeTab === "materials" && (
        <MaterialsInventoryTable materials={materials} onMovement={(id, direction) => void bukaModal(() => setManual({ itemType: "RAW_MATERIAL", itemId: id, direction }))} onViewLedger={(id, name) => { setMovementFilter({ itemType: "RAW_MATERIAL", id, name }); pilihMenu("movements"); }} onExportCsv={handleExportMaterials} />
      )}
      {activeTab === "products" && (
        <ProductsInventoryTable products={products} onMovement={(id, direction) => void bukaModal(() => setManual({ itemType: "PRODUCT", itemId: id, direction }))} onViewLedger={(id, name) => { setMovementFilter({ itemType: "PRODUCT", id, name }); pilihMenu("movements"); }} onExportCsv={handleExportProducts} />
      )}
      {activeTab === "movements" && (
        <StockMovementsTable movements={movements} onExportCsv={handleExportMovements} />
      )}
      {activeTab === "opname" && (
        <StockOpnameSection opnames={opnames} applying={applying} onApply={applyOpname} onCreateOpnameSession={() => void bukaModal(() => setShowOpnameModal(true))} />
      )}
        </>
        )}
      </section>
      </div>

      {manual && <ManualMovementModal selection={manual} materials={materials} products={products} onClose={() => setManual(null)} onSaved={() => { setManual(null); setNotice("Mutasi tersimpan dan saldo stok diperbarui."); void loadInventory(); }} />}
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
