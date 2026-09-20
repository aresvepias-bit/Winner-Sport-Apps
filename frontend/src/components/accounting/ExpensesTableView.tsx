"use client";

import { formatRupiah, formatDate } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/common/Pagination";

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  date: string | Date;
  amount: number;
  recipient?: string;
  category?: { name: string };
  notes?: string;
}

interface ExpensesTableViewProps {
  expenses: ExpenseItem[];
}

export default function ExpensesTableView({ expenses }: ExpensesTableViewProps) {
  const pg = usePagination(expenses, 10);

  return (
    <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Riwayat Pengeluaran Operasional</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Catatan beban overhead, listrik, logistik, dan perawatan mesin workshop
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a2236] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="pb-3 font-semibold">No. Bukti</th>
              <th className="pb-3 font-semibold">Tanggal</th>
              <th className="pb-3 font-semibold">Kategori Beban</th>
              <th className="pb-3 font-semibold">Penerima Dana</th>
              <th className="pb-3 font-semibold">Keterangan</th>
              <th className="pb-3 font-semibold">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2236]/60">
            {expenses && expenses.length > 0 ? (
              pg.pageItems.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-red-600 dark:text-red-400">
                    {exp.expenseNumber}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(exp.date)}</td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                    {exp.category?.name || "Operasional"}
                  </td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300">{exp.recipient || "-"}</td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{exp.notes}</td>
                  <td className="py-3.5 font-bold text-rose-600 dark:text-rose-400">
                    {formatRupiah(exp.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Tidak ada catatan biaya operasional.
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
