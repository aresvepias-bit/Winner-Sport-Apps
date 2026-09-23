import type { MasterEntity } from "@/components/master/masterEntities";

/**
 * Penyaringan dan ringkasan baris master, dikumpulkan di satu tempat supaya
 * setiap tab memakai aturan yang sama. Sebelumnya tiap tabel punya kotak cari
 * sendiri dengan perilaku berbeda-beda.
 */

export interface MasterFilterState {
  cari: string;
  status: string;
  kategori: string;
}

export const FILTER_MASTER_KOSONG: MasterFilterState = { cari: "", status: "SEMUA", kategori: "SEMUA" };

export interface OpsiStatus {
  label: string;
  opsi: Array<{ value: string; label: string }>;
  cocok: (row: any, value: string) => boolean;
}

const teks = (...bagian: Array<string | number | undefined | null>) =>
  bagian.filter((b) => b !== undefined && b !== null && b !== "").join(" ").toLocaleLowerCase("id");

/** Kolom yang ikut dicari untuk tiap jenis data master. */
const TEKS_CARI: Record<MasterEntity, (row: any) => string> = {
  materials: (m) => teks(m.sku, m.name, m.category?.name, m.unit?.symbol, m.description),
  products: (p) => teks(p.sku, p.name, p.description),
  boms: (b) => teks(b.name, b.product?.name, b.targetProduct, b.version),
  contacts: (c) => teks(c.name, c.companyName, c.phone, c.address, c.type),
  employees: (e) => teks(e.name, e.role, e.wageType, e.phone),
  units: (u) => teks(u.name, u.symbol, u.description),
  salesTypes: (s) => teks(s.code, s.name, s.description)
};

const stokMenipis = (row: any) => Number(row.currentStock) <= Number(row.minimumStock ?? 0);
const aktif = (row: any) => row.isActive !== false;

const STATUS_AKTIF: OpsiStatus = {
  label: "Status",
  opsi: [
    { value: "SEMUA", label: "Semua status" },
    { value: "AKTIF", label: "Aktif" },
    { value: "NONAKTIF", label: "Nonaktif" }
  ],
  cocok: (row, value) => (value === "AKTIF" ? aktif(row) : !aktif(row))
};

const STATUS_STOK: OpsiStatus = {
  label: "Kondisi stok",
  opsi: [
    { value: "SEMUA", label: "Semua kondisi stok" },
    { value: "MENIPIS", label: "Stok menipis" },
    { value: "AMAN", label: "Stok aman" },
    { value: "KOSONG", label: "Stok kosong" }
  ],
  cocok: (row, value) => {
    if (value === "MENIPIS") return stokMenipis(row);
    if (value === "AMAN") return !stokMenipis(row);
    return Number(row.currentStock) <= 0;
  }
};

/** Rekanan tidak punya status aktif; yang membedakan adalah cara bayarnya. */
const STATUS_TERMIN: OpsiStatus = {
  label: "Cara bayar",
  opsi: [
    { value: "SEMUA", label: "Semua cara bayar" },
    { value: "TUNAI", label: "Tunai (bayar langsung)" },
    { value: "TEMPO", label: "Tempo (ada jatuh tempo)" }
  ],
  cocok: (row, value) =>
    value === "TUNAI" ? Number(row.paymentTerm) <= 0 : Number(row.paymentTerm) > 0
};

/** Tab tanpa entri di sini tidak menampilkan dropdown status. */
const STATUS: Partial<Record<MasterEntity, OpsiStatus>> = {
  materials: STATUS_STOK,
  products: STATUS_STOK,
  employees: STATUS_AKTIF,
  units: STATUS_AKTIF,
  salesTypes: STATUS_AKTIF,
  contacts: STATUS_TERMIN
};

/** Pengelompokan kedua, isinya diambil dari data yang sedang dimuat. */
const KATEGORI: Partial<Record<MasterEntity, { label: string; ambil: (row: any) => string }>> = {
  materials: { label: "Kategori bahan", ambil: (m) => m.category?.name || "" },
  employees: { label: "Jenis upah", ambil: (e) => e.wageType || "" },
  contacts: { label: "Jenis rekanan", ambil: (c) => c.type || "" }
};

export function konfigStatus(entity: MasterEntity): OpsiStatus | null {
  return STATUS[entity] || null;
}

export function konfigKategori(entity: MasterEntity): { label: string; ambil: (row: any) => string } | null {
  return KATEGORI[entity] || null;
}

/** Daftar kategori yang benar-benar ada di data, terurut. */
export function opsiKategori(entity: MasterEntity, rows: any[]): string[] {
  const cfg = KATEGORI[entity];
  if (!cfg) return [];
  const unik = new Set<string>();
  rows.forEach((r) => {
    const nilai = cfg.ambil(r);
    if (nilai) unik.add(nilai);
  });
  return [...unik].sort((a, b) => a.localeCompare(b, "id"));
}

export function saringMaster(entity: MasterEntity, rows: any[], filter: MasterFilterState): any[] {
  const kata = filter.cari.trim().toLocaleLowerCase("id");
  const status = STATUS[entity];
  const kategori = KATEGORI[entity];

  return (rows || []).filter((row) => {
    if (kata && !TEKS_CARI[entity](row).includes(kata)) return false;
    if (status && filter.status !== "SEMUA" && !status.cocok(row, filter.status)) return false;
    if (kategori && filter.kategori !== "SEMUA" && kategori.ambil(row) !== filter.kategori) return false;
    return true;
  });
}

export function adaFilterAktif(filter: MasterFilterState): boolean {
  return filter.cari.trim() !== "" || filter.status !== "SEMUA" || filter.kategori !== "SEMUA";
}
