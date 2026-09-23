"use client";

import { useMemo, useState } from "react";
import { DatabaseZap, Plus, Settings2 } from "lucide-react";
import ErrorBanner from "@/components/common/ErrorBanner";
import MasterHeader from "@/components/master/MasterHeader";
import MasterNavTabs, { MASTER_MENUS, MasterTabType } from "@/components/master/MasterNavTabs";
import MasterKpiBar from "@/components/master/MasterKpiBar";
import MasterTabViews from "@/components/master/MasterTabViews";
import MasterModals, { MasterModalState } from "@/components/master/MasterModals";
import MasterFilterBar from "@/components/master/MasterFilterBar";
import MasterRowDrawer from "@/components/master/MasterRowDrawer";
import { FILTER_MASTER_KOSONG, saringMaster, type MasterFilterState } from "@/components/master/masterFilter";
import { CREATE_BUTTON_TEXT, EditableEntity } from "@/components/master/masterEntities";
import { useMasterData } from "@/components/master/useMasterData";
import { useMasterCrud } from "@/components/master/useMasterCrud";

export default function MasterDataPage() {
  // Belum ada menu terpilih saat halaman dibuka.
  const [activeTab, setActiveTab] = useState<MasterTabType | null>(null);
  const [modal, setModal] = useState<MasterModalState>(null);
  const [filter, setFilter] = useState<MasterFilterState>(FILTER_MASTER_KOSONG);
  const [rowDiproses, setRowDiproses] = useState<any>(null);

  // autoLoad dimatikan: memilih menu belum menarik data, harus ditekan Proses dulu.
  const { data, loading, loadError, load, sudahDimuat } = useMasterData(activeTab, { autoLoad: false });
  const crud = useMasterCrud(load);
  const activeMenu = MASTER_MENUS.find((menu) => menu.key === activeTab);
  const ActiveIcon = activeMenu?.icon;

  const rowsTab: any[] = activeTab ? data[activeTab] : [];
  const rowsTersaring = useMemo(
    () => (activeTab ? saringMaster(activeTab, rowsTab, filter) : []),
    [activeTab, rowsTab, filter]
  );

  // Ganti menu hanya memindah tampilan dan membersihkan filter; pengambilan
  // data menunggu tombol Proses ditekan.
  const pilihMenu = (tab: MasterTabType) => {
    setActiveTab(tab);
    setFilter(FILTER_MASTER_KOSONG);
    setRowDiproses(null);
  };

  // BOM tidak punya tombol tambah: formula dibuat saat menerbitkan spesifikasi produk.
  const createEntity: EditableEntity | null =
    !activeTab || activeTab === "boms" ? null : activeTab;

  const handleCreate = async (entity: EditableEntity, data: any) => {
    if (await crud.create(entity, data)) setModal(null);
  };

  const handleUpdate = async (entity: EditableEntity, id: string, data: any) => {
    if (await crud.update(entity, id, data)) setModal(null);
  };

  const handleHapus = async (entity: any, id: string, name: string) => {
    setRowDiproses(null);
    await crud.remove(entity, id, name);
  };

  return (
    <div className="space-y-6">
      <MasterHeader loading={loading} onRefresh={load} />

      <ErrorBanner message={loadError} onRetry={load} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[248px_minmax(0,1fr)]">
        <MasterNavTabs activeTab={activeTab} onTabChange={pilihMenu} />

        <section aria-labelledby="active-master-heading" className="min-w-0 space-y-5">
          {!activeTab || !activeMenu || !ActiveIcon ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]">
              <Settings2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <h2 id="active-master-heading" className="mt-3 text-base font-bold">
                Pilih menu master
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Pilih menu, atur filternya, lalu tekan Proses. Tidak ada data yang ditarik
                sebelum itu, jadi halaman ini terbuka seketika.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {MASTER_MENUS.map((menu) => {
                  const Icon = menu.icon;
                  return (
                    <button
                      key={menu.key}
                      type="button"
                      onClick={() => pilihMenu(menu.key)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-[#1a2236] dark:bg-[#141b2d] dark:text-slate-300 dark:hover:border-red-500/30"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {menu.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {activeMenu.group}
                    </p>
                    <h2 id="active-master-heading" className="text-xl font-bold tracking-tight">
                      {activeMenu.label}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeMenu.description}</p>
                  </div>
                </div>
                {createEntity && (
                  <button
                    type="button"
                    onClick={() => setModal({ kind: "create", entity: createEntity })}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  >
                    <Plus className="h-4 w-4" />
                    {CREATE_BUTTON_TEXT[createEntity]}
                  </button>
                )}
              </div>

              <MasterFilterBar
                entity={activeTab}
                rows={rowsTab}
                nilai={filter}
                onChange={setFilter}
                jumlahTampil={rowsTersaring.length}
                tampilkanJumlah={sudahDimuat}
              />

              {!sudahDimuat ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]">
                  <DatabaseZap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <h3 className="mt-3 text-base font-bold">Data belum diambil</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                    Atur filter di atas bila perlu, lalu tekan Proses untuk mengambil data{" "}
                    {activeMenu.label.toLocaleLowerCase("id")} dari server.
                  </p>
                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <DatabaseZap className="h-4 w-4" />
                    {loading ? "Memuat data..." : "Proses & Tampilkan Data"}
                  </button>
                </div>
              ) : (
                <>
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
                    rows={rowsTersaring}
                    resetKey={`${activeTab}|${filter.cari}|${filter.status}|${filter.kategori}`}
                    onProses={setRowDiproses}
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* Panel proses satu baris: rincian lengkap plus tindakan ubah & hapus. */}
      {activeTab && rowDiproses && (
        <MasterRowDrawer
          entity={activeTab}
          item={rowDiproses}
          onClose={() => setRowDiproses(null)}
          onEdit={(entity, item) => {
            setRowDiproses(null);
            setModal({ kind: "edit", entity, item });
          }}
          onDelete={handleHapus}
        />
      )}

      {/* Create & Edit Modals */}
      <MasterModals
        modal={modal}
        onClose={() => setModal(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
