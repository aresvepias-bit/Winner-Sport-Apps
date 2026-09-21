const { test, describe } = require('node:test');
const assert = require('node:assert');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-untuk-test-' + 'x'.repeat(30);

const prisma = installStub({});
const { isPrivateOrigin, buildOriginChecker } = require('../api/httpSecurity');
const passwordHash = require('../api/passwordHash');
const loginAudit = require('../api/loginAudit');

/** Menjalankan pemeriksa asal CORS; mengembalikan true bila diizinkan. */
function cekAsal(allowList, origin) {
  const checker = buildOriginChecker(allowList);
  let diizinkan = null;
  checker(origin, (err, ok) => { diizinkan = err ? false : ok; });
  return diizinkan;
}

describe('pembatasan asal (CORS)', () => {
  test('tanpa daftar putih: localhost & jaringan lokal diterima', () => {
    for (const origin of [
      'http://localhost:3005',
      'http://127.0.0.1:3005',
      'http://192.168.1.10:3005',
      'http://10.0.0.5:3005',
      'http://172.16.4.2:3005'
    ]) {
      assert.equal(cekAsal([], origin), true, origin + ' seharusnya diterima');
    }
  });

  test('tanpa daftar putih: asal internet ditolak', () => {
    for (const origin of ['http://evil.com', 'https://phishing.example', 'http://8.8.8.8']) {
      assert.equal(cekAsal([], origin), false, origin + ' seharusnya ditolak');
    }
  });

  test('dengan daftar putih: hanya yang terdaftar diterima, termasuk localhost sekalipun', () => {
    const daftar = ['https://app.winnersport.com'];
    assert.equal(cekAsal(daftar, 'https://app.winnersport.com'), true);
    assert.equal(cekAsal(daftar, 'https://app.winnersport.com/'), true, 'garis miring di akhir diabaikan');
    assert.equal(cekAsal(daftar, 'http://localhost:3005'), false, 'daftar putih harus ketat');
  });

  test('permintaan tanpa header Origin (curl, antar-server) tetap dilayani', () => {
    assert.equal(cekAsal([], undefined), true);
    assert.equal(cekAsal(['https://app.winnersport.com'], undefined), true);
  });

  test('asal yang bukan URL sah ditolak, bukan membuat error', () => {
    assert.equal(isPrivateOrigin('bukan-url'), false);
    assert.equal(isPrivateOrigin('file:///etc/passwd'), false);
    assert.equal(cekAsal([], 'bukan-url'), false);
  });

  test('nama host yang menyerupai alamat lokal tidak lolos', () => {
    // "localhost.evil.com" bukan localhost; pencocokan harus seluruh host, bukan awalan.
    assert.equal(cekAsal([], 'http://localhost.evil.com'), false);
    assert.equal(cekAsal([], 'http://192.168.1.1.evil.com'), false);
  });
});

describe('kekuatan hash password', () => {
  test('hash baru dibuat dengan cost 12', async () => {
    const h = await passwordHash.hash('Konveksi-Juara-2026');
    assert.equal(passwordHash.costOf(h), 12);
  });

  test('hash lama cost 10 dikenali perlu ditingkatkan', () => {
    const lama = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    assert.equal(passwordHash.costOf(lama), 10);
    assert.equal(passwordHash.needsRehash(lama), true);
  });

  test('hash yang sudah kuat tidak ditulis ulang', async () => {
    const baru = await passwordHash.hash('Konveksi-Juara-2026');
    assert.equal(passwordHash.needsRehash(baru), false);
  });

  test('password lama tetap bisa diverifikasi walau cost-nya berbeda', async () => {
    const lama = require('bcryptjs').hashSync('Konveksi-Juara-2026', 10);
    assert.equal(await passwordHash.compare('Konveksi-Juara-2026', lama), true);
    assert.equal(await passwordHash.compare('salah', lama), false);
  });

  test('nilai yang bukan hash bcrypt tidak membuat error', () => {
    assert.equal(passwordHash.costOf('bukan-hash'), null);
    assert.equal(passwordHash.needsRehash('bukan-hash'), false);
    assert.equal(passwordHash.needsRehash(null), false);
  });
});

describe('riwayat login', () => {
  test('mencatat percobaan tanpa menyimpan password', async () => {
    prisma.loginAudit.rows.length = 0;
    const req = mockReq({ headers: { 'x-forwarded-for': '203.0.113.7', 'user-agent': 'Mozilla/5.0 Chrome/120' } });

    await loginAudit.record({ req, email: 'Owner@X.com ', userId: 'u-1', success: false, reason: 'PASSWORD_SALAH' });

    const baris = prisma.loginAudit.rows[0];
    assert.equal(baris.email, 'owner@x.com', 'email dinormalkan huruf kecil');
    assert.equal(baris.success, false);
    assert.equal(baris.reason, 'PASSWORD_SALAH');
    assert.equal(baris.ip, '203.0.113.7');
    assert.ok(!('password' in baris), 'password tidak boleh ada di catatan');
  });

  test('kegagalan mencatat tidak menggagalkan login', async () => {
    const asli = prisma.loginAudit.create;
    prisma.loginAudit.create = async () => { throw new Error('database mati'); };
    try {
      await loginAudit.record({ req: mockReq({}), email: 'a@b.com', success: true });
    } finally {
      prisma.loginAudit.create = asli;
    }
    // Tidak melempar error = lolos.
  });

  test('user-agent yang sangat panjang dipotong', async () => {
    prisma.loginAudit.rows.length = 0;
    const req = mockReq({ headers: { 'user-agent': 'x'.repeat(1000) } });
    await loginAudit.record({ req, email: 'a@b.com', success: true });
    assert.ok(prisma.loginAudit.rows[0].userAgent.length <= 300);
  });

  test('ringkasan menghitung berhasil, gagal, dan jumlah email yang dicoba', async () => {
    prisma.loginAudit.rows.length = 0;
    const sekarang = new Date();
    prisma.loginAudit.rows.push(
      { id: '1', email: 'a@b.com', success: true, createdAt: sekarang },
      { id: '2', email: 'x@b.com', success: false, createdAt: sekarang },
      { id: '3', email: 'y@b.com', success: false, createdAt: sekarang },
      { id: '4', email: 'y@b.com', success: false, createdAt: sekarang }
    );

    const s = await loginAudit.summary();
    assert.equal(s.berhasil, 1);
    assert.equal(s.gagal, 3);
    assert.equal(s.akunDicoba, 2, 'email yang sama dihitung sekali');
  });

  test('jumlah baris yang diambil dibatasi', async () => {
    prisma.loginAudit.rows.length = 0;
    for (let i = 0; i < 600; i++) {
      prisma.loginAudit.rows.push({ id: String(i), email: 'a@b.com', success: true, createdAt: new Date() });
    }
    const hasil = await loginAudit.list({ limit: 9999 });
    assert.ok(hasil.length <= 500, 'maksimal 500 baris, dapat ' + hasil.length);
  });
});
