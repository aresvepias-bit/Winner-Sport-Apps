const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { installStub, mockRes, mockReq } = require('./helpers/stubPrisma');

const TEST_SECRET = 'secret-untuk-test-' + 'x'.repeat(30);
process.env.JWT_SECRET = TEST_SECRET;

const PASSWORD_BENAR = 'Konveksi-Juara-2026';
const HASH_BENAR = bcrypt.hashSync(PASSWORD_BENAR, 10);

const prisma = installStub({
  user: [
    { id: 'u-owner', email: 'owner@x.com', name: 'Owner', role: 'OWNER', isActive: true, password: HASH_BENAR, tokenVersion: 0, lastSeenAt: null },
    { id: 'u-off', email: 'off@x.com', name: 'Nonaktif', role: 'ADMIN', isActive: false, password: HASH_BENAR, tokenVersion: 0, lastSeenAt: null }
  ]
});

const authController = require('../controllers/authController');
const throttle = require('../api/loginThrottle');
const { verifyToken } = require('../api/authMiddleware');

const call = async (fn, opts) => {
  const res = mockRes();
  res.set = () => res; // meniru res.set() milik Express
  await fn(mockReq(opts), res);
  return res;
};

const login = (email, password, ip = '10.0.0.1') =>
  call(authController.login, { body: { email, password }, headers: { 'x-forwarded-for': ip }, user: null });

async function runGuard(token) {
  const res = mockRes();
  let lanjut = false;
  const req = mockReq({ headers: { authorization: 'Bearer ' + token }, user: null });
  await verifyToken(req, res, () => { lanjut = true; });
  return { res, lanjut, req };
}

beforeEach(() => {
  prisma.loginThrottle.rows.length = 0;
  const owner = prisma.user.rows.find((u) => u.id === 'u-owner');
  owner.tokenVersion = 0;
  owner.lastSeenAt = null;
  owner.isActive = true;
});

describe('pesan login tidak membocorkan email terdaftar', () => {
  test('email asing dan password salah memberi pesan yang sama persis', async () => {
    const asing = await login('tidakada@x.com', 'apa-saja-123');
    const salah = await login('owner@x.com', 'salah-sekali-123');

    assert.equal(asing.code, 401);
    assert.equal(salah.code, 401);
    assert.deepEqual(asing.body, salah.body, 'pesan harus identik');
  });

  test('akun nonaktif tidak dibedakan dari password salah', async () => {
    const nonaktif = await login('off@x.com', PASSWORD_BENAR);
    assert.equal(nonaktif.code, 401);
    assert.equal(nonaktif.body.error, 'Email atau password salah.');
  });

  test('email tak terdaftar pun dihitung, jadi pesan terkunci tidak menandakan akun ada', async () => {
    for (let i = 0; i < 5; i++) await login('hantu@x.com', 'salah' + i);
    const res = await login('hantu@x.com', 'salah-lagi');
    assert.equal(res.code, 429);
  });
});

describe('pembatasan percobaan login', () => {
  test('empat kegagalan masih dilayani, kegagalan kelima mengunci', async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await login('owner@x.com', 'salah' + i);
      assert.equal(res.code, 401, 'percobaan ke-' + i + ' seharusnya belum terkunci');
    }
    const kelima = await login('owner@x.com', 'salah5');
    assert.equal(kelima.code, 429);
    assert.ok(kelima.body.retryAfterSeconds > 0);
  });

  test('saat terkunci, password BENAR pun ditolak', async () => {
    for (let i = 0; i < 5; i++) await login('owner@x.com', 'salah' + i);
    const res = await login('owner@x.com', PASSWORD_BENAR);
    assert.equal(res.code, 429, 'kunci harus berlaku walau passwordnya benar');
  });

  test('percobaan yang sedang tertolak tidak memperpanjang kunci', async () => {
    // Kalau percobaan saat terkunci ikut dihitung, penyerang bisa menahan akun
    // orang lain terkunci selamanya hanya dengan terus menembak.
    for (let i = 0; i < 5; i++) await login('owner@x.com', 'salah' + i);
    const pertama = await login('owner@x.com', 'lagi-1');
    for (let i = 0; i < 20; i++) await login('owner@x.com', 'lagi-' + i);
    const terakhir = await login('owner@x.com', 'lagi-akhir');

    assert.equal(pertama.code, 429);
    assert.ok(terakhir.body.retryAfterSeconds <= pertama.body.retryAfterSeconds);
  });

  test('durasi kunci meningkat pada percobaan berikutnya setelah kunci habis', async () => {
    const kunci = throttle.emailKey('owner@x.com');
    const kedaluwarsakan = () => {
      const row = prisma.loginThrottle.rows.find((r) => r.key === kunci);
      if (row) row.lockedUntil = new Date(Date.now() - 1000);
    };

    const durasi = [];
    for (let i = 0; i < 16; i++) {
      const res = await login('owner@x.com', 'salah' + i);
      if (res.code === 429) durasi.push(res.body.retryAfterSeconds);
      kedaluwarsakan(); // seolah pengguna menunggu sampai kuncinya habis
    }

    assert.ok(durasi.length > 1);
    assert.ok(
      durasi.at(-1) > durasi[0],
      'durasi harus naik setelah kunci habis, dapat ' + durasi[0] + ' -> ' + durasi.at(-1)
    );
  });

  test('login berhasil membersihkan hitungan akun itu', async () => {
    for (let i = 0; i < 3; i++) await login('owner@x.com', 'salah' + i);
    const ok = await login('owner@x.com', PASSWORD_BENAR);
    assert.equal(ok.code, 200);

    const sisa = prisma.loginThrottle.rows.filter((r) => r.key === throttle.emailKey('owner@x.com'));
    assert.equal(sisa.length, 0, 'hitungan email harus terhapus setelah berhasil');
  });

  test('satu login benar tidak menghapus jejak kegagalan dari IP yang sama', async () => {
    await login('hantu@x.com', 'salah', '10.9.9.9');
    await login('owner@x.com', PASSWORD_BENAR, '10.9.9.9');

    const ip = prisma.loginThrottle.rows.find((r) => r.key === throttle.ipKey('10.9.9.9'));
    assert.ok(ip && ip.attempts >= 1, 'hitungan IP harus tetap ada');
  });

  test('akun berbeda punya hitungan sendiri', async () => {
    for (let i = 0; i < 5; i++) await login('hantu@x.com', 'salah' + i, '10.0.0.5');
    const lain = await login('owner@x.com', PASSWORD_BENAR, '10.0.0.5');
    assert.equal(lain.code, 200, 'akun lain tidak boleh ikut terkunci');
  });
});

