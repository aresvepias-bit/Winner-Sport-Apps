"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { backdropModal, panelModal } from "@/lib/motion";
import type { MasterEntity, EditableEntity } from "@/components/master/masterEntities";

/**
 * Panel "Proses" untuk satu baris master: menampilkan seluruh isian yang tidak
 * muat di tabel, lalu tindakan ubah dan hapus di satu tempat.
 */

interface Baris {
  label: string;
  nilai: string;
}

const rupiah = (v: any) => formatRupiah(Number(v) || 0);
const angka = (v: any) => formatNumber(Number(v) || 0);
const teks = (v: any) => (v === undefined || v === null || v === "" ? "-" : String(v));
const statusAktif = (v: any) => (v === false ? "Nonaktif" : "Aktif");

const RINCIAN: Record<MasterEntity, (row: any) => Baris[]> = {
  materials: (m) => [
    { label: "Kode SKU", nilai: teks(m.sku) },
    { label: "Kategori", nilai: teks(m.category?.name) },
    { label: "Satuan", nilai: teks(m.unit?.symbol) },
    { label: "Stok saat ini", nilai: `${angka(m.currentStock)} ${m.unit?.symbol || ""}`.trim() },
    { label: "Stok minimum", nilai: `${angka(m.minimumStock)} ${m.unit?.symbol || ""}`.trim() },
    { label: "Harga standar", nilai: rupiah(m.standardCost) },
    { label: "Nilai persediaan", nilai: rupiah(Number(m.currentStock) * Number(m.standardCost)) },
    { label: "Keterangan", nilai: teks(m.description) }
  ],
  products: (p) => [
    { label: "Kode SKU", nilai: teks(p.sku) },
    { label: "Stok siap jual", nilai: angka(p.currentStock) },
    { label: "Stok minimum", nilai: angka(p.minimumStock) },
    { label: "HPP standar", nilai: rupiah(p.standardCost) },
    { label: "Harga satuan", nilai: rupiah(p.priceSatuan) },
    { label: "Harga grosir", nilai: rupiah(p.priceGrosir) },
    { label: "Harga kodi", nilai: rupiah(p.priceKodi) },
    { label: "Keterangan", nilai: teks(p.description) }
  ],
  boms: (b) => [
    { label: "Produk", nilai: teks(b.product?.name || b.targetProduct) },
    { label: "Versi", nilai: teks(b.version) },
    { label: "Jumlah komponen", nilai: `${(b.items || []).length} bahan` },
    {
      label: "Komponen",
      nilai:
        (b.items || [])
          .map((i: any) => `${i.rawMaterial?.name || i.materialName || "Bahan"} ${angka(i.quantity)}`)
          .join(", ") || "-"
    }
  ],
  contacts: (c) => [
    { label: "Jenis rekanan", nilai: teks(c.type) },
    { label: "Perusahaan", nilai: teks(c.companyName) },
    { label: "Telepon", nilai: teks(c.phone) },
    { label: "Alamat", nilai: teks(c.address) },
    { label: "Termin pembayaran", nilai: `${Number(c.paymentTerm) || 0} hari` }
  ],
  employees: (e) => [
    { label: "Jabatan", nilai: teks(e.role) },
    { label: "Jenis upah", nilai: teks(e.wageType) },
    { label: "Upah per pcs", nilai: rupiah(e.ratePerPcs) },
    { label: "Gaji pokok", nilai: rupiah(e.baseSalary) },
    { label: "Telepon", nilai: teks(e.phone) },
    { label: "Status", nilai: statusAktif(e.isActive) }
  ],
  units: (u) => [
    { label: "Simbol", nilai: teks(u.symbol) },
    { label: "Setara", nilai: `${angka(u.ratioToPcs ?? 1)} pcs` },
    { label: "Keterangan", nilai: teks(u.description) },
    { label: "Status", nilai: statusAktif(u.isActive) }
  ],
  salesTypes: (s) => [
    { label: "Kode", nilai: teks(s.code) },
    { label: "Urutan tampil", nilai: teks(s.sortOrder) },
    { label: "Keterangan", nilai: teks(s.description) },
    { label: "Status", nilai: statusAktif(s.isActive) }
  ]
};

interface Props {
  entity: MasterEntity;
  item: any;
  onClose: () => void;
  onEdit?: (entity: EditableEntity, item: any) => void;
  onDelete: (entity: MasterEntity, id: string, name: string) => void;
}

export default function MasterRowDrawer({ entity, item, onClose, onEdit, onDelete }: Props) {
  // BOM tidak bisa diubah lewat modal; formulanya dibuat dari spesifikasi produk.
  const bisaUbah = entity !== "boms" && !!onEdit;
  const nama = item.name || item.sku || "Data master";
  const rincian = RINCIAN[entity](item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        variants={backdropModal}
        initial="awal"
        animate="masuk"
        exit="keluar"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
      />
      <motion.div
        variants={panelModal}
        initial="awal"
        animate="masuk"
        exit="keluar"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1a2236] dark:bg-[#0d1424]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-[#1a2236]">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              Proses Data Master
            </p>
            <h2 className="truncate text-lg font-black text-slate-900 dark:text-white">{nama}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Tutup"
            className="cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="divide-y divide-slate-100 overflow-y-auto p-6 text-xs dark:divide-[#1a2236]/60">
          {rincian.map((b) => (
            <div key={b.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0">
              <dt className="shrink-0 text-slate-500 dark:text-slate-400">{b.label}</dt>
              <dd className="text-right font-semibold text-slate-900 dark:text-slate-200">{b.nilai}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-6 sm:flex-row sm:justify-end dark:border-[#1a2236]">
          {bisaUbah && (
            <button
              type="button"
              onClick={() => onEdit!(entity as EditableEntity, item)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Ubah Data
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(entity, item.id, nama)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      </motion.div>
    </div>
  );
}
