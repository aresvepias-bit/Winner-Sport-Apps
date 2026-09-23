const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const AKUN_AWAL = [
  { id: 'a-bahan', code: '1201', name: 'Persediaan Bahan', type: 'ASSET', balance: 0 },
  { id: 'a-hutang', code: '2001', name: 'Hutang Supplier', type: 'LIABILITY', balance: 0 }
];

const prisma = installStub({
  account: AKUN_AWAL.map((a) => ({ ...a })),
  rawMaterial: [{ id: 'rm-1', name: 'Kain Dryfit', currentStock: 50, standardCost: 85000 }],
  purchaseOrder: [{
    id: 'po-1', poNumber: 'PO-000001', supplierId: 's-1', status: 'ORDERED',
    supplier: { name: 'CV Multi Tekstil' },
    items: [{ id: 'poi-1', purchaseOrderId: 'po-1', rawMaterialId: 'rm-1', quantity: 100, unitPrice: 85000, receivedQty: 0, rawMaterial: { id: 'rm-1', name: 'Kain Dryfit' } }]
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

const saldo = (code) => Number(prisma.account.rows.find((a) => a.code === code).balance);

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

describe('penerimaan barang: status, batas, dan jurnal', () => {
  // Tiap pengujian butuh PO sendiri: kalau id-nya sama, findUnique mengambil
  // PO milik pengujian sebelumnya dan hasilnya membingungkan.
  let urutan = 0;
  const buatPO = () => {
    const id = `po-x${++urutan}`;
    const item = {
      id: `poi-${id}`, purchaseOrderId: id, rawMaterialId: 'rm-1',
      quantity: 100, unitPrice: 85000, receivedQty: 0,
      rawMaterial: prisma.rawMaterial.rows[0] // seperti hasil include di controller
    };
    const po = {
      id, poNumber: `PO-0000${urutan}`, supplierId: 's-1', status: 'ORDERED',
      supplier: { name: 'CV Multi Tekstil' }, items: [item]
    };
    prisma.purchaseOrder.rows.push(po);
    prisma.purchaseOrderItem.rows.push(item);
    return { po, item };
  };

  test('terima sebagian membuat PO tetap terbuka, bukan langsung selesai', async () => {
    const { po, item } = buatPO();
    const res = await call(purchaseController.receiveOrder, {
      params: { id: po.id },
      body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 40 }] }
    });

    assert.equal(res.code, 200);
    assert.equal(po.status, 'PARTIAL', 'PO belum boleh ditandai selesai');
    assert.equal(Number(item.receivedQty), 40);
  });

  test('sisa kiriman menutup PO menjadi diterima penuh', async () => {
    const { po } = buatPO();
    await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 60 }] } });
    await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 40 }] } });
    assert.equal(po.status, 'RECEIVED');
  });

  test('menolak jumlah melebihi sisa pesanan, tanpa mengubah stok', async () => {
    const { po } = buatPO();
    const stokAwal = Number(prisma.rawMaterial.rows[0].currentStock);
    const res = await call(purchaseController.receiveOrder, {
      params: { id: po.id },
      body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 500 }] }
    });

    assert.equal(res.code, 400);
    assert.match(res.body.error, /melebihi sisa pesanan/);
    assert.equal(Number(prisma.rawMaterial.rows[0].currentStock), stokAwal);
  });

  test('PO yang sudah diterima penuh tidak bisa diterima lagi', async () => {
    const { po } = buatPO();
    await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 100 }] } });
    const lagi = await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 1 }] } });
    assert.equal(lagi.code, 400);
  });

  test('barang di luar PO ditolak', async () => {
    const { po } = buatPO();
    const res = await call(purchaseController.receiveOrder, {
      params: { id: po.id },
      body: { items: [{ rawMaterialId: 'rm-asing', receivedQty: 5 }] }
    });
    assert.equal(res.code, 400);
    assert.match(res.body.error, /bukan bagian dari PO/);
  });

  test('menambah persediaan dan hutang supplier sebesar nilai yang diterima', async () => {
    const { po } = buatPO();
    const bahanAwal = saldo('1201');
    const hutangAwal = saldo('2001');

    await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 10 }] } });

    const nilai = 10 * 85000;
    assert.equal(saldo('1201'), bahanAwal + nilai, 'persediaan bahan bertambah');
    assert.equal(saldo('2001'), hutangAwal + nilai, 'hutang ke supplier bertambah');
  });

  test('tanpa jumlah terisi ditolak', async () => {
    const { po } = buatPO();
    assert.equal((await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [] } })).code, 400);
    assert.equal((await call(purchaseController.receiveOrder, { params: { id: po.id }, body: { items: [{ rawMaterialId: 'rm-1', receivedQty: 0 }] } })).code, 400);
  });
});
