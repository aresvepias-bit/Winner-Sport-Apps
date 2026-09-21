const prisma = require('./db');

/**
 * Pembatas percobaan login, disimpan di database.
 *
 * Dua kunci dipakai bersamaan:
 * - "email:<alamat>"  membatasi tebakan terhadap satu akun
 * - "ip:<alamat>"     membatasi satu sumber yang mencoba banyak akun
 *
 * Hitungan email tetap dicatat walau emailnya tidak terdaftar. Tanpa itu,
 * pesan "terkunci" hanya muncul untuk email yang benar-benar ada, dan justru
 * membocorkan akun mana yang terdaftar.
 */

// Ambang per akun: mulai dikunci pada kegagalan ke-5, makin lama bila diteruskan.
const EMAIL_STEPS = [
  { at: 15, lockMs: 60 * 60 * 1000 }, // 1 jam
  { at: 10, lockMs: 15 * 60 * 1000 }, // 15 menit
  { at: 7, lockMs: 5 * 60 * 1000 },   // 5 menit
  { at: 5, lockMs: 60 * 1000 }        // 1 menit
];

// Ambang per IP lebih longgar: satu kantor bisa dipakai beberapa staf.
const IP_STEPS = [
  { at: 60, lockMs: 60 * 60 * 1000 },
  { at: 40, lockMs: 15 * 60 * 1000 },
  { at: 20, lockMs: 5 * 60 * 1000 }
];

/** Hitungan dianggap basi (dan direset) setelah tenang selama ini. */
const RESET_AFTER_MS = 60 * 60 * 1000;

const emailKey = (email) => `email:${String(email || '').toLowerCase().trim()}`;
const ipKey = (ip) => `ip:${ip || 'unknown'}`;

function lockDurationFor(attempts, steps) {
  for (const step of steps) if (attempts >= step.at) return step.lockMs;
  return 0;
}

/** Sisa waktu kunci dalam detik, atau 0 bila tidak terkunci. */
function lockRemainingSeconds(row, now = new Date()) {
  if (!row?.lockedUntil) return 0;
  const sisa = new Date(row.lockedUntil).getTime() - now.getTime();
  return sisa > 0 ? Math.ceil(sisa / 1000) : 0;
}

/**
 * Dipanggil sebelum memeriksa password.
 * Mengembalikan { locked, retryAfterSeconds } — bila locked, permintaan ditolak.
 */
async function check(email, ip) {
  const now = new Date();
  const rows = await prisma.loginThrottle.findMany({ where: { key: { in: [emailKey(email), ipKey(ip)] } } });

  let terlama = 0;
  for (const row of rows) terlama = Math.max(terlama, lockRemainingSeconds(row, now));

  return { locked: terlama > 0, retryAfterSeconds: terlama };
}

async function bump(key, steps, now) {
  const row = await prisma.loginThrottle.findUnique({ where: { key } });

  // Sudah lama tidak ada percobaan: mulai hitungan dari nol lagi.
  const basi = row && now.getTime() - new Date(row.lastAttempt).getTime() > RESET_AFTER_MS;
  const attempts = (basi || !row ? 0 : row.attempts) + 1;
  const lockMs = lockDurationFor(attempts, steps);
  const lockedUntil = lockMs ? new Date(now.getTime() + lockMs) : null;

  await prisma.loginThrottle.upsert({
    where: { key },
    update: { attempts, lockedUntil, lastAttempt: now },
    create: { key, attempts, lockedUntil, lastAttempt: now }
  });

  return { attempts, lockedUntil };
}

/** Dipanggil setiap login gagal. Mengembalikan sisa kunci (detik) bila jadi terkunci. */
async function recordFailure(email, ip) {
  const now = new Date();
  const [hasilEmail] = await Promise.all([
    bump(emailKey(email), EMAIL_STEPS, now),
    bump(ipKey(ip), IP_STEPS, now)
  ]);

  const sisa = hasilEmail.lockedUntil ? Math.ceil((hasilEmail.lockedUntil.getTime() - now.getTime()) / 1000) : 0;
  return { attempts: hasilEmail.attempts, retryAfterSeconds: sisa };
}

/** Dipanggil setelah login berhasil: hitungan email dibersihkan. */
async function recordSuccess(email, ip) {
  await prisma.loginThrottle.deleteMany({ where: { key: emailKey(email) } }).catch(() => {});
  // Hitungan IP tidak dihapus: satu login benar tidak boleh menghapus jejak
  // puluhan percobaan gagal dari sumber yang sama.
  void ip;
}

/** Membuang catatan lama; dipanggil berkala agar tabel tidak menumpuk. */
async function prune() {
  const batas = new Date(Date.now() - RESET_AFTER_MS);
  const hasil = await prisma.loginThrottle.deleteMany({
    where: { lastAttempt: { lt: batas }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }] }
  });
  return hasil.count;
}

module.exports = { check, recordFailure, recordSuccess, prune, emailKey, ipKey, EMAIL_STEPS, IP_STEPS, RESET_AFTER_MS };
