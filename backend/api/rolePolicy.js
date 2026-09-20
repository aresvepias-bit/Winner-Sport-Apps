/**
 * Kebijakan akses per modul (penentu akhir; frontend hanya mencerminkannya).
 * OWNER selalu diizinkan oleh checkRole, jadi tidak perlu ditulis di sini.
 *
 * Cerminannya di frontend: frontend/src/lib/routeAccess.ts (menu sidebar & guard halaman).
 * Ubah keduanya bersamaan agar UI tidak menampilkan halaman yang ditolak backend.
 */
module.exports = {
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
