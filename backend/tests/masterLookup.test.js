const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  unit: [
    { id: 'u-pcs', name: 'Pcs', symbol: 'pcs', ratioToPcs: 1, isActive: true },
    { id: 'u-kodi', name: 'Kodi', symbol: 'kodi', ratioToPcs: 20, isActive: true },
    { id: 'u-lusin', name: 'Lusin', symbol: 'lsn', ratioToPcs: 12, isActive: true },
    { id: 'u-lama', name: 'Satuan Lama', symbol: 'lama', ratioToPcs: 1, isActive: false }
  ],
  salesType: [
    { id: 'st-kodian', code: 'KODIAN', name: 'Penjualan Kodian', sortOrder: 1, isActive: true },
    { id: 'st-satuan', code: 'SATUAN', name: 'Satuan / Eceran', sortOrder: 4, isActive: true }
  ],
  salesOrder: [{ id: 'so-1', soNumber: 'SO-1', orderType: 'KODIAN' }],
  product: [],
  rawMaterial: []
});

const unitConversion = require('../api/unitConversion');
const lookup = require('../controllers/masterLookupController');

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

beforeEach(() => unitConversion.invalidate());

describe('unitConversion: rasio diambil dari master Satuan', () => {
  test('kodi dihitung 20 pcs', async () => {
    assert.equal(await unitConversion.toPcs(5, 'kodi'), 100);
  });

  test('lusin dihitung 12 pcs (dulu keliru dihitung 1 pcs)', async () => {
    assert.equal(await unitConversion.toPcs(5, 'lsn'), 60);
    assert.equal(await unitConversion.toPcs(5, 'Lusin'), 60, 'nama satuan juga dikenali');
  });

  test('cocok tanpa membedakan huruf besar/kecil', async () => {
    assert.equal(await unitConversion.ratioToPcs('KODI'), 20);
    assert.equal(await unitConversion.ratioToPcs('Kodi'), 20);
  });

  test('satuan tak dikenal atau kosong dianggap 1 pcs', async () => {
    assert.equal(await unitConversion.ratioToPcs('entah'), 1);
    assert.equal(await unitConversion.ratioToPcs(''), 1);
    assert.equal(await unitConversion.ratioToPcs(null), 1);
  });

  test('perubahan master berlaku setelah cache dibatalkan', async () => {
    assert.equal(await unitConversion.ratioToPcs('kodi'), 20);
    prisma.unit.rows.find((u) => u.symbol === 'kodi').ratioToPcs = 25;
    assert.equal(await unitConversion.ratioToPcs('kodi'), 20, 'masih memakai cache');
    unitConversion.invalidate();
    assert.equal(await unitConversion.ratioToPcs('kodi'), 25);
    prisma.unit.rows.find((u) => u.symbol === 'kodi').ratioToPcs = 20;
    unitConversion.invalidate();
  });
});

describe('master Satuan', () => {
  test('activeOnly menyaring satuan nonaktif', async () => {
    const semua = await call(lookup.getUnits, { query: {} });
    const aktif = await call(lookup.getUnits, { query: { activeOnly: 'true' } });
    assert.equal(semua.body.length, 4);
    assert.equal(aktif.body.length, 3);
  });

  test('menolak isi satuan 0 atau negatif', async () => {
    for (const ratioToPcs of [0, -5]) {
      const res = await call(lookup.createUnit, { body: { name: 'X', symbol: 'x', ratioToPcs } });
      assert.equal(res.code, 400, `ratio ${ratioToPcs} seharusnya ditolak`);
    }
  });

  test('simbol disimpan huruf kecil agar pencocokan konsisten', async () => {
    const res = await call(lookup.createUnit, { body: { name: 'Bal', symbol: 'BAL', ratioToPcs: 50 } });
    assert.equal(res.code, 201);
    assert.equal(res.body.symbol, 'bal');
  });

  test('satuan yang masih dipakai item master dinonaktifkan, bukan dihapus', async () => {
    prisma.product.rows.push({ id: 'p-1', unitId: 'u-kodi' });
    const res = await call(lookup.deleteUnit, { params: { id: 'u-kodi' } });

    assert.equal(res.code, 200);
    assert.match(res.body.message, /dinonaktifkan/);
    const unit = prisma.unit.rows.find((u) => u.id === 'u-kodi');
    assert.ok(unit, 'baris satuan tidak boleh hilang');
    assert.equal(unit.isActive, false);

    unit.isActive = true;
    prisma.product.rows.length = 0;
  });
});

describe('master Tipe Penjualan', () => {
  test('kode dibakukan menjadi HURUF_BESAR tanpa spasi', async () => {
    const res = await call(lookup.createSalesType, { body: { code: 'event komunitas!', name: 'Paket Event' } });
    assert.equal(res.code, 201);
    assert.equal(res.body.code, 'EVENT_KOMUNITAS');
  });

  test('menolak kode tanpa huruf atau angka', async () => {
    const res = await call(lookup.createSalesType, { body: { code: '!!!', name: 'Aneh' } });
    assert.equal(res.code, 400);
  });

  test('kode dan nama wajib diisi', async () => {
    assert.equal((await call(lookup.createSalesType, { body: { name: 'Tanpa kode' } })).code, 400);
    assert.equal((await call(lookup.createSalesType, { body: { code: 'TANPA_NAMA' } })).code, 400);
  });

  test('mengubah tipe tidak mengganti kodenya (order lama menyimpan kode itu)', async () => {
    const res = await call(lookup.updateSalesType, {
      params: { id: 'st-kodian' },
      body: { code: 'KODE_BARU', name: 'Kodian Diperbarui' }
    });

    assert.equal(res.code, 200);
    assert.equal(res.body.code, 'KODIAN', 'kode harus tetap');
    assert.equal(res.body.name, 'Kodian Diperbarui');
  });

  test('tipe yang sudah dipakai order dinonaktifkan, bukan dihapus', async () => {
    const res = await call(lookup.deleteSalesType, { params: { id: 'st-kodian' } });

    assert.equal(res.code, 200);
    assert.match(res.body.message, /dinonaktifkan/);
    const tipe = prisma.salesType.rows.find((t) => t.id === 'st-kodian');
    assert.ok(tipe, 'baris tipe tidak boleh hilang, riwayat order masih merujuknya');
    assert.equal(tipe.isActive, false);
    tipe.isActive = true;
  });

  test('tipe yang belum dipakai order boleh dihapus', async () => {
    const jumlahAwal = prisma.salesType.rows.length;
    const res = await call(lookup.deleteSalesType, { params: { id: 'st-satuan' } });

    assert.equal(res.code, 200);
    assert.match(res.body.message, /dihapus/);
    assert.equal(prisma.salesType.rows.length, jumlahAwal - 1);
  });

  test('tipe tidak ditemukan -> 404', async () => {
    assert.equal((await call(lookup.deleteSalesType, { params: { id: 'tidak-ada' } })).code, 404);
  });
});
