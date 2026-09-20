const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({});
const rolePolicy = require('../api/rolePolicy');
const permissionController = require('../controllers/permissionController');
const { checkRole } = require('../api/authMiddleware');

const OWNER = { id: 'u-owner', role: 'OWNER' };
const ADMIN = { id: 'u-admin', role: 'ADMIN' };

const call = async (fn, opts) => {
  const res = mockRes();
  await fn(mockReq(opts), res);
  return res;
};

async function runMiddleware(mw, user) {
  const res = mockRes();
  let nextCalled = false;
  await mw(mockReq({ user }), res, () => { nextCalled = true; });
  return { res, nextCalled };
}

beforeEach(() => {
  prisma.rolePermission.rows.length = 0;
  rolePolicy.invalidate();
});

describe('rolePolicy: default dipakai saat database kosong', () => {
  test('matriks awal mengikuti DEFAULT_POLICY', async () => {
    const matrix = await rolePolicy.getMatrix();
    assert.equal(matrix.SALES.roles.SALES, true);
    assert.equal(matrix.SALES.roles.WAREHOUSE, false);
    assert.equal(matrix.INVENTORY.roles.WAREHOUSE, true);
  });

  test('OWNER mendapat semua modul, termasuk USER_ADMIN', async () => {
    const modules = await rolePolicy.getModulesForRole('OWNER');
    for (const mod of rolePolicy.ALL_MODULES) assert.ok(modules.includes(mod), `OWNER kehilangan ${mod}`);
  });

  test('USER_ADMIN hanya untuk ADMIN (selain OWNER)', async () => {
    assert.ok((await rolePolicy.getModulesForRole('ADMIN')).includes('USER_ADMIN'));
    assert.ok(!(await rolePolicy.getModulesForRole('SALES')).includes('USER_ADMIN'));
  });
});

describe('permissionController.updatePermissions', () => {
  test('perubahan tersimpan dan langsung berlaku tanpa restart', async () => {
    const sebelum = await runMiddleware(checkRole('INVENTORY'), { id: 'u', role: 'SALES' });
    assert.equal(sebelum.res.code, 403, 'awalnya SALES tidak boleh membuka inventori');

    const res = await call(permissionController.updatePermissions, {
      user: OWNER,
      body: { changes: [{ role: 'SALES', module: 'INVENTORY', allowed: true }] }
    });
    assert.equal(res.code, 200);
    assert.equal(res.body.matrix.INVENTORY.roles.SALES, true);

    const sesudah = await runMiddleware(checkRole('INVENTORY'), { id: 'u', role: 'SALES' });
    assert.equal(sesudah.nextCalled, true, 'perubahan harus langsung berlaku');
  });

  test('mencabut izin juga langsung berlaku', async () => {
    await call(permissionController.updatePermissions, {
      user: OWNER,
      body: { changes: [{ role: 'WAREHOUSE', module: 'INVENTORY', allowed: false }] }
    });
    const { res } = await runMiddleware(checkRole('INVENTORY'), { id: 'u', role: 'WAREHOUSE' });
    assert.equal(res.code, 403);
  });

  test('OWNER tetap lolos walau izinnya dicoba dicabut lewat modul apa pun', async () => {
    await call(permissionController.updatePermissions, {
      user: OWNER,
      body: { changes: rolePolicy.EDITABLE_MODULES.map((m) => ({ role: 'ADMIN', module: m, allowed: false })) }
    });
    for (const mod of rolePolicy.EDITABLE_MODULES) {
      const { nextCalled } = await runMiddleware(checkRole(mod), OWNER);
      assert.equal(nextCalled, true, `OWNER seharusnya tetap lolos di ${mod}`);
    }
  });

  test('modul USER_ADMIN tidak bisa diubah dari sini (mencegah terkunci)', async () => {
    const res = await call(permissionController.updatePermissions, {
      user: OWNER,
      body: { changes: [{ role: 'ADMIN', module: 'USER_ADMIN', allowed: false }] }
    });
    assert.equal(res.code, 400);

    const { nextCalled } = await runMiddleware(checkRole('USER_ADMIN'), ADMIN);
    assert.equal(nextCalled, true, 'ADMIN harus tetap bisa membuka menu pengguna');
  });

  test('peran OWNER tidak bisa dimasukkan ke matriks', async () => {
    const res = await call(permissionController.updatePermissions, {
      user: OWNER,
      body: { changes: [{ role: 'OWNER', module: 'SALES', allowed: false }] }
    });
    assert.equal(res.code, 400);
  });

  test('ADMIN tidak bisa mencabut hak akses perannya sendiri', async () => {
    const res = await call(permissionController.updatePermissions, {
      user: ADMIN,
      body: { changes: [{ role: 'ADMIN', module: 'SALES', allowed: false }] }
    });
    assert.equal(res.code, 403);
  });

  test('ADMIN tetap boleh mengatur peran lain', async () => {
    const res = await call(permissionController.updatePermissions, {
      user: ADMIN,
      body: { changes: [{ role: 'SALES', module: 'PURCHASING', allowed: true }] }
    });
    assert.equal(res.code, 200);
  });

  test('menolak nilai izin yang bukan true/false dan modul tak dikenal', async () => {
    const a = await call(permissionController.updatePermissions, {
      user: OWNER, body: { changes: [{ role: 'SALES', module: 'SALES', allowed: 'ya' }] }
    });
    assert.equal(a.code, 400);

    const b = await call(permissionController.updatePermissions, {
      user: OWNER, body: { changes: [{ role: 'SALES', module: 'MODUL_ASING', allowed: true }] }
    });
    assert.equal(b.code, 400);
  });

  test('menolak body tanpa perubahan', async () => {
    const res = await call(permissionController.updatePermissions, { user: OWNER, body: { changes: [] } });
    assert.equal(res.code, 400);
  });

  test('mengubah izin yang sama dua kali tidak menggandakan baris', async () => {
    await call(permissionController.updatePermissions, {
      user: OWNER, body: { changes: [{ role: 'SALES', module: 'INVENTORY', allowed: true }] }
    });
    await call(permissionController.updatePermissions, {
      user: OWNER, body: { changes: [{ role: 'SALES', module: 'INVENTORY', allowed: false }] }
    });
    const baris = prisma.rolePermission.rows.filter((r) => r.role === 'SALES' && r.module === 'INVENTORY');
    assert.equal(baris.length, 1);
    assert.equal(baris[0].allowed, false);
  });
});

describe('permissionController.getPermissions', () => {
  test('mengembalikan matriks, daftar peran, dan modul yang bisa diatur', async () => {
    const res = await call(permissionController.getPermissions, { user: ADMIN });
    assert.equal(res.code, 200);
    assert.deepEqual(res.body.roles, rolePolicy.EDITABLE_ROLES);
    assert.ok(!res.body.roles.includes('OWNER'), 'OWNER tidak boleh muncul sebagai kolom yang bisa diubah');
    assert.ok(!res.body.modules.includes('USER_ADMIN'), 'USER_ADMIN tidak boleh bisa diatur');
    assert.equal(Object.keys(res.body.matrix).length, rolePolicy.EDITABLE_MODULES.length);
  });
});
