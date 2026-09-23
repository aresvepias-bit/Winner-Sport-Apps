const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const AKUN_AWAL = [
  { id: 'a-kas', code: '1001', name: 'Kas', type: 'ASSET', balance: 5000000 },
  { id: 'a-piutang', code: '1101', name: 'Piutang', type: 'ASSET', balance: 0 },
  { id: 'a-bahan', code: '1201', name: 'Persediaan Bahan', type: 'ASSET', balance: 0 },
  { id: 'a-jadi', code: '1202', name: 'Persediaan Jadi', type: 'ASSET', balance: 0 },
  { id: 'a-pendapatan', code: '4001', name: 'Pendapatan', type: 'REVENUE', balance: 0 },
  { id: 'a-hpp', code: '5001', name: 'HPP', type: 'COGS', balance: 0 },
  { id: 'a-dibebankan', code: '5101', name: 'Biaya Produksi Dibebankan', type: 'EXPENSE', balance: 0 }
];

const produk = { id: 'p-1', name: 'Jersey', standardCost: 32500, currentStock: 500 };

const prisma = installStub({
  account: AKUN_AWAL.map((a) => ({ ...a })),
  product: [produk],
  unit: [
    { id: 'u-pcs', name: 'Pcs', symbol: 'pcs', ratioToPcs: 1, isActive: true },
    { id: 'u-kodi', name: 'Kodi', symbol: 'kodi', ratioToPcs: 20, isActive: true }
  ],
  contact: [{ id: 'c-1', name: 'Pelanggan', type: 'CUSTOMER' }]
});

const { postJournal, AKUN } = require('../api/journal');
const salesController = require('../controllers/salesController');

const saldo = (code) => Number(prisma.account.rows.find((a) => a.code === code).balance);

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

beforeEach(() => {
  for (const a of prisma.account.rows) {
    a.balance = AKUN_AWAL.find((x) => x.code === a.code).balance;
  }
  prisma.journalEntry.rows.length = 0;
  prisma.salesOrder.rows.length = 0;
  prisma.salesOrderItem.rows.length = 0;
  produk.currentStock = 500;
  produk.standardCost = 32500; // dikembalikan agar test tidak saling mempengaruhi
});

describe('postJournal menjaga pembukuan tetap benar', () => {
  test('jurnal yang tidak seimbang ditolak, bukan disimpan diam-diam', async () => {
    await assert.rejects(
      () => postJournal(prisma, {
        description: 'timpang',
        lines: [{ code: '1001', debit: 100 }, { code: '4001', credit: 60 }]
      }),
      /tidak seimbang/
    );
    assert.equal(prisma.journalEntry.rows.length, 0);
  });

  test('akun yang belum ada di bagan akun ditolak dengan pesan jelas', async () => {
    await assert.rejects(
      () => postJournal(prisma, {
        description: 'akun asing',
        lines: [{ code: '9999', debit: 100 }, { code: '1001', credit: 100 }]
      }),
      /belum ada di bagan akun/
    );
  });

  test('saldo bertambah sesuai sifat akun, bukan asal ditambah', async () => {
    await postJournal(prisma, {
      description: 'uji arah saldo',
      lines: [
        { code: '1101', debit: 1000 }, // aset naik di debit
        { code: '4001', credit: 1000 } // pendapatan naik di kredit
      ]
    });

    assert.equal(saldo('1101'), 1000);
    assert.equal(saldo('4001'), 1000, 'pendapatan harus naik, bukan turun');
  });

  test('kredit pada akun aset menurunkan saldonya', async () => {
    await postJournal(prisma, {
      description: 'persediaan keluar',
      lines: [{ code: '5001', debit: 700 }, { code: '1202', credit: 700 }]
    });

    assert.equal(saldo('1202'), -700);
    assert.equal(saldo('5001'), 700);
  });

  test('baris bernilai nol diabaikan, dan jurnal kosong tidak dibuat', async () => {
    const hasil = await postJournal(prisma, { description: 'kosong', lines: [{ code: '1001', debit: 0 }] });
    assert.equal(hasil, null);
    assert.equal(prisma.journalEntry.rows.length, 0);
  });

  test('total debit selalu sama dengan total kredit pada jurnal tersimpan', async () => {
    await postJournal(prisma, {
      description: 'produksi',
      lines: [
        { code: '1202', debit: 4000000 },
        { code: '1201', credit: 2125000 },
        { code: '5101', credit: 1875000 }
      ]
    });

    const entry = prisma.journalEntry.rows.at(-1);
    const d = entry.items.reduce((a, i) => a + Number(i.debit), 0);
    const k = entry.items.reduce((a, i) => a + Number(i.credit), 0);
    assert.equal(d, k);
    assert.equal(d, 4000000);
  });
});

describe('penjualan merekam HPP dan menjurnalnya', () => {
  const buatOrder = (over = {}) =>
    call(salesController.createOrder, {
      body: {
        customerId: 'c-1',
        orderType: 'KODIAN',
        items: [{ productId: 'p-1', quantity: 5, unitName: 'kodi', pricePerUnit: 1200000 }],
        ...over
      }
    });

  test('HPP direkam pada barisnya, dihitung per pcs', async () => {
    const res = await buatOrder();
    assert.equal(res.code, 201);

    const item = res.body.items[0];
    // 5 kodi = 100 pcs, HPP acuan 32.500 -> 3.250.000
    assert.equal(Number(item.hppPerPcs), 32500);
    assert.equal(Number(item.hppTotal), 3250000);
  });

  test('mengubah HPP acuan produk TIDAK mengubah HPP order yang sudah terjadi', async () => {
    const res = await buatOrder();
    const sebelum = Number(res.body.items[0].hppTotal);

    produk.standardCost = 99000; // harga bahan naik bulan depan

    // Dibaca ulang dari data tersimpan, bukan dari nilai kembalian tadi.
    const orderTersimpan = prisma.salesOrder.rows.at(-1);
    const baris = orderTersimpan.items[0];
    assert.equal(Number(baris.hppTotal), 3250000, 'HPP order lama harus tetap');
    assert.equal(Number(baris.hppTotal), sebelum);
  });

  test('jurnal penjualan mengisi akun HPP dan pendapatan', async () => {
    await buatOrder();

    assert.equal(saldo('4001'), 6000000, 'pendapatan = 5 x 1.200.000');
    assert.equal(saldo('1101'), 6000000, 'piutang sebesar tagihan');
    assert.equal(saldo('5001'), 3250000, 'akun HPP akhirnya terisi');
    assert.equal(saldo('1202'), -3250000, 'persediaan jadi berkurang sebesar HPP');
  });

  test('pesanan custom tanpa produk master tidak mengarang HPP', async () => {
    const res = await buatOrder({
      items: [{ customDescription: 'Sablon khusus', quantity: 10, unitName: 'pcs', pricePerUnit: 75000 }]
    });

    assert.equal(Number(res.body.items[0].hppTotal), 0);
    assert.equal(saldo('5001'), 0, 'tidak ada HPP yang dijurnal');
    assert.equal(saldo('4001'), 750000, 'pendapatan tetap diakui');
  });

  test('jurnal penjualan seimbang', async () => {
    await buatOrder();
    const entry = prisma.journalEntry.rows.at(-1);
    const d = entry.items.reduce((a, i) => a + Number(i.debit), 0);
    const k = entry.items.reduce((a, i) => a + Number(i.credit), 0);
    assert.equal(d, k);
    assert.equal(entry.referenceType, 'SO');
  });
});
