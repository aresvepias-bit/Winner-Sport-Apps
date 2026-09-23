const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const tgl = (iso) => new Date(iso);

// Dua bulan berbeda, supaya bisa dibuktikan bahwa periode benar-benar menyaring.
const prisma = installStub({
  salesOrder: [
    {
      id: 'so-mei', soNumber: 'SO-001', status: 'CONFIRMED', orderDate: tgl('2026-05-10'),
      totalAmount: 10000000,
      items: [{ id: 'soi-1', hppTotal: 6000000 }]
    },
    {
      id: 'so-jun', soNumber: 'SO-002', status: 'CONFIRMED', orderDate: tgl('2026-06-15'),
      totalAmount: 20000000,
      items: [{ id: 'soi-2', hppTotal: 12000000 }]
    },
    {
      id: 'so-batal', soNumber: 'SO-003', status: 'CANCELLED', orderDate: tgl('2026-06-20'),
      totalAmount: 99000000,
      items: [{ id: 'soi-3', hppTotal: 50000000 }]
    },
    {
      id: 'so-tanpa-hpp', soNumber: 'SO-004', status: 'CONFIRMED', orderDate: tgl('2026-06-18'),
      totalAmount: 5000000,
      items: [{ id: 'soi-4', hppTotal: 0 }]
    }
  ],
  expense: [
    { id: 'exp-mei', date: tgl('2026-05-05'), amount: 1000000, category: { name: 'Listrik' } },
    { id: 'exp-jun-1', date: tgl('2026-06-03'), amount: 2000000, category: { name: 'Listrik' } },
    { id: 'exp-jun-2', date: tgl('2026-06-09'), amount: 500000, category: null }
  ],
  payment: [
    { id: 'pay-mei', date: tgl('2026-05-12'), type: 'INCOME', method: 'CASH', amount: 4000000 },
    { id: 'pay-jun-in', date: tgl('2026-06-11'), type: 'INCOME', method: 'BANK_TRANSFER', amount: 15000000 },
    { id: 'pay-jun-in2', date: tgl('2026-06-12'), type: 'INCOME', method: 'CASH', amount: 1000000 },
    { id: 'pay-jun-out', date: tgl('2026-06-14'), type: 'EXPENSE', method: 'BANK_TRANSFER', amount: 7000000 }
  ],
  account: [
    { id: 'a-kas', code: '1001', name: 'Kas Besar', type: 'ASSET', balance: 12000000 },
    { id: 'a-bank', code: '1002', name: 'Bank BCA', type: 'ASSET', balance: 30000000 }
  ]
});

const reportController = require('../controllers/reportController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

const JUNI = { from: '2026-06-01', to: '2026-06-30' };

describe('reportController.profitLoss', () => {
  test('hanya menghitung transaksi di dalam periode', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });

    assert.equal(res.code, 200);
    // 20.000.000 + 5.000.000; order Mei dan order batal tidak ikut.
    assert.equal(res.body.totalRevenue, 25000000);
    assert.equal(res.body.totalHpp, 12000000);
    assert.equal(res.body.totalExpenses, 2500000);
  });

  test('order yang dibatalkan tidak dianggap pendapatan', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });
    assert.ok(res.body.totalRevenue < 99000000, 'order CANCELLED bocor ke pendapatan');
  });

  test('laba kotor, laba bersih, dan marginnya konsisten', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });
    const b = res.body;

    assert.equal(b.grossProfit, b.totalRevenue - b.totalHpp);
    assert.equal(b.netProfit, b.grossProfit - b.totalExpenses);
    assert.equal(b.grossProfitMargin, Number(((b.grossProfit / b.totalRevenue) * 100).toFixed(2)));
  });

  test('coverage memberi tahu berapa baris yang HPP-nya belum terekam', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });
    assert.deepEqual(res.body.coverage, { itemsTotal: 2, itemsWithHpp: 1 });
  });

  test('beban tanpa kategori dikelompokkan sebagai Operasional Umum', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });
    assert.equal(res.body.expenseBreakdown.Listrik, 2000000);
    assert.equal(res.body.expenseBreakdown['Operasional Umum'], 500000);
  });

  test('menyertakan periode sebelumnya yang sama panjang sebagai pembanding', async () => {
    const res = await call(reportController.profitLoss, { query: JUNI });

    assert.ok(res.body.sebelumnya, 'pembanding tidak ada');
    // Periode sebelum 1-30 Juni adalah 30 hari sebelumnya, yang memuat data Mei.
    assert.equal(res.body.sebelumnya.totalRevenue, 10000000);
    assert.equal(res.body.sebelumnya.totalExpenses, 1000000);
  });

  test('tanggal awal setelah tanggal akhir ditolak', async () => {
    const res = await call(reportController.profitLoss, {
      query: { from: '2026-06-30', to: '2026-06-01' }
    });
    assert.equal(res.code, 400);
  });
});

