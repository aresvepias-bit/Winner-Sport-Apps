"use client";

import CreateRawMaterialModal from "@/components/master/CreateRawMaterialModal";
import CreateProductModal from "@/components/master/CreateProductModal";
import CreateContactModal from "@/components/master/CreateContactModal";
import CreateEmployeeModal from "@/components/master/CreateEmployeeModal";
import EditRawMaterialModal from "@/components/master/EditRawMaterialModal";
import EditProductModal from "@/components/master/EditProductModal";
import EditContactModal from "@/components/master/EditContactModal";
import EditEmployeeModal from "@/components/master/EditEmployeeModal";
import UnitModal from "@/components/master/UnitModal";
import SalesTypeModal from "@/components/master/SalesTypeModal";
import type { EditableEntity } from "@/components/master/masterEntities";

/** Hanya satu modal terbuka pada satu waktu. */
export type MasterModalState =
  | { kind: "create"; entity: EditableEntity }
  | { kind: "edit"; entity: EditableEntity; item: any }
  | null;

interface MasterModalsProps {
  modal: MasterModalState;
  onClose: () => void;
  onCreate: (entity: EditableEntity, data: any) => Promise<void>;
  onUpdate: (entity: EditableEntity, id: string, data: any) => Promise<void>;
}

export default function MasterModals({ modal, onClose, onCreate, onUpdate }: MasterModalsProps) {
  if (!modal) return null;

  if (modal.kind === "create") {
    const submit = (data: any) => onCreate(modal.entity, data);
    switch (modal.entity) {
      case "materials":
        return <CreateRawMaterialModal onClose={onClose} onSubmit={submit} />;
      case "products":
        return <CreateProductModal onClose={onClose} onSubmit={submit} />;
      case "contacts":
        return <CreateContactModal onClose={onClose} onSubmit={submit} />;
      case "employees":
        return <CreateEmployeeModal onClose={onClose} onSubmit={submit} />;
      case "units":
        return <UnitModal onClose={onClose} onSubmit={submit} />;
      case "salesTypes":
        return <SalesTypeModal onClose={onClose} onSubmit={submit} />;
    }
  }

  const submit = (id: string, data: any) => onUpdate(modal.entity, id, data);
  switch (modal.entity) {
    case "materials":
      return <EditRawMaterialModal material={modal.item} onClose={onClose} onSubmit={submit} />;
    case "products":
      return <EditProductModal product={modal.item} onClose={onClose} onSubmit={submit} />;
    case "contacts":
      return <EditContactModal contact={modal.item} onClose={onClose} onSubmit={submit} />;
    case "employees":
      return <EditEmployeeModal employee={modal.item} onClose={onClose} onSubmit={submit} />;
    case "units":
      return <UnitModal unit={modal.item} onClose={onClose} onSubmit={(d) => submit(modal.item.id, d)} />;
    case "salesTypes":
      return <SalesTypeModal salesType={modal.item} onClose={onClose} onSubmit={(d) => submit(modal.item.id, d)} />;
  }
}
