/**
 * Role yang boleh membuka tiap halaman. Cermin dari backend/api/rolePolicy.js
 * (backend tetap penentu akhir; ini hanya agar UI tidak menampilkan halaman yang pasti ditolak).
 * OWNER selalu diizinkan, jadi tidak perlu ditulis.
 * Role = enum Role di schema.prisma.
 */
export const ROUTE_ROLES: Record<string, string[]> = {
  "/": ["ADMIN", "SALES", "ACCOUNTING"],
  "/production": ["ADMIN", "PRODUCTION", "WAREHOUSE"],
  "/sales": ["ADMIN", "SALES", "ACCOUNTING"],
  "/inventory": ["ADMIN", "WAREHOUSE", "PRODUCTION"],
  "/purchasing": ["ADMIN", "WAREHOUSE", "PRODUCTION"],
  "/accounting": ["ADMIN", "ACCOUNTING", "SALES"],
  "/master": ["ADMIN", "PRODUCTION"]
};

/** Urutan prioritas halaman awal bila halaman yang dituju tidak diizinkan. */
const HOME_ORDER = ["/", "/production", "/sales", "/inventory", "/purchasing", "/accounting", "/master"];

function routeFor(path: string): string | null {
  if (path === "/" || path === "") return "/";
  const match = Object.keys(ROUTE_ROLES).find((r) => r !== "/" && (path === r || path.startsWith(r + "/")));
  return match ?? null;
}

export function canAccess(role: string | undefined | null, path: string): boolean {
  if (!role) return false;
  if (role === "OWNER") return true;
  const route = routeFor(path);
  if (!route) return true; // path yang tidak dikenal (mis. 404) tidak dijaga
  return ROUTE_ROLES[route].includes(role);
}

/** Halaman pertama yang boleh dibuka role ini, atau null bila tidak ada. */
export function homeFor(role: string | undefined | null): string | null {
  return HOME_ORDER.find((p) => canAccess(role, p)) ?? null;
}
