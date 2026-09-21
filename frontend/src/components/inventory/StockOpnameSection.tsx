"use client";

import { ClipboardCheck, Plus } from "lucide-react";

interface StockOpnameSectionProps {
  onCreateOpnameSession: () => void;
  opnames: Array<{ id: string; opnameNumber: string; status: string; notes?: string; items: Array<{ id: string; systemQty: number; physicalQty: number; difference: number; rawMaterial?: { name: string; unit?: { symbol: string } }; product?: { name: string } }> }>;
  applying: string | null;
  onApply: (id: string) => void;
}

export default function StockOpnameSection({ onCreateOpnameSession, opnames, applying, onApply }: StockOpnameSectionProps) {
  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-4 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Stock Opname Fisik vs Sistem</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencocokan stok gudang nyata dengan saldo buku secara periodik untuk mencegah selisih dan kerugian.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateOpnameSession}
          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-red-600/20 transition-colors self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          <Plus className="h-4 w-4" /> Buat Sesi Opname
        </button>
      </div>

      {opnames.length > 0 ? <div className="space-y-3">{opnames.map((opname) => <details key={opname.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <summary className="cursor-pointer break-all text-xs font-bold">{opname.opnameNumber} · {opname.status === "APPLIED" ? "Diterapkan" : "Draft"} · {opname.items.length} barang</summary>
        <p className="my-3 text-xs text-slate-500">{opname.notes || "Tanpa catatan"}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr><th className="p-2">Barang</th><th className="p-2">Sistem</th><th className="p-2">Fisik</th><th className="p-2">Selisih</th></tr></thead><tbody>{opname.items.map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2">{item.rawMaterial?.name || item.product?.name || "Barang"} ({item.product ? "pcs" : item.rawMaterial?.unit?.symbol || "satuan dasar"})</td><td className="p-2">{Number(item.systemQty)}</td><td className="p-2">{Number(item.physicalQty)}</td><td className="p-2 font-bold">{Number(item.difference)}</td></tr>)}</tbody></table></div>
        {opname.status === "DRAFT" && <button disabled={applying !== null} onClick={() => onApply(opname.id)} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{applying === opname.id ? "Menerapkan..." : "Terapkan ke Stok"}</button>}
      </details>)}</div> : <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-[#1a2236] rounded-xl bg-slate-50 dark:bg-[#141b2d]/40">
        <ClipboardCheck className="w-10 h-10 mx-auto text-red-600 dark:text-red-400 mb-2 opacity-80" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Cocokkan stok fisik dengan data gudang
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Buat sesi baru untuk menghitung stok fisik kain dan pakaian jadi di gudang.
        </p>
      </div>}
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { title: "Pilih barang", detail: "Tentukan bahan baku atau produk yang akan dihitung." },
          { title: "Hitung stok fisik", detail: "Masukkan jumlah aktual sesuai satuan barang." },
          { title: "Terapkan penyesuaian", detail: "Periksa selisih sebelum memperbarui saldo stok." },
        ].map((step, index) => (
          <li key={step.title} className="rounded-xl border border-slate-100 p-4 dark:border-[#1a2236]">
            <span className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">{index + 1}</span>
            <h3 className="text-xs font-bold">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
