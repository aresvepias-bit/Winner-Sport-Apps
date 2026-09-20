const { test, describe } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({
  user: [
    { id: 'u-owner', name: 'Owner', email: 'owner@x.com', password: 'hash', role: 'OWNER', isActive: true },
    { id: 'u-owner2', name: 'Owner Kedua', email: 'owner2@x.com', password: 'hash', role: 'OWNER', isActive: false },
    { id: 'u-admin', name: 'Admin', email: 'admin@x.com', password: 'hash', role: 'ADMIN', isActive: true },
    { id: 'u-sales', name: 'Sales', email: 'sales@x.com', password: 'hash', role: 'SALES', isActive: true }
  ]
});

const userController = require('../controllers/userController');

const OWNER = { id: 'u-owner', role: 'OWNER' };
const ADMIN = { id: 'u-admin', role: 'ADMIN' };

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

const PASSWORD_BAIK = 'Konveksi-Juara-2026';

describe('userController: pencegahan kenaikan hak akses oleh ADMIN', () => {
  test('ADMIN tidak bisa membuat akun ber-peran OWNER', async () => {
    const res = await call(userController.createUser, {
      user: ADMIN,
      body: { name: 'Palsu', email: 'palsu@x.com', password: PASSWORD_BAIK, role: 'OWNER' }
    });
    assert.equal(res.code, 403);
  });

  test('ADMIN tidak bisa menaikkan akun lain menjadi OWNER', async () => {
    const res = await call(userController.updateUser, {
      user: ADMIN,
      params: { id: 'u-sales' },
      body: { role: 'OWNER' }
    });
    assert.equal(res.code, 403);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-sales').role, 'SALES');
  });

  test('ADMIN tidak bisa mengubah akun OWNER', async () => {
    const res = await call(userController.updateUser, {
      user: ADMIN,
      params: { id: 'u-owner' },
      body: { name: 'Diubah Diam-diam' }
    });
    assert.equal(res.code, 403);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-owner').name, 'Owner');
  });

  test('ADMIN tidak bisa mengganti password akun OWNER', async () => {
    const res = await call(userController.resetPassword, {
      user: ADMIN,
      params: { id: 'u-owner' },
      body: { password: PASSWORD_BAIK }
    });
    assert.equal(res.code, 403);
  });

  test('ADMIN tidak bisa menonaktifkan akun OWNER', async () => {
    const res = await call(userController.deleteUser, { user: ADMIN, params: { id: 'u-owner' } });
    assert.equal(res.code, 403);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-owner').isActive, true);
  });

  test('OWNER boleh melakukan semuanya', async () => {
    const res = await call(userController.updateUser, {
      user: OWNER,
      params: { id: 'u-sales' },
      body: { role: 'ACCOUNTING' }
    });
    assert.equal(res.code, 200);
    assert.equal(res.body.role, 'ACCOUNTING');
    prisma.user.rows.find((u) => u.id === 'u-sales').role = 'SALES'; // kembalikan
  });
});

describe('userController: pencegahan mengunci diri & sistem', () => {
  test('tidak bisa menonaktifkan akun sendiri', async () => {
    const res = await call(userController.updateUser, {
      user: ADMIN, params: { id: 'u-admin' }, body: { isActive: false }
    });
    assert.equal(res.code, 400);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-admin').isActive, true);
  });

  test('tidak bisa mengubah peran akun sendiri', async () => {
    const res = await call(userController.updateUser, {
      user: ADMIN, params: { id: 'u-admin' }, body: { role: 'SALES' }
    });
    assert.equal(res.code, 400);
  });

  test('tidak bisa menghapus akun sendiri', async () => {
    const res = await call(userController.deleteUser, { user: ADMIN, params: { id: 'u-admin' } });
    assert.equal(res.code, 400);
  });

  test('OWNER terakhir yang aktif tidak bisa dinonaktifkan', async () => {
    // u-owner2 sengaja nonaktif, jadi u-owner adalah satu-satunya OWNER aktif.
    const res = await call(userController.deleteUser, { user: { id: 'u-owner2', role: 'OWNER' }, params: { id: 'u-owner' } });
    assert.equal(res.code, 400);
    assert.match(res.body.error, /satu-satunya OWNER/);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-owner').isActive, true);
  });

  test('OWNER terakhir yang aktif tidak bisa diturunkan perannya', async () => {
    const res = await call(userController.updateUser, {
      user: { id: 'u-owner2', role: 'OWNER' }, params: { id: 'u-owner' }, body: { role: 'ADMIN' }
    });
    assert.equal(res.code, 400);
    assert.equal(prisma.user.rows.find((u) => u.id === 'u-owner').role, 'OWNER');
  });
});

describe('userController: pembuatan akun & password', () => {
  test('menolak password lemah, default publik, atau tanpa angka', async () => {
    for (const password of ['pendek1', 'admin123', 'hanyahurufsaja']) {
      const res = await call(userController.createUser, {
        user: OWNER, body: { name: 'X', email: 'baru@x.com', password, role: 'SALES' }
      });
      assert.equal(res.code, 400, `password "${password}" seharusnya ditolak`);
    }
  });

  test('menolak email yang sudah dipakai', async () => {
    const res = await call(userController.createUser, {
      user: OWNER, body: { name: 'X', email: 'admin@x.com', password: PASSWORD_BAIK, role: 'SALES' }
    });
    assert.equal(res.code, 409);
  });

  test('menolak peran yang tidak dikenal', async () => {
    const res = await call(userController.createUser, {
      user: OWNER, body: { name: 'X', email: 'baru2@x.com', password: PASSWORD_BAIK, role: 'SUPERUSER' }
    });
    assert.equal(res.code, 400);
  });

  test('membuat akun dengan password ter-hash dan tidak mengembalikan password', async () => {
    const res = await call(userController.createUser, {
      user: OWNER, body: { name: 'Gudang Baru', email: 'Gudang@X.com ', password: PASSWORD_BAIK, role: 'WAREHOUSE' }
    });

    assert.equal(res.code, 201);
    assert.equal(res.body.email, 'gudang@x.com', 'email dinormalkan ke huruf kecil');
    assert.equal(res.body.password, undefined, 'password tidak boleh ikut dikirim ke klien');

    const tersimpan = prisma.user.rows.find((u) => u.email === 'gudang@x.com');
    assert.notEqual(tersimpan.password, PASSWORD_BAIK, 'password tidak disimpan apa adanya');
    assert.equal(await bcrypt.compare(PASSWORD_BAIK, tersimpan.password), true);
  });

  test('menonaktifkan akun, bukan menghapusnya (riwayat transaksi tetap utuh)', async () => {
    const res = await call(userController.deleteUser, { user: OWNER, params: { id: 'u-sales' } });
    assert.equal(res.code, 200);
    const target = prisma.user.rows.find((u) => u.id === 'u-sales');
    assert.ok(target, 'baris user tidak boleh hilang');
    assert.equal(target.isActive, false);
  });
});