describe('reportController.cashFlow', () => {
  test('memisahkan kas masuk, kas keluar, dan arus bersihnya', async () => {
    const res = await call(reportController.cashFlow, { query: JUNI });

    assert.equal(res.code, 200);
    assert.equal(res.body.masuk.total, 16000000);
    // 7.000.000 ke supplier + 2.500.000 beban operasional
    assert.equal(res.body.keluar.keSupplier, 7000000);
    assert.equal(res.body.keluar.bebanOperasional, 2500000);
    assert.equal(res.body.keluar.total, 9500000);
    assert.equal(res.body.arusKasBersih, 6500000);
  });

  test('kas masuk dirinci per metode pembayaran', async () => {
    const res = await call(reportController.cashFlow, { query: JUNI });
    assert.equal(res.body.masuk.perMetode.BANK_TRANSFER, 15000000);
    assert.equal(res.body.masuk.perMetode.CASH, 1000000);
  });

  test('saldo kas & bank dilaporkan terpisah dari arus periode', async () => {
    const res = await call(reportController.cashFlow, { query: JUNI });
    assert.equal(res.body.saldoKasSekarang.total, 42000000);
    assert.equal(res.body.saldoKasSekarang.accounts.length, 2);
  });
});

describe('reportController.series', () => {
  test('mode bulan menghasilkan 12 periode berlabel nama bulan', async () => {
    const res = await call(reportController.series, { query: { tahun: '2026', mode: 'bulan' } });

    assert.equal(res.code, 200);
    assert.equal(res.body.periode.length, 12);
    assert.equal(res.body.periode[0].label, 'Jan');
    assert.equal(res.body.periode[11].label, 'Des');
  });

  test('angka bulanan jatuh di bulan yang benar', async () => {
    const res = await call(reportController.series, { query: { tahun: '2026', mode: 'bulan' } });
    const mei = res.body.periode[4];
    const juni = res.body.periode[5];

    assert.equal(mei.pendapatan, 10000000);
    assert.equal(juni.pendapatan, 25000000);
    assert.equal(juni.labaKotor, 13000000);
    assert.equal(juni.labaBersih, 10500000);
  });

  test('mode kuartal menggabungkan tiga bulan ke satu periode', async () => {
    const res = await call(reportController.series, { query: { tahun: '2026', mode: 'kuartal' } });

    assert.equal(res.body.periode.length, 4);
    assert.equal(res.body.periode[1].label, 'Q2');
    // Q2 = April+Mei+Juni = 10jt + 25jt
    assert.equal(res.body.periode[1].pendapatan, 35000000);
  });

  test('arus kas ikut terhitung per periode', async () => {
    const res = await call(reportController.series, { query: { tahun: '2026', mode: 'bulan' } });
    const juni = res.body.periode[5];

    assert.equal(juni.kasMasuk, 16000000);
    assert.equal(juni.kasKeluar, 9500000);
  });

  test('tahun di luar akal sehat ditolak', async () => {
    const res = await call(reportController.series, { query: { tahun: '1200' } });
    assert.equal(res.code, 400);
  });
});
