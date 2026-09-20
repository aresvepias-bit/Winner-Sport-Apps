"use client";

import RawMaterialsTable from "@/components/master/RawMaterialsTable";
import ProductsTable from "@/components/master/ProductsTable";
import BomCardsGrid from "@/components/master/BomCardsGrid";
import ContactsTable from "@/components/master/ContactsTable";
import EmployeesTable from "@/components/master/EmployeesTable";
import type { MasterEntity, EditableEntity } from "@/components/master/masterEntities";
import type { MasterData } from "@/components/master/useMasterData";

interface MasterTabViewsProps {
  activeTab: MasterEntity;
  data: MasterData;
  onEdit: (entity: EditableEntity, item: any) => void;
  onDelete: (entity: MasterEntity, id: string, name: string) => void;
}

/** Menampilkan tabel/grid sesuai tab aktif, lengkap dengan aksi edit & hapus. */
export default function MasterTabViews({ activeTab, data, onEdit, onDelete }: MasterTabViewsProps) {
  switch (activeTab) {
    case "materials":
      return (
        <RawMaterialsTable
          materials={data.materials}
          onEdit={(item) => onEdit("materials", item)}
          onDelete={(id, name) => onDelete("materials", id, name)}
        />
      );
    case "products":
      return (
        <ProductsTable
          products={data.products}
          onEdit={(item) => onEdit("products", item)}
          onDelete={(id, name) => onDelete("products", id, name)}
        />
      );
    case "boms":
      return <BomCardsGrid boms={data.boms} onDelete={(id, name) => onDelete("boms", id, name)} />;
    case "contacts":
      return (
        <ContactsTable
          contacts={data.contacts}
          onEdit={(item) => onEdit("contacts", item)}
          onDelete={(id, name) => onDelete("contacts", id, name)}
        />
      );
    case "employees":
      return (
        <EmployeesTable
          employees={data.employees}
          onEdit={(item) => onEdit("employees", item)}
          onDelete={(id, name) => onDelete("employees", id, name)}
        />
      );
  }
}
