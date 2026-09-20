/** Label peran untuk ditampilkan. Nilainya harus sama dengan enum Role di schema.prisma. */
export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner (akses penuh)",
  ADMIN: "Admin",
  WAREHOUSE: "Gudang",
  PRODUCTION: "Produksi",
  SALES: "Penjualan",
  ACCOUNTING: "Akuntansi"
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);

export const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
  ADMIN: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  WAREHOUSE: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  PRODUCTION: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  SALES: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  ACCOUNTING: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20"
};

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
}
