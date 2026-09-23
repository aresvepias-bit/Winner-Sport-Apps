"use client";

import RawMaterialsTable from "@/components/master/RawMaterialsTable";
import ProductsTable from "@/components/master/ProductsTable";
import BomCardsGrid from "@/components/master/BomCardsGrid";
import ContactsTable from "@/components/master/ContactsTable";
import EmployeesTable from "@/components/master/EmployeesTable";
import UnitsTable from "@/components/master/UnitsTable";
import SalesTypesTable from "@/components/master/SalesTypesTable";
import type { MasterEntity, EditableEntity } from "@/components/master/masterEntities";

interface MasterTabViewsProps {
  activeTab: MasterEntity;
  /** Baris yang sudah disaring MasterFilterBar. */
  rows: any[];
  /** Berubah saat filter berubah, supaya paginasi kembali ke halaman 1. */
  resetKey: string;
  onProses: (item: any) => void;
  onEdit: (entity: EditableEntity, item: any) => void;
  onDelete: (entity: MasterEntity, id: string, name: string) => void;
}

/** Menampilkan tabel/grid sesuai tab aktif; tiap baris punya tombol Proses. */
export default function MasterTabViews({
  activeTab,
  rows,
  resetKey,
  onProses,
  onEdit,
  onDelete
}: MasterTabViewsProps) {
  switch (activeTab) {
    case "materials":
      return <RawMaterialsTable materials={rows} onProses={onProses} resetKey={resetKey} />;
    case "products":
      return <ProductsTable products={rows} onProses={onProses} resetKey={resetKey} />;
    case "boms":
      return <BomCardsGrid boms={rows} onProses={onProses} />;
    case "contacts":
      // Kontak dikelola lewat halaman Customer/Supplier, yang memakai tabel ini
      // dengan aksi ubah & hapus langsung di baris.
      return (
        <ContactsTable
          contacts={rows}
          onEdit={(item) => onEdit("contacts", item)}
          onDelete={(id, name) => onDelete("contacts", id, name)}
        />
      );
    case "units":
      return <UnitsTable units={rows} onProses={onProses} resetKey={resetKey} />;
    case "salesTypes":
      return <SalesTypesTable salesTypes={rows} onProses={onProses} resetKey={resetKey} />;
    case "employees":
      return <EmployeesTable employees={rows} onProses={onProses} resetKey={resetKey} />;
  }
}
