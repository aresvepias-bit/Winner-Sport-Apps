import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface Employee {
  id: string;
  name: string;
  role: string;
  wageType: string;
  ratePerPcs?: number;
  baseSalary?: number;
  phone?: string;
  isActive?: boolean;
}

interface EmployeesTableProps {
  employees: Employee[];
  onEdit?: (employee: Employee) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function EmployeesTable({ employees, onEdit, onDelete }: EmployeesTableProps) {
  const [search, setSearch] = useState("");
  const [wageFilter, setWageFilter] = useState<"ALL" | "BORONGAN" | "BULANAN">("ALL");

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchQuery = (
      e.name?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) ||
      e.phone?.toLowerCase().includes(q)
    );
    if (!matchQuery) return false;
    if (wageFilter !== "ALL" && e.wageType !== wageFilter) return false;
    return true;
  });

  const pg = usePagination(filteredEmployees, 10, `${search}|${wageFilter}`);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Tenaga Kerja &amp; Penjahit</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master tim produksi konveksi, operator potong, jahit, dan finishing ({filteredEmployees.length} orang)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Upah */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141b2d] border border-slate-200 dark:border-[#1a2236] p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setWageFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                wageFilter === "ALL"
                  ? "bg-white dark:bg-[#1a2236] text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setWageFilter("BORONGAN")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                wageFilter === "BORONGAN"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-blue-600 dark:text-blue-400 hover:text-blue-700"
              }`}
            >
              Borongan
            </button>
            <button
              onClick={() => setWageFilter("BULANAN")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                wageFilter === "BULANAN"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-purple-600 dark:text-purple-400 hover:text-purple-700"
              }`}
            >
              Bulanan
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan / posisi..."
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
              <th className="pb-3 font-semibold">Nama Karyawan</th>
              <th className="pb-3 font-semibold">Peran / Divisi</th>
              <th className="pb-3 font-semibold">Sistem Upah</th>
              <th className="pb-3 font-semibold">Tarif Borongan / Gaji</th>
              <th className="pb-3 font-semibold">Telepon / WhatsApp</th>
              <th className="pb-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {filteredEmployees.length > 0 ? (
              pg.pageItems.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-200">{e.name}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">{e.role}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-purple-500/10 text-slate-700 dark:text-purple-400 border border-slate-200 dark:border-purple-500/20 font-bold text-[10px]">
                      {e.wageType}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-red-600 dark:text-red-400">
                    {e.wageType === "BORONGAN"
                      ? `${formatRupiah(e.ratePerPcs || 0)} / pcs`
                      : `${formatRupiah(e.baseSalary || 0)} / bln`}
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">{e.phone || "-"}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit?.(e)}
                        title="Edit Tenaga Kerja"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete?.(e.id, e.name)}
                        title="Hapus Tenaga Kerja"
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
                  Tidak ada data karyawan ditemukan.
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
