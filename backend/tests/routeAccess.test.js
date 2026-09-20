const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const policy = require('../api/rolePolicy');

const ROUTE_ACCESS_TS = path.join(__dirname, '../../frontend/src/lib/routeAccess.ts');

/**
 * Menjaga agar daftar role di frontend (routeAccess.ts) tidak melenceng dari rolePolicy.js.
 * Kalau melenceng, menu/halaman akan tampil lalu ditolak backend (atau sebaliknya, tersembunyi
 * padahal boleh). Butuh typescript dari frontend/node_modules; dilewati bila belum ter-install.
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

// Halaman frontend -> kunci kebijakan backend yang menjaga endpoint halaman tersebut.
const ROUTE_TO_POLICY = {
  '/': 'DASHBOARD',
  '/production': 'PRODUCTION',
  '/sales': 'SALES',
  '/inventory': 'INVENTORY',
  '/purchasing': 'PURCHASING',
  '/accounting': 'ACCOUNTING',
  '/master': 'MASTER_WRITE'
};

const ROLES = ['OWNER', 'ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'ACCOUNTING'];

describe('routeAccess.ts (frontend) sinkron dengan rolePolicy.js (backend)', { skip }, () => {
  for (const [route, key] of Object.entries(ROUTE_TO_POLICY)) {
    test(`${route} sama dengan policy.${key}`, () => {
      const depan = [...frontend.ROUTE_ROLES[route]].sort();
      const belakang = [...policy[key]].sort();
      assert.deepEqual(depan, belakang);
    });
  }

  test('tidak ada halaman frontend tanpa padanan kebijakan backend', () => {
    assert.deepEqual(Object.keys(frontend.ROUTE_ROLES).sort(), Object.keys(ROUTE_TO_POLICY).sort());
  });

  test('OWNER boleh membuka semua halaman', () => {
    for (const route of Object.keys(ROUTE_TO_POLICY)) {
      assert.ok(frontend.canAccess('OWNER', route), `OWNER seharusnya boleh ${route}`);
    }
  });

  test('setiap role punya halaman awal yang memang boleh dibuka (tidak ada redirect berputar)', () => {
    for (const role of ROLES) {
      const home = frontend.homeFor(role);
      assert.ok(home, `role ${role} tidak punya halaman awal`);
      assert.ok(frontend.canAccess(role, home), `halaman awal ${home} justru terlarang untuk ${role}`);
    }
  });

  test('sub-path mengikuti izin halaman induknya', () => {
    assert.equal(frontend.canAccess('WAREHOUSE', '/inventory/opname'), true);
    assert.equal(frontend.canAccess('SALES', '/inventory/opname'), false);
  });

  test('tanpa role dianggap tidak berhak', () => {
    assert.equal(frontend.canAccess(null, '/'), false);
    assert.equal(frontend.canAccess(undefined, '/sales'), false);
  });

  test('role yang tidak dikenal tidak punya halaman awal (memicu layar akses ditolak)', () => {
    assert.equal(frontend.homeFor('ROLE_ASING'), null);
  });
});
