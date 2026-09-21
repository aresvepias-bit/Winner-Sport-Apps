const bcrypt = require('bcryptjs');

/**
 * Kekuatan hash password. Dinaikkan dari 10 ke 12: tiap tingkat menggandakan
 * waktu hitung, sehingga menebak password jadi jauh lebih mahal bagi penyerang
 * yang berhasil mencuri isi tabel.
 */
const BCRYPT_COST = Number(process.env.BCRYPT_COST || 12);

const hash = (plain) => bcrypt.hash(plain, BCRYPT_COST);
const compare = (plain, hashed) => bcrypt.compare(plain, hashed);

/** Membaca cost dari hash bcrypt, mis. "$2b$10$..." -> 10. */
function costOf(hashed) {
  const m = /^\$2[aby]?\$(\d{2})\$/.exec(hashed || '');
  return m ? Number(m[1]) : null;
}

/** Hash lama (cost lebih rendah) perlu ditulis ulang saat pemiliknya login. */
const needsRehash = (hashed) => {
  const cost = costOf(hashed);
  return cost !== null && cost < BCRYPT_COST;
};

module.exports = { BCRYPT_COST, hash, compare, costOf, needsRehash };
