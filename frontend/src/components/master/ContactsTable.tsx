import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface Contact {
  id: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  companyName?: string;
  paymentTerm: number;
}

interface ContactsTableProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL");

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchQuery = (
      c.name?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
    if (!matchQuery) return false;
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
    return true;
  });

  const pg = usePagination(filteredContacts, 10, `${search}|${typeFilter}`);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Supplier &amp; Customer</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master rekanan bisnis, pemasok bahan dan pelanggan ({filteredContacts.length} rekanan)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Tipe */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-white dark:bg-[#1a2236] text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter("CUSTOMER")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "CUSTOMER"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              }`}
            >
              Pelanggan
            </button>
            <button
              onClick={() => setTypeFilter("SUPPLIER")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "SUPPLIER"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-blue-600 dark:text-blue-400 hover:text-blue-700"
              }`}
            >
              Pemasok
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kontak, toko, atau no HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 w-56"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Nama Kontak</th>
              <th className="pb-3 font-semibold">Tipe</th>
              <th className="pb-3 font-semibold">Telepon / WhatsApp</th>
              <th className="pb-3 font-semibold">Alamat / Perusahaan</th>
              <th className="pb-3 font-semibold">Term Bayar</th>
              <th className="pb-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {filteredContacts.length > 0 ? (
              pg.pageItems.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-200">{c.name}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        c.type === "SUPPLIER"
                          ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                          : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{c.phone || "-"}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    <div>{c.companyName || "-"}</div>
                    {c.address && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{c.address}</div>}
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">{formatNumber(c.paymentTerm)} Hari</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit?.(c)}
                        title="Edit Rekanan"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete?.(c.id, c.name)}
                        title="Hapus Rekanan"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Tidak ada data kontak rekanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination {...pg} />
    </div>
  );
}
