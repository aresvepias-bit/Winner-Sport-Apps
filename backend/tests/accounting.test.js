const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  account: [
    { id: 'acc-kas', code: '1001', name: 'Kas Utama Tunai', type: 'ASSET', balance: 5000000 },
    { id: 'acc-bca', code: '1002', name: 'Bank BCA Operasional', type: 'ASSET', balance: 25000000 }
  ],
  category: [{ id: 'cat-ops', name: 'Operasional Pabrik', type: 'EXPENSE' }]
});

const accountingController = require('../controllers/accountingController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

describe('accountingController.createExpense', () => {
  test('menyimpan kategori dan rekening dari ID (regresi: dulu keduanya hilang)', async () => {
    const res = await call(accountingController.createExpense, {
      body: { categoryId: 'cat-ops', accountId: 'acc-kas', amount: 500000, recipient: 'PLN', notes: 'listrik' }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.categoryId, 'cat-ops');
    assert.equal(res.body.accountId, 'acc-kas');
    assert.equal(Number(res.body.amount), 500000);
    assert.match(res.body.expenseNumber, /^EXP-\d{6}$/);
  });

  test('mengurangi saldo rekening kas (regresi: dulu saldo tidak pernah berubah)', async () => {
    const kas = prisma.account.rows.find((a) => a.id === 'acc-kas');
    const saldoAwal = Number(kas.balance);

    await call(accountingController.createExpense, {
      body: { categoryId: 'cat-ops', accountId: 'acc-kas', amount: 250000, recipient: 'Toko Jahit' }
    });

    assert.equal(Number(kas.balance), saldoAwal - 250000);
  });

  test('rekening lain tidak ikut berubah', async () => {
    const bca = prisma.account.rows.find((a) => a.id === 'acc-bca');
    const saldoBca = Number(bca.balance);
    await call(accountingController.createExpense, {
      body: { accountId: 'acc-kas', amount: 1000, recipient: 'X' }
    });
    assert.equal(Number(bca.balance), saldoBca);
  });

  test('nominal 0 atau negatif ditolak', async () => {
    for (const amount of [0, -5000]) {
      const res = await call(accountingController.createExpense, { body: { accountId: 'acc-kas', amount, recipient: 'X' } });
      assert.equal(res.code, 400, `amount ${amount} seharusnya ditolak`);
    }
  });

  test('tanpa rekening tetap tercatat, saldo tidak disentuh', async () => {
    const kas = prisma.account.rows.find((a) => a.id === 'acc-kas');
    const saldoAwal = Number(kas.balance);
    const res = await call(accountingController.createExpense, { body: { amount: 75000, recipient: 'Kurir' } });

    assert.equal(res.code, 201);
    assert.equal(Number(kas.balance), saldoAwal);
  });
});

describe('accountingController.getCashBank', () => {
  test('mengembalikan rekening kas/bank beserta total saldo', async () => {
    const res = await call(accountingController.getCashBank, {});
    assert.equal(res.code, 200);
    const total = prisma.account.rows.reduce((sum, a) => sum + Number(a.balance), 0);
    assert.equal(res.body.totalCash, total);
  });
});
