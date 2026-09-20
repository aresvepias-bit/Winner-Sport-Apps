const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const rolePolicy = require('../api/rolePolicy');

const ROUTE_ACCESS_TS = path.join(__dirname, '../../frontend/src/lib/routeAccess.ts');

/**
 * Frontend tidak lagi menyimpan daftar role (itu datang dari /auth/me), tetapi masih
 * memetakan halaman -> nama modul. Nama modul itu harus tetap cocok dengan rolePolicy.js,
 * kalau tidak, guard halaman akan memeriksa modul yang tidak pernah ada.
 * Butuh typescript dari frontend/node_modules; dilewati bila belum ter-install.
 */
function loadRouteAccess() {
  let ts;
  try {
    ts = require(path.join(__dirname, '../../frontend/node_modules/typescript'));
  } catch {
    return null;
  }
  const src = fs.readFileSync(ROUTE_ACCESS_TS, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: 'CommonJS', target: 'ES2020' } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', js)(mod, mod.exports);
  return mod.exports;
}

const frontend = loadRouteAccess();
const skip = frontend ? false : 'typescript frontend belum ter-install (npm install di folder frontend)';

describe('routeAccess.ts (frontend) sejalan dengan rolePolicy.js (backend)', { skip }, () => {
  test('setiap halaman menunjuk modul yang benar-benar ada di backend', () => {
    for (const [route, mod] of Object.entries(frontend.ROUTE_MODULE)) {
      assert.ok(rolePolicy.ALL_MODULES.includes(mod), `halaman ${route} menunjuk modul "${mod}" yang tidak dikenal backend`);
    }
  });

  test('modul yang menjaga halaman punya pemetaan (kecuali yang memang bukan halaman)', () => {
    // MASTER_EMPLOYEES hanya membatasi endpoint di dalam halaman Master, bukan halaman tersendiri.
    const bukanHalaman = ['MASTER_EMPLOYEES'];
    const dipetakan = Object.values(frontend.ROUTE_MODULE);
    for (const mod of rolePolicy.ALL_MODULES) {
      if (bukanHalaman.includes(mod)) continue;
      assert.ok(dipetakan.includes(mod), `modul ${mod} tidak punya halaman di frontend`);
    }
  });

  test('halaman Pengguna & Hak Akses dijaga modul USER_ADMIN', () => {
    assert.equal(frontend.ROUTE_MODULE['/users'], 'USER_ADMIN');
  });

  test('canAccess mengikuti daftar modul pengguna', () => {
    assert.equal(frontend.canAccess(['DASHBOARD'], '/'), true);
    assert.equal(frontend.canAccess(['DASHBOARD'], '/inventory'), false);
    assert.equal(frontend.canAccess(['INVENTORY'], '/inventory/opname'), true, 'sub-path ikut halaman induk');
    assert.equal(frontend.canAccess([], '/'), false);
    assert.equal(frontend.canAccess(null, '/'), false);
  });

  test('halaman awal selalu halaman yang boleh dibuka', () => {
    const contoh = [['DASHBOARD'], ['PRODUCTION', 'INVENTORY'], ['USER_ADMIN'], rolePolicy.ALL_MODULES];
    for (const modules of contoh) {
      const home = frontend.homeFor(modules);
      assert.ok(home, `tidak ada halaman awal untuk ${modules.join(',')}`);
      assert.equal(frontend.canAccess(modules, home), true);
    }
  });

  test('tanpa modul sama sekali tidak ada halaman awal (memicu layar akses ditolak)', () => {
    assert.equal(frontend.homeFor([]), null);
  });

  test('OWNER (semua modul) bisa membuka setiap halaman', async () => {
    const modules = await rolePolicy.getModulesForRole('OWNER');
    for (const route of Object.keys(frontend.ROUTE_MODULE)) {
      assert.equal(frontend.canAccess(modules, route), true, `OWNER seharusnya boleh ${route}`);
    }
  });
});