describe('token membawa versi sesi', () => {
  test('token hasil login memuat klaim tv sesuai tokenVersion akun', async () => {
    prisma.user.rows.find((u) => u.id === 'u-owner').tokenVersion = 3;
    const res = await login('owner@x.com', PASSWORD_BENAR);
    const payload = jwt.verify(res.body.token, TEST_SECRET);
    assert.equal(payload.tv, 3);
  });

  test('masa berlaku token jauh lebih pendek dari 7 hari', async () => {
    const res = await login('owner@x.com', PASSWORD_BENAR);
    const p = jwt.verify(res.body.token, TEST_SECRET);
    const jam = (p.exp - p.iat) / 3600;
    assert.ok(jam <= 24, 'token berlaku ' + jam + ' jam, seharusnya maksimal 24');
  });

  test('password tidak pernah ikut terkirim ke klien', async () => {
    const res = await login('owner@x.com', PASSWORD_BENAR);
    assert.equal(res.body.user.password, undefined);
  });
});

describe('logout benar-benar mencabut sesi', () => {
  test('token berlaku sebelum logout, ditolak sesudahnya', async () => {
    const masuk = await login('owner@x.com', PASSWORD_BENAR);
    const token = masuk.body.token;

    const sebelum = await runGuard(token);
    assert.equal(sebelum.lanjut, true);

    await call(authController.logout, { user: { id: 'u-owner' } });

    const sesudah = await runGuard(token);
    assert.equal(sesudah.lanjut, false);
    assert.equal(sesudah.res.code, 401);
    assert.match(sesudah.res.body.error, /Sesi sudah diakhiri/);
  });

  test('menaikkan tokenVersion (mis. saat reset password) mematikan token lama', async () => {
    const masuk = await login('owner@x.com', PASSWORD_BENAR);
    prisma.user.rows.find((u) => u.id === 'u-owner').tokenVersion += 1;

    const hasil = await runGuard(masuk.body.token);
    assert.equal(hasil.res.code, 401);
  });

  test('token terbitan lama tanpa klaim tv ditolak', async () => {
    const tokenLama = jwt.sign({ id: 'u-owner', role: 'OWNER' }, TEST_SECRET);
    const hasil = await runGuard(tokenLama);
    assert.equal(hasil.res.code, 401);
  });
});

describe('batas waktu diam', () => {
  test('sesi yang diam melewati batas ditolak', async () => {
    const masuk = await login('owner@x.com', PASSWORD_BENAR);
    const owner = prisma.user.rows.find((u) => u.id === 'u-owner');
    owner.lastSeenAt = new Date(Date.now() - 31 * 60 * 1000);

    const hasil = await runGuard(masuk.body.token);
    assert.equal(hasil.res.code, 401);
    assert.match(hasil.res.body.error, /tidak ada aktivitas/);
  });

  test('sesi yang baru dipakai tetap berjalan', async () => {
    const masuk = await login('owner@x.com', PASSWORD_BENAR);
    const owner = prisma.user.rows.find((u) => u.id === 'u-owner');
    owner.lastSeenAt = new Date(Date.now() - 60 * 1000);

    const hasil = await runGuard(masuk.body.token);
    assert.equal(hasil.lanjut, true);
  });
});
