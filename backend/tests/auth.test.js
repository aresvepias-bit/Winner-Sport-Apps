const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const jwt = require('jsonwebtoken');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

const TEST_SECRET = 'secret-untuk-test-' + 'x'.repeat(30);
process.env.JWT_SECRET = TEST_SECRET;

const prisma = installStub({
  user: [
    { id: 'u-owner', email: 'owner@x.com', name: 'Owner', role: 'OWNER', isActive: true, tokenVersion: 0, lastSeenAt: null },
    { id: 'u-sales', email: 'sales@x.com', name: 'Sales', role: 'SALES', isActive: true, tokenVersion: 0, lastSeenAt: null },
    { id: 'u-off', email: 'off@x.com', name: 'Nonaktif', role: 'ADMIN', isActive: false, tokenVersion: 0, lastSeenAt: null }
  ]
});

const { verifyToken, checkRole } = require('../api/authMiddleware');

const sign = (payload, secret = TEST_SECRET) => jwt.sign(payload, secret);

/** Menjalankan middleware; mengembalikan { res, nextCalled, req }. */
async function run(middleware, req) {
  const res = mockRes();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  return { res, nextCalled, req };
}

describe('verifyToken', () => {
  test('menolak request tanpa header Authorization', async () => {
    const { res, nextCalled } = await run(verifyToken, mockReq({ headers: {} }));
    assert.equal(res.code, 401);
    assert.equal(nextCalled, false);
  });

  test('menolak skema selain Bearer', async () => {
    const { res } = await run(verifyToken, mockReq({ headers: { authorization: 'Basic abc' } }));
    assert.equal(res.code, 401);
  });

  test('menolak token demo lama (dulu diperlakukan sebagai OWNER)', async () => {
    const { res, nextCalled } = await run(verifyToken, mockReq({ headers: { authorization: 'Bearer demo_token_winner_sport_2026' } }));
    assert.equal(res.code, 401);
    assert.equal(nextCalled, false);
  });

  test('menolak token yang ditandatangani dengan secret default lama yang bocor', async () => {
    const forged = sign({ id: 'u-owner', role: 'OWNER' }, 'winner_sport_jwt_secret_konveksi_2026');
    const { res } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${forged}` } }));
    assert.equal(res.code, 401);
  });

  test('menolak token valid milik user yang sudah tidak ada di database', async () => {
    const { res } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${sign({ id: 'u-hilang' })}` } }));
    assert.equal(res.code, 401);
  });

  test('menolak akun nonaktif', async () => {
    const { res } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${sign({ id: 'u-off' })}` } }));
    assert.equal(res.code, 401);
  });

  test('menerima token valid dan mengisi req.user', async () => {
    const { nextCalled, req } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${sign({ id: 'u-owner', tv: 0 })}` } }));
    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 'u-owner');
    assert.equal(req.user.role, 'OWNER');
  });

  test('role diambil dari database, bukan dari isi token (perubahan role langsung berlaku)', async () => {
    // Token lama menyatakan OWNER, tetapi di database user ini hanyalah SALES.
    const staleToken = sign({ id: 'u-sales', role: 'OWNER', tv: 0 });
    const { req, nextCalled } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${staleToken}` } }));
    assert.equal(nextCalled, true);
    assert.equal(req.user.role, 'SALES');
  });

  test('user yang dinonaktifkan setelah token terbit langsung ditolak', async () => {
    const token = sign({ id: 'u-sales', tv: 0 });
    const user = prisma.user.rows.find((u) => u.id === 'u-sales');
    user.isActive = false;
    const { res } = await run(verifyToken, mockReq({ headers: { authorization: `Bearer ${token}` } }));
    assert.equal(res.code, 401);
    user.isActive = true;
  });
});

describe('checkRole (daftar role dibaca saat request, dari rolePolicy)', () => {
  // SALES ada di default policy modul SALES; WAREHOUSE tidak.
  const mw = checkRole('SALES');

  test('OWNER selalu lolos meski tidak ada di daftar', async () => {
    const { nextCalled } = await run(mw, mockReq({ user: { id: 'u', role: 'OWNER' } }));
    assert.equal(nextCalled, true);
  });

  test('role yang diizinkan lolos', async () => {
    const { nextCalled } = await run(mw, mockReq({ user: { id: 'u', role: 'SALES' } }));
    assert.equal(nextCalled, true);
  });

  test('role yang tidak diizinkan ditolak 403', async () => {
    const { res, nextCalled } = await run(mw, mockReq({ user: { id: 'u', role: 'WAREHOUSE' } }));
    assert.equal(res.code, 403);
    assert.equal(nextCalled, false);
  });

  test('tanpa req.user ditolak 401', async () => {
    const { res } = await run(mw, mockReq({ user: null }));
    assert.equal(res.code, 401);
  });
});

describe('JWT_SECRET wajib diisi', () => {
  const loadWith = (secret) => {
    const modPath = require.resolve(path.join(__dirname, '../api/authMiddleware.js'));
    const saved = process.env.JWT_SECRET;
    delete require.cache[modPath];
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
    try {
      require(modPath);
      return null;
    } catch (err) {
      return err;
    } finally {
      process.env.JWT_SECRET = saved;
      delete require.cache[modPath];
      require(modPath);
    }
  };

  test('menolak start bila JWT_SECRET kosong', () => {
    assert.match(loadWith(undefined)?.message || '', /JWT_SECRET wajib diisi/);
  });

  test('menolak start bila JWT_SECRET masih default lama yang bocor', () => {
    assert.match(loadWith('winner_sport_jwt_secret_konveksi_2026')?.message || '', /JWT_SECRET wajib diisi/);
  });

  test('menerima secret yang sah', () => {
    assert.equal(loadWith(TEST_SECRET), null);
  });
});
