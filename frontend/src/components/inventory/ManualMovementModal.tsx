"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

export interface StockItem { id: string; name: string; sku?: string; currentStock: number; unit?: { symbol: string } }
export interface MovementSelection { itemType: "RAW_MATERIAL" | "PRODUCT"; itemId?: string; direction: "IN" | "OUT" }

export default function ManualMovementModal({ selection, materials, products, onClose, onSaved }: {
  selection: MovementSelection; materials: StockItem[]; products: StockItem[]; onClose: () => void; onSaved: () => void;
}) {
  const items = selection.itemType === "RAW_MATERIAL" ? materials : products;
  const [itemId, setItemId] = useState(selection.itemId || "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const item = items.find((entry) => entry.id === itemId);
  const unit = selection.itemType === "PRODUCT" ? "pcs" : item?.unit?.symbol || "satuan dasar";
  const qty = Number(quantity);
  const balance = Number(item?.currentStock || 0) + (selection.direction === "IN" ? qty : -qty);
  const field = "w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900";

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <form role="dialog" aria-modal="true" aria-labelledby="movement-title" onSubmit={async (event) => {
      event.preventDefault();
      if (pending.current) return;
      if (!item || !Number.isFinite(qty) || qty <= 0 || balance < 0 || !notes.trim()) { setError("Pilih barang, isi jumlah positif dan alasan. Stok akhir tidak boleh negatif."); return; }
      pending.current = true; setSaving(true); setError("");
      try {
        await api.post("/inventory/movements/manual", { itemType: selection.itemType,
          [selection.itemType === "RAW_MATERIAL" ? "rawMaterialId" : "productId"]: itemId,
          quantity: selection.direction === "IN" ? qty : -qty, notes: notes.trim() });
        onSaved();
      } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan mutasi."); }
      finally { pending.current = false; setSaving(false); }
    }} className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 text-sm shadow-xl dark:bg-[#0d1424]">
      <h2 id="movement-title" className="text-lg font-bold">{selection.direction === "IN" ? "Stok Masuk" : "Stok Keluar"} · Penyesuaian Manual</h2>
      <p className="text-xs leading-relaxed text-slate-500">Untuk koreksi di luar transaksi rutin. Penerimaan supplier, hasil produksi, dan penjualan dicatat melalui dokumen modul terkait agar tidak terhitung dua kali.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
      <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
        <label className="block space-y-1"><span>Barang</span><select autoFocus required value={itemId} onChange={(event) => setItemId(event.target.value)} className={field}><option value="">Pilih barang</option>{items.map((entry) => <option key={entry.id} value={entry.id}>{entry.sku} · {entry.name}</option>)}</select></label>
        <label className="block space-y-1"><span>Jumlah ({unit})</span><input type="number" min={selection.itemType === "PRODUCT" ? 1 : 0.01} step={selection.itemType === "PRODUCT" ? 1 : 0.01} required value={quantity} onChange={(event) => setQuantity(event.target.value)} className={field} /></label>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">Stok sekarang: <strong>{item ? Number(item.currentStock) : "—"} {unit}</strong><br />Stok setelah disimpan: <strong className={balance < 0 ? "text-red-600" : ""}>{item ? balance.toFixed(selection.itemType === "PRODUCT" ? 0 : 2) : "—"} {unit}</strong></div>
        <label className="block space-y-1"><span>Alasan / referensi</span><textarea required value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: koreksi saldo awal, barang rusak, atau temuan gudang" className={field} /></label>
      </fieldset>
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-50">Batal</button><button disabled={saving || !item || balance < 0} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Mutasi"}</button></div>
    </form>
  </div>;
}
