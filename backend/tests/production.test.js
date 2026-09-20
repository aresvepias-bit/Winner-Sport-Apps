const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const produk = { id: 'p-1', name: 'Jersey Futsal', currentStock: 100, standardCost: 40000 };
const bahan = { id: 'rm-1', name: 'Kain Dryfit', currentStock: 500, standardCost: 85000 };
const woMaterial = { id: 'wom-1', workOrderId: 'wo-1', rawMaterialId: 'rm-1', actualIssuedQty: 0, unitCost: 0, subtotal: 0, rawMaterial: bahan };

const prisma = installStub({
  product: [produk],
  rawMaterial: [bahan],
  bom: [{
    id: 'bom-1', productId: 'p-1', isActive: true, wastePercent: 10,
    items: [{ rawMaterialId: 'rm-1', quantityPerPcs: 0.25, rawMaterial: bahan }]
  }],
  workOrder: [{
    id: 'wo-1', woNumber: 'SPK-000001', productId: 'p-1', targetQty: 100, completedQty: 0,
    status: 'IN_PROGRESS', materialCost: 2125000, product: produk, materials: [woMaterial]
  }],
  workOrderMaterial: [woMaterial]
});

const productionController = require('../controllers/productionController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

describe('productionController.createWorkOrder', () => {
  test('menghitung rencana pemakaian bahan dari BOM aktif beserta faktor susut', async () => {
    const res = await call(productionController.createWorkOrder, {
      body: { productId: 'p-1', targetQty: 100, dueDate: '2026-10-01', notes: 'batch A' }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.status, 'DRAFT');
    assert.equal(res.body.bomId, 'bom-1', 'BOM aktif produk dipakai otomatis');
    // 0,25 kg/pcs x 100 pcs x 1,1 (susut 10%) = 27,5 kg
    // Dibandingkan dengan toleransi: hasil kali float memberi 27.500000000000004.
    assert.ok(Math.abs(res.body.materials[0].plannedQty - 27.5) < 1e-9, `plannedQty = ${res.body.materials[0].plannedQty}`);
    assert.equal(res.body.materials[0].unitCost, 85000);
    assert.equal(Number(res.body.materialCost), 0, 'biaya bahan baru terisi saat bahan dikeluarkan');
  });

  test('tanpa produk atau qty tidak valid ditolak', async () => {
    for (const body of [{ targetQty: 10 }, { productId: 'p-1', targetQty: 0 }, { productId: 'p-1', targetQty: -5 }]) {
      const res = await call(productionController.createWorkOrder, { body });
      assert.equal(res.code, 400, `${JSON.stringify(body)} seharusnya ditolak`);
    }
  });
});

describe('productionController.issueMaterials', () => {
  test('mengurangi stok bahan, mencatat mutasi negatif, dan menambah biaya bahan SPK', async () => {
    const stokAwal = Number(bahan.currentStock);
    const biayaAwal = Number(prisma.workOrder.rows[0].materialCost);

    const res = await call(productionController.issueMaterials, {
      params: { id: 'wo-1' },
      body: { materials: [{ rawMaterialId: 'rm-1', issuedQty: 20 }] }
    });

    assert.equal(res.code, 200);
    assert.equal(Number(bahan.currentStock), stokAwal - 20);

    const mov = prisma.stockMovement.rows.at(-1);
    assert.equal(mov.type, 'MATERIAL_ISSUE');
    assert.equal(mov.quantity, -20, 'pengeluaran bahan dicatat negatif');
    assert.equal(mov.balanceAfter, stokAwal - 20);

    const wo = prisma.workOrder.rows[0];
    assert.equal(wo.status, 'IN_PROGRESS');
    assert.equal(Number(wo.materialCost), biayaAwal + 20 * 85000);
  });

  test('SPK tidak ditemukan -> 404', async () => {
    const res = await call(productionController.issueMaterials, { params: { id: 'tidak-ada' }, body: { materials: [] } });
    assert.equal(res.code, 404);
  });
});

describe('productionController.completeWorkOrder', () => {
  test('menghitung HPP per pcs dari seluruh komponen biaya', async () => {
    const wo = prisma.workOrder.rows[0];
    wo.materialCost = 2125000;
    wo.status = 'IN_PROGRESS';
    const stokProdukAwal = Number(produk.currentStock);

    const res = await call(productionController.completeWorkOrder, {
      params: { id: 'wo-1' },
      body: { completedQty: 100, scrapQty: 4, sewingCost: 1000000, laborCost: 500000, overheadCost: 375000 }
    });

    assert.equal(res.code, 200);
    // (2.125.000 + 1.000.000 + 500.000 + 375.000) / 100 = 40.000
    assert.equal(res.body.summary.totalCost, 4000000);
    assert.equal(res.body.summary.hppPerPcs, 40000);
    assert.equal(prisma.workOrder.rows[0].status, 'COMPLETED');
    assert.equal(Number(produk.currentStock), stokProdukAwal + 100, 'hanya Grade A yang masuk stok');
  });

  test('mencatat mutasi hasil produksi dan mutasi barang rijek terpisah', async () => {
    const tipeMutasi = prisma.stockMovement.rows.slice(-2).map((m) => m.type);
    assert.deepEqual(tipeMutasi, ['PRODUCTION_RESULT', 'SCRAP_WASTE']);
  });

  test('qty jadi 0 ditolak (mencegah pembagian nol saat hitung HPP)', async () => {
    const res = await call(productionController.completeWorkOrder, {
      params: { id: 'wo-1' },
      body: { completedQty: 0, sewingCost: 100 }
    });
    assert.equal(res.code, 400);
  });

  test('SPK tidak ditemukan -> 404', async () => {
    const res = await call(productionController.completeWorkOrder, {
      params: { id: 'tidak-ada' },
      body: { completedQty: 10 }
    });
    assert.equal(res.code, 404);
  });

  test('updateProductHpp memperbarui HPP standar produk', async () => {
    const wo = prisma.workOrder.rows[0];
    wo.materialCost = 1000000;
    const res = await call(productionController.completeWorkOrder, {
      params: { id: 'wo-1' },
      body: { completedQty: 50, sewingCost: 0, laborCost: 0, overheadCost: 0, updateProductHpp: true }
    });

    assert.equal(res.code, 200);
    assert.equal(Number(produk.standardCost), 20000, 'HPP standar ikut diperbarui');
  });
});
