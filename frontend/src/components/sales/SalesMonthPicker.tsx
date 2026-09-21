"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import DatePicker from "react-datepicker";
import { id as indonesian } from "date-fns/locale/id";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./SalesMonthPicker.module.css";

const MonthButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { value?: string }>(
  function MonthButton({ value, onClick, onKeyDown }, ref) {
    return <button ref={ref} type="button" onClick={onClick} onKeyDown={onKeyDown} aria-label={`Pilih bulan penjualan: ${value}`} aria-haspopup="dialog" className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <CalendarDays className="h-4 w-4 text-red-500" /><span>{value}</span><ChevronDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
    </button>;
  },
);

export default function SalesMonthPicker({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  const [year, month] = value.split("-").map(Number);
  return <DatePicker
    selected={new Date(year, month - 1, 1)}
    onChange={(date: Date | null) => {
      if (date) onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }}
    locale={indonesian}
    dateFormat="MMMM yyyy"
    showMonthYearPicker
    showFullMonthYearPicker
    shouldCloseOnSelect
    showPopperArrow={false}
    popperPlacement="bottom-end"
    popperClassName={styles.popper}
    calendarClassName={styles.calendar}
    customInput={<MonthButton />}
    renderCustomHeader={({ date, decreaseYear, increaseYear }) => <div className="flex items-center justify-between gap-4 px-3 py-2">
      <button type="button" aria-label="Tahun sebelumnya" onClick={decreaseYear} className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-red-500 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
      <span className="text-sm font-bold">{date.getFullYear()}</span>
      <button type="button" aria-label="Tahun berikutnya" onClick={increaseYear} className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-red-500 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
    </div>}
  />;
}
