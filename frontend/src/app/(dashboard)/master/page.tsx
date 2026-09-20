"use client";

import { useState } from "react";
import ErrorBanner from "@/components/common/ErrorBanner";
import MasterHeader from "@/components/master/MasterHeader";
import MasterNavTabs, { MasterTabType } from "@/components/master/MasterNavTabs";
import MasterKpiBar from "@/components/master/MasterKpiBar";
import MasterTabViews from "@/components/master/MasterTabViews";
import MasterModals, { MasterModalState } from "@/components/master/MasterModals";
import { CREATE_BUTTON_TEXT, EditableEntity } from "@/components/master/masterEntities";
import { useMasterData } from "@/components/master/useMasterData";
import { useMasterCrud } from "@/components/master/useMasterCrud";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MasterTabType>("materials");
  const [modal, setModal] = useState<MasterModalState>(null);

  const { data, loading, loadError, load } = useMasterData(activeTab);
  const crud = useMasterCrud(load);

  // BOM tidak punya tombol tambah: formula dibuat saat menerbitkan spesifikasi produk.
  const createEntity: EditableEntity | null = activeTab === "boms" ? null : activeTab;

  const handleCreate = async (entity: EditableEntity, data: any) => {
    if (await crud.create(entity, data)) setModal(null);
  };

  const handleUpdate = async (entity: EditableEntity, id: string, data: any) => {
    if (await crud.update(entity, id, data)) setModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with dynamic create button */}
      <MasterHeader
        loading={loading}
        onRefresh={load}
        onCreateNew={createEntity ? () => setModal({ kind: "create", entity: createEntity }) : undefined}
        createButtonText={createEntity ? CREATE_BUTTON_TEXT[createEntity] : ""}
      />

      <ErrorBanner message={loadError} onRetry={load} />

      {/* 2. Navigation Tabs */}
      <MasterNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Real-Time KPI Analytics Bar */}
      <MasterKpiBar
        activeTab={activeTab}
        materials={data.materials}
        products={data.products}
        boms={data.boms}
        contacts={data.contacts}
        employees={data.employees}
      />

      {/* 4. Domain Tab Views with Edit & Delete Actions */}
      <MasterTabViews
        activeTab={activeTab}
        data={data}
        onEdit={(entity, item) => setModal({ kind: "edit", entity, item })}
        onDelete={crud.remove}
      />

      {/* 5. Create & Edit Modals */}
      <MasterModals
        modal={modal}
        onClose={() => setModal(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
