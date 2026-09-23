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
  onProses?: (employee: Employee) => void;
  resetKey?: string;
}

export default function EmployeesTable({ employees, onProses, resetKey = "" }: EmployeesTableProps) {
  const pg = usePagination(employees, 10, resetKey);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Tenaga Kerja &amp; Penjahit</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master tim produksi konveksi, operator potong, jahit, dan finishing ({employees.length} orang)</p>
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
            {employees.length > 0 ? (
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
                    <button
                      onClick={() => onProses?.(e)}
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
