/**
 * Mengisi master Tipe Penjualan dengan lima tipe bawaan (sebelumnya enum di database).
 * Aman dijalankan berulang: memakai upsert, tidak menimpa nama yang sudah diubah pengguna.
 *
 * Pakai: cd backend && node scripts/seed-sales-types.js
 */
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const prisma = require('../api/db');

const DEFAULT_SALES_TYPES = [
  { code: 'KODIAN', name: 'Penjualan Kodian (1 Kodi = 20 Pcs)', sortOrder: 1, description: 'Penjualan per kodi ke toko/grosir' },
  { code: 'BULK_GROSIR', name: 'Grosir / Partai Besar', sortOrder: 2, description: 'Pembelian jumlah besar dengan harga grosir' },
  { code: 'CUSTOM_ORDER', name: 'Custom Order (Sablon / Tim)', sortOrder: 3, description: 'Pesanan khusus dengan desain sendiri' },
  { code: 'SATUAN', name: 'Satuan / Eceran', sortOrder: 4, description: 'Penjualan per potong' },
  { code: 'PROJECT', name: 'Project Korporasi / Event', sortOrder: 5, description: 'Pengadaan untuk instansi atau acara' }
];

async function main() {
  for (const t of DEFAULT_SALES_TYPES) {
    await prisma.salesType.upsert({
      where: { code: t.code },
      update: {}, // biarkan perubahan nama dari menu Master
      create: t
    });
  }

  const rows = await prisma.salesType.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log(`Master Tipe Penjualan berisi ${rows.length} tipe:`);
  for (const r of rows) console.log(`  ${r.code.padEnd(14)} ${r.name}${r.isActive ? '' : '  (nonaktif)'}`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Gagal:', err.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { DEFAULT_SALES_TYPES };
