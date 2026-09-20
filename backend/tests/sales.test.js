const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  contact: [{ id: 'c-1', name: 'FC Juara Futsal', type: 'CUSTOMER' }],
  account: [{ id: 'acc-kas', name: 'Kas Utama Tunai', balance: 1000000 }],
  invoice: [
    { id: 'inv-1', invoiceNumber: 'INV-1', salesOrderId: 'so-1', totalAmount: 1000000, paidAmount: 0, status: 'UNPAID' },
    { id: 'inv-2', invoiceNumber: 'INV-2', salesOrderId: 'so-2', totalAmount: 500000, paidAmount: 0, status: 'UNPAID' }
  ],
  salesOrder: [
    { id: 'so-1', soNumber: 'SO-1', totalAmount: 1000000, paidAmount: 0, paymentStatus: 'UNPAID' },
    { id: 'so-2', soNumber: 'SO-2', totalAmount: 500000, paidAmount: 0, paymentStatus: 'UNPAID' }
  ]
});

const salesController = require('../controllers/salesController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

const itemContoh = [{ customDescription: 'Jersey custom', quantity: 50, unitName: 'pcs', pricePerUnit: 75000 }];

describe('salesController.createOrder', () => {
  test('membuat SO beserta invoice-nya', async () => {
    const res = await call(salesController.createOrder, {
      body: { customerId: 'c-1', orderType: 'CUSTOM_ORDER', items: itemContoh }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.totalAmount, 3750000);
    assert.equal(res.body.status, 'CONFIRMED');
    assert.equal(res.body.paymentStatus, 'UNPAID');
    assert.equal(res.body.invoices.length, 1, 'invoice diterbitkan bersama SO');
  });

  test('tanpa customerId ditolak (regresi: dulu di-hardcode "1")', async () => {
    const res = await call(salesController.createOrder, { body: { orderType: 'KODIAN', items: itemContoh } });
    assert.equal(res.code, 400);
  });

  test('tanpa item ditolak', async () => {
    const res = await call(salesController.createOrder, { body: { customerId: 'c-1', items: [] } });
    assert.equal(res.code, 400);
  });

  test('total = subtotal - diskon + pajak', async () => {
    const res = await call(salesController.createOrder, {
      body: { customerId: 'c-1', items: [{ quantity: 10, pricePerUnit: 100000 }], discount: 50000, tax: 25000 }
    });
    assert.equal(res.body.subtotal, 1000000);
    assert.equal(res.body.totalAmount, 975000);
  });

  test('mencatat pembuat order dari sesi (req.user)', async () => {
    const res = await call(salesController.createOrder, {
      body: { customerId: 'c-1', items: itemContoh },
      user: { id: 'u-sales', role: 'SALES' }
    });
    assert.equal(res.body.createdById, 'u-sales');
  });
});

describe('salesController.createPayment', () => {
  test('pembayaran sebagian -> status PARTIAL di invoice dan SO', async () => {
    const res = await call(salesController.createPayment, {
      body: { invoiceId: 'inv-1', amount: 400000, method: 'CASH', accountId: 'acc-kas' }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.invoiceStatus, 'PARTIAL');
    assert.equal(prisma.invoice.rows.find((i) => i.id === 'inv-1').status, 'PARTIAL');
    assert.equal(prisma.salesOrder.rows.find((s) => s.id === 'so-1').paymentStatus, 'PARTIAL');
  });

  test('pelunasan sisa tagihan -> PAID', async () => {
    const res = await call(salesController.createPayment, {
      body: { invoiceId: 'inv-1', amount: 600000, method: 'BANK_TRANSFER' }
    });

    assert.equal(res.body.invoiceStatus, 'PAID');
    const inv = prisma.invoice.rows.find((i) => i.id === 'inv-1');
    assert.equal(Number(inv.paidAmount), 1000000);
    assert.equal(inv.status, 'PAID');
  });

  test('menambah saldo rekening penerima', async () => {
    const kas = prisma.account.rows[0];
    const saldoAwal = Number(kas.balance);
    await call(salesController.createPayment, {
      body: { invoiceId: 'inv-2', amount: 150000, accountId: 'acc-kas' }
    });
    assert.equal(Number(kas.balance), saldoAwal + 150000);
  });

  test('tanpa invoice atau nominal <= 0 ditolak', async () => {
    assert.equal((await call(salesController.createPayment, { body: { amount: 1000 } })).code, 400);
    assert.equal((await call(salesController.createPayment, { body: { invoiceId: 'inv-2', amount: 0 } })).code, 400);
  });

  test('invoice tidak ditemukan -> 404', async () => {
    const res = await call(salesController.createPayment, { body: { invoiceId: 'tidak-ada', amount: 1000 } });
    assert.equal(res.code, 404);
  });
});
