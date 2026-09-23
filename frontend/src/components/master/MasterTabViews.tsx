"use client";

import RawMaterialsTable from "@/components/master/RawMaterialsTable";
import ProductsTable from "@/components/master/ProductsTable";
import BomCardsGrid from "@/components/master/BomCardsGrid";
import ContactsTable from "@/components/master/ContactsTable";
import EmployeesTable from "@/components/master/EmployeesTable";
import UnitsTable from "@/components/master/UnitsTable";
import SalesTypesTable from "@/components/master/SalesTypesTable";
import type { MasterEntity } from "@/components/master/masterEntities";

interface MasterTabViewsProps {
  activeTab: MasterEntity;
  /** Baris yang sudah disaring MasterFilterBar. */
  rows: any[];
  /** Berubah saat filter berubah, supaya paginasi kembali ke halaman 1. */
  resetKey: string;
  /** Ubah dan hapus tidak lagi di baris; keduanya ada di panel Proses. */
  onProses: (item: any) => void;
}

/** Menampilkan tabel/grid sesuai tab aktif; tiap baris punya tombol Proses. */
export default function MasterTabViews({
  activeTab,
  rows,
  resetKey,
  onProses
}: MasterTabViewsProps) {
  switch (activeTab) {
    case "materials":
      return <RawMaterialsTable materials={rows} onProses={onProses} resetKey={resetKey} />;
    case "products":
      return <ProductsTable products={rows} onProses={onProses} resetKey={resetKey} />;
    case "boms":
      return <BomCardsGrid boms={rows} onProses={onProses} />;
    case "contacts":
      // Kontak tidak muncul sebagai menu Master; dikelola lewat halaman
      // Customer dan Supplier yang memakai tabel yang sama.
      return <ContactsTable contacts={rows} onProses={onProses} resetKey={resetKey} />;
    case "units":
      return <UnitsTable units={rows} onProses={onProses} resetKey={resetKey} />;
    case "salesTypes":
      return <SalesTypesTable salesTypes={rows} onProses={onProses} resetKey={resetKey} />;
    case "employees":
      return <EmployeesTable employees={rows} onProses={onProses} resetKey={resetKey} />;
  }
}
