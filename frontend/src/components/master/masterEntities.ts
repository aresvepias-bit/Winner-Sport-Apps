import type { MasterTabType } from "@/components/master/MasterNavTabs";

// Kontak tetap memakai CRUD master, tetapi dikelola melalui halaman Customer/Supplier.
export type MasterEntity = MasterTabType | "contacts";
/** Entitas yang bisa ditambah/diubah lewat modal (BOM hanya bisa dihapus). */
export type EditableEntity = Exclude<MasterEntity, "boms">;

interface EntityConfig {
  path: string;
  created?: string;
  createFail?: string;
  updated?: string;
  updateFail?: string;
  deleteConfirm: (name: string) => string;
  deleted: string;
  deleteFail: string;
}

export const MASTER_ENTITIES: Record<MasterEntity, EntityConfig> = {
  materials: {
    path: "/master/raw-materials",
    created: "Bahan Baku Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah bahan baku",
    updated: "Data Bahan Baku Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui bahan baku",
    deleteConfirm: (name) => `Apakah Anda yakin ingin menghapus bahan baku "${name}"? Tindakan ini permanen.`,
    deleted: "Bahan baku berhasil dihapus!",
    deleteFail: "Gagal menghapus bahan baku"
  },
  products: {
    path: "/master/products",
    created: "Produk Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah produk",
    updated: "Data Produk Pakaian Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui produk",
    deleteConfirm: (name) => `Apakah Anda yakin ingin menghapus model pakaian "${name}"? Tindakan ini permanen.`,
    deleted: "Produk pakaian berhasil dihapus!",
    deleteFail: "Gagal menghapus produk"
  },
  boms: {
    path: "/master/boms",
    deleteConfirm: (name) => `Apakah Anda yakin ingin menghapus formula BOM "${name}"? Tindakan ini permanen.`,
    deleted: "Formula BOM berhasil dihapus!",
    deleteFail: "Gagal menghapus formula BOM"
  },
  contacts: {
    path: "/master/contacts",
    created: "Rekanan Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah rekanan",
    updated: "Data Rekanan Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui rekanan",
    deleteConfirm: (name) => `Apakah Anda yakin ingin menghapus rekanan "${name}"? Tindakan ini permanen.`,
    deleted: "Kontak rekanan berhasil dihapus!",
    deleteFail: "Gagal menghapus kontak rekanan"
  },
  units: {
    path: "/master/units",
    created: "Satuan Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah satuan",
    updated: "Data Satuan Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui satuan",
    deleteConfirm: (name) => `Hapus satuan "${name}"? Bila masih dipakai item master, satuan hanya dinonaktifkan.`,
    deleted: "Satuan berhasil dihapus!",
    deleteFail: "Gagal menghapus satuan"
  },
  salesTypes: {
    path: "/master/sales-types",
    created: "Tipe Penjualan Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah tipe penjualan",
    updated: "Tipe Penjualan Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui tipe penjualan",
    deleteConfirm: (name) => `Hapus tipe penjualan "${name}"? Bila sudah dipakai order, tipe hanya dinonaktifkan.`,
    deleted: "Tipe penjualan berhasil dihapus!",
    deleteFail: "Gagal menghapus tipe penjualan"
  },
  employees: {
    path: "/master/employees",
    created: "Tenaga Kerja / Karyawan Baru Berhasil Ditambahkan!",
    createFail: "Gagal menambah tenaga kerja",
    updated: "Data Tenaga Kerja Berhasil Diperbarui!",
    updateFail: "Gagal memperbarui data tenaga kerja",
    deleteConfirm: (name) => `Apakah Anda yakin ingin menghapus tenaga kerja "${name}"? Tindakan ini permanen.`,
    deleted: "Data tenaga kerja berhasil dihapus!",
    deleteFail: "Gagal menghapus tenaga kerja"
  }
};

export const CREATE_BUTTON_TEXT: Record<EditableEntity, string> = {
  materials: "Tambah Bahan Baku",
  products: "Tambah Produk Pakaian",
  contacts: "Tambah Rekanan",
  employees: "Tambah Tenaga Kerja",
  units: "Tambah Satuan",
  salesTypes: "Tambah Tipe Penjualan"
};
