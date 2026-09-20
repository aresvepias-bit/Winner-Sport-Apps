import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0";
  }
  return new Intl.NumberFormat("id-ID").format(Number(amount));
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatThousand(val: number | string | null | undefined, allowDecimals = false): string {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val);
  if (allowDecimals) {
    const normalized = str.replace(".", ",");
    const parts = normalized.split(",");
    const intDigits = parts[0].replace(/\D/g, "");
    const intFormatted = intDigits ? new Intl.NumberFormat("id-ID").format(parseInt(intDigits, 10)) : "0";
    if (parts.length > 1) {
      const decDigits = parts[1].replace(/\D/g, "").slice(0, 2);
      return `${intFormatted},${decDigits}`;
    }
    return intFormatted;
  } else {
    const clean = str.replace(/\D/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
  }
}

/**
 * Menyamarkan email untuk ditampilkan di layar: "owner@winnersport.com" -> "o•••r@winnersport.com".
 * Huruf pertama & terakhir nama akun dibiarkan agar masih bisa dibedakan, domain tetap utuh.
 * Nama akun yang terlalu pendek disamarkan seluruhnya.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  const at = email.lastIndexOf("@");
  // Bukan format email (tidak ada @, atau @ di awal): samarkan seluruhnya.
  if (at < 1) return "•".repeat(Math.max(email.length, 3));

  const local = email.slice(0, at);
  const domain = email.slice(at);

  // Nama akun pendek disamarkan penuh: menyisakan huruf pertama & terakhir
  // dari 3 huruf sama saja dengan membocorkannya.
  if (local.length <= 3) return "•".repeat(Math.max(local.length, 3)) + domain;

  const bullets = "•".repeat(Math.min(local.length - 2, 6));
  return `${local[0]}${bullets}${local[local.length - 1]}${domain}`;
}

export function parseThousand(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
