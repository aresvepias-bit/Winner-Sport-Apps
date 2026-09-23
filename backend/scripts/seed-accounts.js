/**
 * Memastikan akun yang dipakai otomatis oleh sistem ada di bagan akun.
 * Aman dijalankan berulang. Pakai: cd backend && node scripts/seed-accounts.js
 */
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const prisma = require('../api/db');

const AKUN_WAJIB = [
  { code: '1001', name: 'Kas Utama Tunai', type: 'ASSET' },
  { code: '1101', name: 'Piutang Usaha Pelanggan', type: 'ASSET' },
  { code: '1201', name: 'Persediaan Bahan Baku', type: 'ASSET' },
  { code: '1202', name: 'Persediaan Barang Jadi', type: 'ASSET' },
  { code: '2001', name: 'Hutang Usaha Supplier', type: 'LIABILITY' },
  { code: '4001', name: 'Pendapatan Penjualan Konveksi', type: 'REVENUE' },
  { code: '5001', name: 'HPP Produksi Konveksi', type: 'COGS' },
  {
    code: '5101',
    name: 'Biaya Produksi Dibebankan',
    type: 'EXPENSE',
    description:
      'Penampung biaya jahit, upah, dan overhead yang sudah masuk nilai persediaan. ' +
      'Saldonya di sisi kredit dan meniadakan beban upah yang dicatat di menu Pengeluaran, ' +
      'sehingga biaya produksi tidak terhitung dua kali.'
  }
];

async function main() {
  for (const a of AKUN_WAJIB) {
    await prisma.account.upsert({ where: { code: a.code }, update: {}, create: { ...a, balance: 0 } });
  }
  const rows = await prisma.account.findMany({ orderBy: { code: 'asc' } });
  console.log('Bagan akun sekarang:');
  for (const r of rows) console.log(`  ${r.code}  ${r.name.padEnd(32)} ${r.type.padEnd(10)} ${Number(r.balance).toLocaleString('id-ID')}`);
}

if (require.main === module) {
  main().catch((e) => { console.error('Gagal:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
}

module.exports = { AKUN_WAJIB };
