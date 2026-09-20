/**
 * Ganti password user secara aman (input tersembunyi, tidak lewat argumen/riwayat shell).
 *
 * Pakai (di terminal interaktif):
 *   cd backend
 *   node scripts/set-password.js owner@winnersport.com
 *   node scripts/set-password.js admin@winnersport.com
 */
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const bcrypt = require('bcryptjs');

const KNOWN_DEFAULTS = ['admin123'];
const MIN_LENGTH = 10;

/** Mengembalikan pesan error, atau null bila password diterima. */
function validatePassword(password, email) {
  if (password.length < MIN_LENGTH) return `Password minimal ${MIN_LENGTH} karakter.`;
  if (KNOWN_DEFAULTS.includes(password.toLowerCase())) return 'Password itu adalah password default yang sudah publik.';
  const local = (email.split('@')[0] || '').toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) return 'Password tidak boleh memuat nama akun.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Password harus memuat huruf dan angka.';
  return null;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === '\u0003') process.exit(130); // Ctrl+C
        if (c === '\r' || c === '\n' || c === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          return resolve(buf);
        }
        if (c === '\u007f' || c === '\b') buf = buf.slice(0, -1);
        else buf += c;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const email = (process.argv[2] || '').toLowerCase().trim();
  if (!email) {
    console.error('Pemakaian: node scripts/set-password.js <email>');
    process.exit(1);
  }
  if (!process.stdin.isTTY) {
    console.error('Skrip ini butuh terminal interaktif agar password tidak terlihat. Jalankan langsung di terminal Anda.');
    process.exit(1);
  }

  const prisma = require('../api/db');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User dengan email "${email}" tidak ditemukan.`);
    process.exit(1);
  }

  console.log(`Ganti password untuk ${user.name} <${user.email}> (${user.role})`);
  const pw1 = await askHidden('Password baru      : ');
  const problem = validatePassword(pw1, email);
  if (problem) {
    console.error('Ditolak: ' + problem);
    process.exit(1);
  }
  const pw2 = await askHidden('Ulangi password    : ');
  if (pw1 !== pw2) {
    console.error('Ditolak: kedua password tidak sama.');
    process.exit(1);
  }

  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(pw1, 10) } });
  console.log('Password berhasil diganti. Token login lama tetap berlaku sampai kedaluwarsa (maks. 7 hari).');
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Gagal:', err.message);
    process.exit(1);
  });
}

module.exports = { validatePassword };
