"use client";

import { useMemo, useState } from "react";
import { Building2, DatabaseZap, Plus, RefreshCw, Users } from "lucide-react";
import ContactsTable from "./ContactsTable";
import CreateContactModal from "./CreateContactModal";
import EditContactModal from "./EditContactModal";
import MasterFilterBar from "./MasterFilterBar";
import MasterRowDrawer from "./MasterRowDrawer";
import { FILTER_MASTER_KOSONG, saringMaster, type MasterFilterState } from "./masterFilter";
import { useMasterData } from "./useMasterData";
import { useMasterCrud } from "./useMasterCrud";
import ErrorBanner from "@/components/common/ErrorBanner";

export default function ContactDirectory({ contactType }: { contactType: "CUSTOMER" | "SUPPLIER" }) {
  // autoLoad dimatikan: halaman terbuka seketika, data ditarik saat Proses ditekan.
  const { data, loading, loadError, load, sudahDimuat } = useMasterData("contacts", { autoLoad: false });
  const crud = useMasterCrud(load);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState<MasterFilterState>(FILTER_MASTER_KOSONG);
  const [rowDiproses, setRowDiproses] = useState<any>(null);

  const customer = contactType === "CUSTOMER";
  const label = customer ? "Customer" : "Supplier";
  const Icon = customer ? Users : Building2;

  const contacts = useMemo(
    () => data.contacts.filter((contact) => contact.type === contactType),
    [data.contacts, contactType]
  );
  const contactsTersaring = useMemo(
    () => saringMaster("contacts", contacts, filter),
    [contacts, filter]
  );

  const handleHapus = async (_entity: any, id: string, name: string) => {
    setRowDiproses(null);
    await crud.remove("contacts", id, name);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-red-50 p-6 sm:flex-row sm:items-center sm:p-8 dark:border-slate-800 dark:from-[#0d1424] dark:to-red-950/20">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
            <Icon className="h-4 w-4" />
            Data Rekanan
          </div>
          <h1 className="text-2xl font-black">Data {label}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {customer
              ? "Kelola pelanggan, kontak penagihan, dan termin pembayaran."
              : "Kelola pemasok bahan, kontak pembelian, dan termin pembayaran."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            disabled={loading}
            onClick={load}
            aria-label={`Segarkan data ${label.toLowerCase()}`}
            className="cursor-pointer rounded-xl border border-slate-200 p-3 disabled:opacity-50 dark:border-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Tambah {label}
          </button>
        </div>
      </div>

      <ErrorBanner message={loadError} onRetry={load} />

      <MasterFilterBar
        entity="contacts"
        rows={contacts}
        nilai={filter}
        onChange={setFilter}
        jumlahTampil={contactsTersaring.length}
        tampilkanJumlah={sudahDimuat}
      />

      {!sudahDimuat ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0d1424]">
          <DatabaseZap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-3 text-base font-bold">Data belum diambil</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Atur filter di atas bila perlu, lalu tekan Proses untuk mengambil data {label.toLowerCase()} dari server.
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {contacts.length} {label.toLowerCase()} terdaftar
          </p>
          <ContactsTable
            contactType={contactType}
            contacts={contactsTersaring}
            onProses={setRowDiproses}
            resetKey={`${filter.cari}|${filter.status}|${filter.kategori}`}
          />
        </>
      )}

      {rowDiproses && (
        <MasterRowDrawer
          entity="contacts"
          item={rowDiproses}
          onClose={() => setRowDiproses(null)}
          onEdit={(_entity, item) => {
            setRowDiproses(null);
            setEditing(item);
          }}
          onDelete={handleHapus}
        />
      )}

      {creating && (
        <CreateContactModal
          defaultType={contactType}
          lockType
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            if (await crud.create("contacts", { ...values, type: contactType })) setCreating(false);
          }}
        />
      )}
      {editing && (
        <EditContactModal
          lockType
          contact={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (id, values) => {
            if (await crud.update("contacts", id, values)) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
