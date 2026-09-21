"use client";

import { useState } from "react";
import { Plus, RefreshCw, Users, Building2 } from "lucide-react";
import ContactsTable from "./ContactsTable";
import CreateContactModal from "./CreateContactModal";
import EditContactModal from "./EditContactModal";
import { useMasterData } from "./useMasterData";
import { useMasterCrud } from "./useMasterCrud";
import ErrorBanner from "@/components/common/ErrorBanner";

export default function ContactDirectory({ contactType }: { contactType: "CUSTOMER" | "SUPPLIER" }) {
  const { data, loading, loadError, load } = useMasterData("contacts");
  const crud = useMasterCrud(load);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const customer = contactType === "CUSTOMER";
  const label = customer ? "Customer" : "Supplier";
  const Icon = customer ? Users : Building2;
  const contacts = data.contacts.filter((contact) => contact.type === contactType);
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-red-50 p-6 sm:flex-row sm:items-center sm:p-8 dark:border-slate-800 dark:from-[#0d1424] dark:to-red-950/20">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600"><Icon className="h-4 w-4" />Data Rekanan</div><h1 className="text-2xl font-black">Data {label}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{customer ? "Kelola pelanggan, kontak penagihan, dan termin pembayaran." : "Kelola pemasok bahan, kontak pembelian, dan termin pembayaran."}</p></div>
      <div className="flex shrink-0 gap-2"><button disabled={loading} onClick={load} aria-label="Segarkan data rekanan" className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white"><Plus className="h-4 w-4" />Tambah {label}</button></div>
    </div>
    <ErrorBanner message={loadError} onRetry={load} />
    <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? "Memuat data..." : `${contacts.length} ${label.toLowerCase()} terdaftar`}</p>
    <ContactsTable contactType={contactType} contacts={contacts} onEdit={setEditing} onDelete={(id, name) => crud.remove("contacts", id, name)} />
    {creating && <CreateContactModal defaultType={contactType} lockType onClose={() => setCreating(false)} onSubmit={async (values) => { if (await crud.create("contacts", { ...values, type: contactType })) setCreating(false); }} />}
    {editing && <EditContactModal lockType contact={editing} onClose={() => setEditing(null)} onSubmit={async (id, values) => { if (await crud.update("contacts", id, values)) setEditing(null); }} />}
  </div>;
}
