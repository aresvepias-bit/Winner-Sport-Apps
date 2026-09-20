const bcrypt = require('bcryptjs');
const prisma = require('./db');

// Password bawaan yang pernah ada di repo (seed & halaman login) sehingga dianggap publik.
const KNOWN_DEFAULT_PASSWORDS = ['admin123'];

/**
 * Peringatan saat startup bila masih ada akun aktif yang memakai password default.
 * Tidak memblokir server; hanya memastikan hal ini tidak terlupakan sebelum deploy.
 */
async function warnAboutDefaultPasswords() {
  try {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { email: true, password: true } });
    const risky = [];
    for (const u of users) {
      for (const pw of KNOWN_DEFAULT_PASSWORDS) {
        if (await bcrypt.compare(pw, u.password)) {
          risky.push(u.email);
          break;
        }
      }
    }
    if (risky.length > 0) {
      console.warn(
        `[SECURITY] ${risky.length} akun masih memakai password default yang sudah publik: ${risky.join(', ')}. ` +
        'Ganti dengan: node scripts/set-password.js <email>'
      );
    }
  } catch (err) {
    console.warn('[SECURITY] Pengecekan password default dilewati:', err.message);
  }
}

module.exports = { warnAboutDefaultPasswords };
