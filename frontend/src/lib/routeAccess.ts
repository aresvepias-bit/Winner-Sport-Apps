/**
 * Halaman -> modul hak akses. Daftar modul yang boleh dibuka seorang pengguna
 * datang dari server (GET /api/auth/me), bukan dari tabel statis di sini,
 * supaya perubahan di menu Pengguna & Hak Akses langsung ikut terpakai.
 *
 * Nama modul harus sama persis dengan backend/api/rolePolicy.js.
 */
export const ROUTE_MODULE: Record<string, string> = {
  "/": "DASHBOARD",
  "/production": "PRODUCTION",
  "/sales": "SALES",
  "/inventory": "INVENTORY",
  "/purchasing": "PURCHASING",
  "/accounting": "ACCOUNTING",
  "/master": "MASTER_WRITE",
  "/customers": "MASTER_WRITE",
  "/suppliers": "MASTER_WRITE",
  "/users": "USER_ADMIN"
};

/** Urutan prioritas halaman awal bila halaman yang dituju tidak diizinkan. */
const HOME_ORDER = ["/", "/production", "/sales", "/inventory", "/purchasing", "/accounting", "/master", "/users"];

function routeFor(path: string): string | null {
  if (path === "/" || path === "") return "/";
  const match = Object.keys(ROUTE_MODULE).find((r) => r !== "/" && (path === r || path.startsWith(r + "/")));
  return match ?? null;
}

export function moduleForPath(path: string): string | null {
  const route = routeFor(path);
  return route ? ROUTE_MODULE[route] : null;
}

export function canAccess(modules: string[] | undefined | null, path: string): boolean {
  if (!modules) return false;
  const mod = moduleForPath(path);
  if (!mod) return true; // path tak dikenal (mis. 404) tidak dijaga
  return modules.includes(mod);
}

/** Halaman pertama yang boleh dibuka, atau null bila tidak ada satu pun. */
export function homeFor(modules: string[] | undefined | null): string | null {
  return HOME_ORDER.find((p) => canAccess(modules, p)) ?? null;
}
