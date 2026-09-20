const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  rawMaterial: [{ id: 'rm-1', name: 'Kain Dryfit', currentStock: 50, standardCost: 85000 }],
  purchaseOrder: [{
    id: 'po-1', poNumber: 'PO-000001', supplierId: 's-1', status: 'ORDERED',
    supplier: { name: 'CV Multi Tekstil' },
    items: [{ id: 'poi-1', rawMaterialId: 'rm-1', quantity: 100, unitPrice: 85000, receivedQty: 0 }]
  }]
});
// purchaseOrderItem.update dicari berdasarkan id; seed agar menunjuk objek yang sama dengan item PO.
prisma.purchaseOrderItem.rows.push(prisma.purchaseOrder.rows[0].items[0]);

const purchaseController = require('../controllers/purchaseController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

describe('purchaseController.createOrder', () => {
  test('menerima payload dari halaman Purchasing (header + items[])', async () => {
    const res = await call(purchaseController.createOrder, {
      body: {
        supplierId: 's-1',
        expectedDate: '2026-09-25',
        notes: 'restock',
        items: [{ rawMaterialId: 'rm-1', quantity: 100, unitPrice: 85000 }]
      }
    });
    assert.equal(res.code, 201);
    assert.equal(res.body.totalAmount, 8500000);
    assert.equal(res.body.items[0].subtotal, 8500000);
    assert.equal(res.body.status, 'ORDERED');
  });

  test('payload datar versi lama ditolak (regresi: dulu PO tidak pernah tersimpan)', async () => {
    const res = await call(purchaseController.createOrder, {
      body: { supplierId: 's-1', rawMaterialId: 'rm-1', quantity: 100, unitPrice: 85000 }
    });
    assert.equal(res.code, 400);
  });

  test('tanpa supplier ditolak', async () => {
    const res = await call(purchaseController.createOrder, {
      body: { items: [{ rawMaterialId: 'rm-1', quantity: 1, unitPrice: 1 }] }
    });
    assert.equal(res.code, 400);
  });

  test('total dijumlahkan dari semua item', async () => {
    const res = await call(purchaseController.createOrder, {
      body: {
        supplierId: 's-1',
        items: [
          { rawMaterialId: 'rm-1', quantity: 10, unitPrice: 1000 },
          { rawMaterialId: 'rm-1', quantity: 5, unitPrice: 2000 }
        ]
      }
    });
    assert.equal(res.body.totalAmount, 20000);
  });
});

describe('purchaseController.receiveOrder', () => {
  test('menambah stok bahan, mencatat mutasi, dan menandai PO diterima', async () => {
    const stokAwal = Number(prisma.rawMaterial.rows[0].currentStock);
    const res = await call(purchaseController.receiveOrder, {
      params: { id: 'po-1' },
      body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 100 }] }
    });

    assert.equal(res.code, 200);
    assert.equal(Number(prisma.rawMaterial.rows[0].currentStock), stokAwal + 100);

    const mov = prisma.stockMovement.rows.at(-1);
    assert.equal(mov.type, 'GOODS_RECEIPT');
    assert.equal(mov.quantity, 100);
    assert.equal(mov.balanceAfter, stokAwal + 100);
    assert.equal(mov.referenceId, 'PO-000001');

    assert.equal(prisma.purchaseOrder.rows[0].status, 'RECEIVED');
    assert.equal(Number(prisma.purchaseOrder.rows[0].items[0].receivedQty), 100);
  });

  test('PO tidak ditemukan -> 404', async () => {
    const res = await call(purchaseController.receiveOrder, { params: { id: 'tidak-ada' }, body: { items: [] } });
    assert.equal(res.code, 404);
  });

  test('qty diterima 0 tidak mengubah stok', async () => {
    const stokAwal = Number(prisma.rawMaterial.rows[0].currentStock);
    await call(purchaseController.receiveOrder, {
      params: { id: 'po-1' },
      body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 0 }] }
    });
    assert.equal(Number(prisma.rawMaterial.rows[0].currentStock), stokAwal);
  });
});
