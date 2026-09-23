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
  contactType?: "CUSTOMER" | "SUPPLIER";
  onProses?: (contact: Contact) => void;
  resetKey?: string;
}

// Pencarian dan filter dipegang MasterFilterBar di halaman, jadi tabel ini
// cukup menampilkan baris yang sudah disaring.
export default function ContactsTable({ contacts, onProses, contactType, resetKey = "" }: ContactsTableProps) {
  const pg = usePagination(contacts, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar {contactType === "CUSTOMER" ? "Customer" : contactType === "SUPPLIER" ? "Supplier" : "Supplier & Customer"}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master rekanan bisnis, pemasok bahan dan pelanggan ({contacts.length} rekanan)</p>
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
            {contacts.length > 0 ? (
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
                    <button
                      onClick={() => onProses?.(c)}
                      title="Proses data"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-sm shadow-red-600/20 transition-colors cursor-pointer"
                    >
                      Proses
                    </button>
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
