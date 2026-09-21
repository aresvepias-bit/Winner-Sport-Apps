const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);
// TTL dipendekkan agar pengujian tidak perlu menunggu lama.
process.env.ROLE_POLICY_TTL_SECONDS = '0.05';
process.env.UNIT_CACHE_TTL_SECONDS = '0.05';

const prisma = installStub({
  unit: [{ id: 'u-kodi', name: 'Kodi', symbol: 'kodi', ratioToPcs: 20, isActive: true }]
});

const rolePolicy = require('../api/rolePolicy');
const unitConversion = require('../api/unitConversion');
const { checkRole } = require('../api/authMiddleware');

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

async function jalankanGuard(modul, role) {
  const res = mockRes();
  let lanjut = false;
  await checkRole(modul)(mockReq({ user: { id: 'u', role } }), res, () => { lanjut = true; });
  return { res, lanjut };
}

beforeEach(() => {
  prisma.rolePermission.rows.length = 0;
  rolePolicy.invalidate();
  unitConversion.invalidate();
});

/**
 * Di serverless ada banyak instance. `invalidate()` hanya membersihkan cache di
 * instance yang memprosesnya, jadi perubahan hak akses harus tetap sampai ke
 * instance lain lewat masa berlaku cache. Tanpa itu, izin yang sudah dicabut
 * bisa terus dipakai di instance yang tidak ikut diberi tahu.
 */
describe('cache hak akses menyusul tanpa invalidate (kasus banyak instance)', () => {
  test('izin yang dicabut langsung di database ikut berlaku setelah cache kedaluwarsa', async () => {
    const sebelum = await jalankanGuard('SALES', 'SALES');
    assert.equal(sebelum.lanjut, true, 'awalnya SALES boleh');

    // Instance lain yang mengubah database; instance ini tidak diberi tahu.
    prisma.rolePermission.rows.push({ id: 'rp-1', role: 'SALES', module: 'SALES', allowed: false });

    const langsung = await jalankanGuard('SALES', 'SALES');
    assert.equal(langsung.lanjut, true, 'masih memakai cache lama, wajar');

    await tidur(80);

    const sesudah = await jalankanGuard('SALES', 'SALES');
    assert.equal(sesudah.res.code, 403, 'setelah cache kedaluwarsa harus ikut tercabut');
  });

  test('izin yang ditambahkan juga ikut terbaca setelah cache kedaluwarsa', async () => {
    const sebelum = await jalankanGuard('INVENTORY', 'SALES');
    assert.equal(sebelum.res.code, 403);

    prisma.rolePermission.rows.push({ id: 'rp-2', role: 'SALES', module: 'INVENTORY', allowed: true });
    await tidur(80);

    const sesudah = await jalankanGuard('INVENTORY', 'SALES');
    assert.equal(sesudah.lanjut, true);
  });

  test('cache tetap dipakai selama belum kedaluwarsa (tidak membaca database tiap request)', async () => {
    const asli = prisma.rolePermission.findMany;
    let jumlahBaca = 0;
    prisma.rolePermission.findMany = async (...args) => { jumlahBaca++; return asli.call(prisma.rolePermission, ...args); };
    try {
      await jalankanGuard('SALES', 'SALES');
      await jalankanGuard('SALES', 'SALES');
      await jalankanGuard('SALES', 'SALES');
      assert.equal(jumlahBaca, 1, 'tiga permintaan beruntun hanya membaca database sekali');
    } finally {
      prisma.rolePermission.findMany = asli;
    }
  });

  test('invalidate tetap membuat perubahan berlaku seketika di instance yang sama', async () => {
    await jalankanGuard('SALES', 'SALES');
    prisma.rolePermission.rows.push({ id: 'rp-3', role: 'SALES', module: 'SALES', allowed: false });
    rolePolicy.invalidate();

    const sesudah = await jalankanGuard('SALES', 'SALES');
    assert.equal(sesudah.res.code, 403, 'tanpa menunggu TTL');
  });

  test('OWNER tetap lolos walau cache sedang basi', async () => {
    prisma.rolePermission.rows.push({ id: 'rp-4', role: 'ADMIN', module: 'SALES', allowed: false });
    const hasil = await jalankanGuard('SALES', 'OWNER');
    assert.equal(hasil.lanjut, true);
  });
});

describe('cache satuan juga punya masa berlaku', () => {
  test('perubahan rasio ikut terbaca setelah cache kedaluwarsa', async () => {
    assert.equal(await unitConversion.ratioToPcs('kodi'), 20);

    prisma.unit.rows.find((u) => u.symbol === 'kodi').ratioToPcs = 25;
    await tidur(80);

    assert.equal(await unitConversion.ratioToPcs('kodi'), 25);
    prisma.unit.rows.find((u) => u.symbol === 'kodi').ratioToPcs = 20;
  });
});

describe('konfigurasi serverless', () => {
  test('app tetap diekspor sebagai handler, bukan hanya dijalankan', () => {
    const app = require('../api/index');
    assert.equal(typeof app, 'function', 'Vercel memanggil modul ini sebagai handler');
  });

  test('vercel.json hanya menjadikan satu berkas sebagai fungsi', () => {
    const cfg = require('../vercel.json');
    assert.equal(cfg.builds.length, 1);
    assert.equal(cfg.builds[0].src, 'api/index.js');
    assert.equal(cfg.routes[0].dest, '/api/index.js', 'semua jalur diarahkan ke satu entri');
  });

  test('prisma client dipakai ulang, tidak dibuat baru tiap modul dimuat', () => {
    // Diuji di proses terpisah: di berkas ini db.js sudah diganti stub,
    // sehingga berkas aslinya tidak pernah dijalankan.
    const { execFileSync } = require('node:child_process');
    const skrip = [
      "const a = require('./api/db');",
      "delete require.cache[require.resolve('./api/db')];",
      "const b = require('./api/db');",
      "console.log(a === b && Boolean(globalThis[Symbol.for('winnerSport.prisma')]) ? 'SAMA' : 'BEDA');"
    ].join('');

    const keluaran = execFileSync(process.execPath, ['-e', skrip], {
      cwd: require('path').join(__dirname, '..'),
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: 'postgresql://u:p@localhost:6543/postgres' }
    });

    assert.match(keluaran, /SAMA/, 'muat ulang modul harus memakai klien yang sama');
  });
});
