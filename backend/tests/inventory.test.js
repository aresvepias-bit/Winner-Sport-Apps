const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  rawMaterial: [
    { id: 'rm-aman', name: 'Kain Cotton', currentStock: 100, minimumStock: 25, standardCost: 90000 },
    { id: 'rm-tipis', name: 'Benang Jahit', currentStock: 20, minimumStock: 30, standardCost: 15000 },
    { id: 'rm-pas', name: 'Kancing', currentStock: 40, minimumStock: 40, standardCost: 500 }
  ],
  product: [
    { id: 'p-aman', name: 'Jersey Futsal', currentStock: 200, minimumStock: 20, standardCost: 40000 },
    { id: 'p-tipis', name: 'Kaos Polos', currentStock: 5, minimumStock: 30, standardCost: 35000 }
  ]
});

const inventoryController = require('../controllers/inventoryController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

describe('inventoryController.getSummary (sumber alert stok minimum)', () => {
  test('menandai item yang stoknya di bawah atau sama dengan minimum', async () => {
    const res = await call(inventoryController.getSummary, {});
    assert.equal(res.code, 200);

    const namaBahan = res.body.lowStockMaterials.map((m) => m.id).sort();
    assert.deepEqual(namaBahan, ['rm-pas', 'rm-tipis'], 'stok == minimum juga dihitung perlu restock');
    assert.deepEqual(res.body.lowStockProducts.map((p) => p.id), ['p-tipis']);
  });

  test('menghitung nilai persediaan', async () => {
    const res = await call(inventoryController.getSummary, {});
    const nilaiBahan = 100 * 90000 + 20 * 15000 + 40 * 500;
    const nilaiProduk = 200 * 40000 + 5 * 35000;
    assert.equal(res.body.totalRawMaterialStockValue, nilaiBahan);
    assert.equal(res.body.totalProductStockValue, nilaiProduk);
    assert.equal(res.body.totalInventoryValue, nilaiBahan + nilaiProduk);
  });
});

describe('inventoryController opname (alur dua langkah dari halaman Inventori)', () => {
  test('createOpname menghitung selisih fisik vs sistem', async () => {
    const res = await call(inventoryController.createOpname, {
      body: {
        itemType: 'RAW_MATERIAL',
        notes: 'hitung fisik gudang',
        items: [{ rawMaterialId: 'rm-aman', systemQty: 100, physicalQty: 95, notes: 'susut' }]
      }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.status, 'DRAFT', 'opname baru belum mengubah stok');
    assert.equal(res.body.items[0].difference, -5);
    assert.equal(res.body.items[0].rawMaterialId, 'rm-aman');
    assert.equal(Number(prisma.rawMaterial.rows[0].currentStock), 100, 'stok belum berubah sebelum apply');
  });

  test('applyOpname menyesuaikan stok, mencatat mutasi, dan menandai APPLIED', async () => {
    const dibuat = await call(inventoryController.createOpname, {
      body: {
        itemType: 'RAW_MATERIAL',
        items: [{ rawMaterialId: 'rm-tipis', systemQty: 20, physicalQty: 32, notes: 'temuan' }]
      }
    });

    const res = await call(inventoryController.applyOpname, { params: { id: dibuat.body.id } });
    assert.equal(res.code, 200);

    const bahan = prisma.rawMaterial.rows.find((m) => m.id === 'rm-tipis');
    assert.equal(Number(bahan.currentStock), 32, 'stok disetel ke hasil hitung fisik');

    const mov = prisma.stockMovement.rows.at(-1);
    assert.equal(mov.type, 'STOCK_ADJUSTMENT');
    assert.equal(mov.quantity, 12, 'mutasi mencatat selisihnya, bukan stok akhir');
    assert.equal(mov.balanceAfter, 32);
    assert.equal(mov.referenceType, 'OPNAME');

    assert.equal(res.body.opname.status, 'APPLIED');
  });

  test('opname yang sudah diterapkan tidak bisa diterapkan dua kali', async () => {
    const dibuat = await call(inventoryController.createOpname, {
      body: { itemType: 'RAW_MATERIAL', items: [{ rawMaterialId: 'rm-aman', systemQty: 100, physicalQty: 99 }] }
    });
    await call(inventoryController.applyOpname, { params: { id: dibuat.body.id } });

    const stokSetelahSekali = Number(prisma.rawMaterial.rows.find((m) => m.id === 'rm-aman').currentStock);
    const ulang = await call(inventoryController.applyOpname, { params: { id: dibuat.body.id } });

    assert.equal(ulang.code, 400);
    assert.equal(Number(prisma.rawMaterial.rows.find((m) => m.id === 'rm-aman').currentStock), stokSetelahSekali);
  });

  test('opname tidak ditemukan -> 400', async () => {
    const res = await call(inventoryController.applyOpname, { params: { id: 'tidak-ada' } });
    assert.equal(res.code, 400);
  });

  test('selisih 0 tidak membuat mutasi stok', async () => {
    const jumlahMutasiAwal = prisma.stockMovement.rows.length;
    const dibuat = await call(inventoryController.createOpname, {
      body: { itemType: 'RAW_MATERIAL', items: [{ rawMaterialId: 'rm-pas', systemQty: 40, physicalQty: 40 }] }
    });
    await call(inventoryController.applyOpname, { params: { id: dibuat.body.id } });

    assert.equal(prisma.stockMovement.rows.length, jumlahMutasiAwal);
  });
});

// Validasi dan kegagalan transaksi pada aksi gudang.
describe('inventory ERP guardrails', () => {
  test('manual masuk/keluar menjaga saldo dan kartu stok', async () => {
    const before = Number(prisma.rawMaterial.rows.find(x => x.id === 'rm-aman').currentStock);
    const incoming = await call(inventoryController.createManualMovement, { body: { itemType: 'RAW_MATERIAL', rawMaterialId: 'rm-aman', quantity: 2.25, notes: 'koreksi' } });
    assert.equal(incoming.code, 201);
    assert.equal(incoming.body.balanceAfter, before + 2.25);
    const outgoing = await call(inventoryController.createManualMovement, { body: { itemType: 'RAW_MATERIAL', rawMaterialId: 'rm-aman', quantity: -2.25, notes: 'koreksi keluar' } });
    assert.equal(outgoing.body.balanceAfter, before);
    assert.equal(outgoing.body.quantity, -2.25);
  });

  test('menolak stok negatif, pecahan produk, dan input invalid tanpa perubahan', async () => {
    const before = JSON.stringify(prisma.product.rows);
    const count = prisma.stockMovement.rows.length;
    for (const quantity of [-99999, 1.5, 0, 'Infinity', null, 0.001]) {
      const res = await call(inventoryController.createManualMovement, { body: { itemType: 'PRODUCT', productId: 'p-tipis', quantity, notes: 'uji' } });
      assert.equal(res.code, 400);
    }
    const noReason = await call(inventoryController.createManualMovement, { body: { itemType: 'PRODUCT', productId: 'p-tipis', quantity: 1 } });
    assert.equal(noReason.code, 400);
    assert.equal(JSON.stringify(prisma.product.rows), before);
    assert.equal(prisma.stockMovement.rows.length, count);
  });

  test('draft mengambil saldo server dan menolak saldo klien usang', async () => {
    const res = await call(inventoryController.createOpname, { body: { itemType: 'PRODUCT', items: [{ productId: 'p-tipis', physicalQty: 7 }] } });
    assert.equal(res.code, 201);
    assert.equal(res.body.items[0].systemQty, 5);
    const stale = await call(inventoryController.createOpname, { body: { itemType: 'PRODUCT', items: [{ productId: 'p-tipis', systemQty: 999, physicalQty: 7 }] } });
    assert.equal(stale.code, 409);
  });

  test('stok berubah setelah draft tidak ditimpa oleh opname', async () => {
    const draft = await call(inventoryController.createOpname, { body: { itemType: 'PRODUCT', items: [{ productId: 'p-tipis', physicalQty: 7 }] } });
    await call(inventoryController.createManualMovement, { body: { itemType: 'PRODUCT', productId: 'p-tipis', quantity: 1, notes: 'barang ditemukan' } });
    const res = await call(inventoryController.applyOpname, { params: { id: draft.body.id } });
    assert.equal(res.code, 409);
    assert.equal(prisma.product.rows.find(x => x.id === 'p-tipis').currentStock, 6);
    assert.equal(draft.body.status, 'DRAFT');
  });

  test('menolak opname kosong, duplikat, negatif, dan tipe salah', async () => {
    for (const body of [
      { itemType: 'PRODUCT', items: [] },
      { itemType: 'INVALID', items: [{ productId: 'p-tipis', physicalQty: 1 }] },
      { itemType: 'PRODUCT', items: [{ productId: 'p-tipis', physicalQty: -1 }] },
      { itemType: 'PRODUCT', items: [{ productId: 'p-tipis', physicalQty: 1 }, { productId: 'p-tipis', physicalQty: 2 }] }
    ]) assert.equal((await call(inventoryController.createOpname, { body })).code, 400);
  });

  test('kartu stok difilter menurut barang dan limit divalidasi', async () => {
    const res = await call(inventoryController.getMovements, { query: { itemType: 'RAW_MATERIAL', itemId: 'rm-aman', limit: 100 } });
    assert.equal(res.code, 200);
    assert.ok(res.body.every(x => x.rawMaterialId === 'rm-aman'));
    assert.equal((await call(inventoryController.getMovements, { query: { limit: -1 } })).code, 400);
  });

  test('saldo dan mutasi berada dalam transaksi yang sama saat pencatatan gagal', async () => {
    const originalTransaction = prisma.$transaction;
    const originalCreate = prisma.stockMovement.create;
    const before = Number(prisma.product.rows.find(x => x.id === 'p-tipis').currentStock);
    let transactionCount = 0;
    // Emulasi rollback; pengujian ini tidak menggantikan uji konkurensi PostgreSQL.
    prisma.$transaction = async (fn, options) => {
      transactionCount++;
      assert.equal(options.isolationLevel, 'Serializable');
      const snapshots = Object.values(prisma).filter(x => x && x.rows).map(model => [model, structuredClone(model.rows)]);
      try { return await fn(prisma); }
      catch (err) { for (const [model, rows] of snapshots) model.rows.splice(0, model.rows.length, ...rows); throw err; }
    };
    prisma.stockMovement.create = async () => { throw new Error('simulated write failure'); };
    try {
      const res = await call(inventoryController.createManualMovement, { body: { itemType: 'PRODUCT', productId: 'p-tipis', quantity: 2, notes: 'uji rollback' } });
      assert.equal(res.code, 500);
      assert.equal(transactionCount, 1);
      assert.equal(prisma.product.rows.find(x => x.id === 'p-tipis').currentStock, before);
    } finally { prisma.$transaction = originalTransaction; prisma.stockMovement.create = originalCreate; }
  });
});
