"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ErrorBanner from "@/components/common/ErrorBanner";
import MasterHeader from "@/components/master/MasterHeader";
import MasterNavTabs, { MASTER_MENUS, MasterTabType } from "@/components/master/MasterNavTabs";
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
  const activeMenu = MASTER_MENUS.find((menu) => menu.key === activeTab)!;
  const ActiveIcon = activeMenu.icon;

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
      <MasterHeader
        loading={loading}
        onRefresh={load}
      />

      <ErrorBanner message={loadError} onRetry={load} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[248px_minmax(0,1fr)]">
      <MasterNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <section aria-labelledby="active-master-heading" className="min-w-0 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"><ActiveIcon className="h-5 w-5" /></div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{activeMenu.group}</p>
              <h2 id="active-master-heading" className="text-xl font-bold tracking-tight">{activeMenu.label}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeMenu.description}</p>
            </div>
          </div>
          {createEntity && <button type="button" onClick={() => setModal({ kind: "create", entity: createEntity })} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"><Plus className="h-4 w-4" />{CREATE_BUTTON_TEXT[createEntity]}</button>}
        </div>
      <MasterKpiBar
        activeTab={activeTab}
        materials={data.materials}
        products={data.products}
        boms={data.boms}
        contacts={data.contacts}
        employees={data.employees}
      />

      <MasterTabViews
        activeTab={activeTab}
        data={data}
        onEdit={(entity, item) => setModal({ kind: "edit", entity, item })}
        onDelete={crud.remove}
      />
      </section>
      </div>

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
