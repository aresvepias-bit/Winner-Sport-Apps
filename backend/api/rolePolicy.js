const prisma = require('./db');

/**
 * Hak akses per modul. Sumbernya tabel RolePermission (bisa diubah dari menu
 * Pengguna & Hak Akses); DEFAULT_POLICY dipakai sebagai cadangan untuk modul
 * yang belum punya baris di database, atau bila database gagal dibaca.
 *
 * OWNER tidak pernah disimpan di sini: checkRole selalu meloloskannya, supaya
 * hak akses tidak bisa diatur sampai mengunci semua orang.
 *
 * Cerminannya di frontend: role beserta daftar modulnya dikirim lewat
 * GET /api/auth/me, jadi menu & guard halaman selalu ikut nilai terbaru.
 */
const DEFAULT_POLICY = {
  DASHBOARD: ['ADMIN', 'SALES', 'ACCOUNTING'],
  ACCOUNTING: ['ADMIN', 'ACCOUNTING', 'SALES'],
  SALES: ['ADMIN', 'SALES', 'ACCOUNTING'],
  PRODUCTION: ['ADMIN', 'PRODUCTION', 'WAREHOUSE'],
  INVENTORY: ['ADMIN', 'WAREHOUSE', 'PRODUCTION'],
  PURCHASING: ['ADMIN', 'WAREHOUSE', 'PRODUCTION'],
  MASTER_WRITE: ['ADMIN', 'PRODUCTION'],
  // Data karyawan memuat gaji/tarif upah, tidak untuk semua role.
  MASTER_EMPLOYEES: ['ADMIN', 'PRODUCTION']
};

/**
 * Modul pengelolaan akun sengaja TIDAK bisa diubah dari UI: kalau bisa, seorang
 * ADMIN dapat mencabut akses semua ADMIN (termasuk dirinya) dan tidak ada jalan
 * kembali selain lewat database.
 */
const FIXED_POLICY = {
  USER_ADMIN: ['ADMIN']
};

/** Role yang barisnya boleh diatur dari UI (OWNER tidak, karena selalu penuh). */
const EDITABLE_ROLES = ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'ACCOUNTING'];

/** Label modul untuk matriks hak akses di UI. */
const MODULE_LABELS = {
  DASHBOARD: 'Dashboard & Laba Rugi',
  PRODUCTION: 'SPK / Produksi',
  SALES: 'Order Penjualan',
  INVENTORY: 'Persediaan & Stok',
  PURCHASING: 'Order Bahan (PO)',
  ACCOUNTING: 'Akuntansi & Kas',
  MASTER_WRITE: 'Master Data (tambah/ubah/hapus)',
  MASTER_EMPLOYEES: 'Data Karyawan & Upah'
};

const EDITABLE_MODULES = Object.keys(DEFAULT_POLICY);
const ALL_MODULES = [...EDITABLE_MODULES, ...Object.keys(FIXED_POLICY)];

let cache = null; // { MODULE: Set<role> }
let loading = null;

function buildCache(rows) {
  const next = {};
  for (const [mod, roles] of Object.entries(DEFAULT_POLICY)) next[mod] = new Set(roles);
  for (const row of rows) {
    if (!next[row.module]) continue; // modul tak dikenal di database diabaikan
    if (row.allowed) next[row.module].add(row.role);
    else next[row.module].delete(row.role);
  }
  for (const [mod, roles] of Object.entries(FIXED_POLICY)) next[mod] = new Set(roles);
  return next;
}

/** Memuat kebijakan dari database sekali, lalu memakai cache sampai invalidate(). */
function ensureLoaded() {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = prisma.rolePermission
      .findMany()
      .then((rows) => {
        cache = buildCache(rows);
        return cache;
      })
      .catch((err) => {
        // Gagal baca database: pakai default, jangan sampai semua orang terkunci.
        console.warn('[rolePolicy] Gagal memuat hak akses dari database, memakai default:', err.message);
        cache = buildCache([]);
        return cache;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

function invalidate() {
  cache = null;
}

/** Role yang boleh mengakses modul (tanpa OWNER, yang selalu boleh). */
async function getAllowedRoles(module) {
  const policy = await ensureLoaded();
  return [...(policy[module] || [])];
}

/** Matriks untuk UI: { MODULE: { label, roles: { ADMIN: true, ... } } } */
async function getMatrix() {
  const policy = await ensureLoaded();
  const matrix = {};
  for (const mod of EDITABLE_MODULES) {
    matrix[mod] = {
      label: MODULE_LABELS[mod] || mod,
      roles: Object.fromEntries(EDITABLE_ROLES.map((r) => [r, policy[mod].has(r)]))
    };
  }
  return matrix;
}

/** Semua modul yang boleh diakses sebuah role (OWNER mendapat semuanya). */
async function getModulesForRole(role) {
  const policy = await ensureLoaded();
  if (role === 'OWNER') return [...ALL_MODULES];
  return ALL_MODULES.filter((mod) => policy[mod].has(role));
}

module.exports = {
  DEFAULT_POLICY,
  FIXED_POLICY,
  EDITABLE_ROLES,
  EDITABLE_MODULES,
  ALL_MODULES,
  MODULE_LABELS,
  ensureLoaded,
  invalidate,
  getAllowedRoles,
  getMatrix,
  getModulesForRole
};
