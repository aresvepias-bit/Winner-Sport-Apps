/**
 * Kebijakan akses per modul. Mengikuti pembagian menu di frontend/src/components/sidebar.tsx.
 * OWNER selalu diizinkan oleh checkRole, jadi tidak perlu ditulis di sini.
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
