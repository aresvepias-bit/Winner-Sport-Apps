/**
 * Mengisi HPP pada baris penjualan lama yang dibuat SEBELUM HPP mulai direkam.
 *
 * Nilainya diambil dari HPP acuan produk SAAT INI, jadi ini perkiraan, bukan
 * biaya sebenarnya pada tanggal transaksi itu. Tanpa pengisian ini Laba Rugi
 * akan menampilkan HPP nol untuk order lama dan laba terlihat terlalu besar.
 *
 * Aman dijalankan berulang: hanya menyentuh baris yang HPP-nya masih 0.
 * Pakai: cd backend && node scripts/backfill-hpp.js [--tulis]
 */
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const prisma = require('../api/db');
const { toPcs } = require('../api/unitConversion');

async function main() {
  const tulis = process.argv.includes('--tulis');

  const items = await prisma.salesOrderItem.findMany({
    where: { hppTotal: 0 },
    include: { product: true, salesOrder: { select: { soNumber: true } } }
  });

  if (items.length === 0) {
    console.log('Tidak ada baris yang perlu diisi.');
    return;
  }

  console.log(`${items.length} baris penjualan belum punya HPP:\n`);
  let bisa = 0;
  let tanpaProduk = 0;

  for (const it of items) {
    const pcs = await toPcs(it.quantity, it.unitName);
    const hppPerPcs = it.product ? Number(it.product.standardCost) : 0;
    const hppTotal = Math.round(pcs * hppPerPcs * 100) / 100;

    const nama = it.product ? it.product.name : (it.customDescription || 'Pesanan custom');
    console.log(
      `  ${it.salesOrder.soNumber}  ${nama.slice(0, 34).padEnd(36)} ` +
      `${pcs} pcs x ${hppPerPcs.toLocaleString('id-ID')} = ${hppTotal.toLocaleString('id-ID')}` +
      (it.product ? '' : '   <- tanpa produk master, HPP tidak diketahui')
    );

    if (!it.product) tanpaProduk++;
    else bisa++;

    if (tulis && hppTotal > 0) {
      await prisma.salesOrderItem.update({ where: { id: it.id }, data: { hppPerPcs, hppTotal } });
    }
  }

  console.log(`\n${bisa} baris bisa diisi, ${tanpaProduk} baris tanpa produk master (tetap 0).`);
  console.log(tulis ? 'Perubahan SUDAH disimpan.' : 'Ini hanya pratinjau. Jalankan ulang dengan --tulis untuk menyimpan.');
}

main().catch((e) => { console.error('Gagal:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
