const helmet = require('helmet');
const cors = require('cors');

/**
 * Lapisan keamanan HTTP: security header, pembatasan asal (CORS), dan batas ukuran body.
 *
 * Soal CORS: sebelumnya semua asal diizinkan. Sekarang:
 * - Bila CORS_ORIGINS diisi (dipisah koma), hanya asal itu yang diterima. Ini yang
 *   seharusnya dipakai di server produksi.
 * - Bila kosong, hanya localhost dan jaringan lokal yang diterima, plus peringatan
 *   saat start. Ini agar mode pengembangan (termasuk buka dari HP satu wifi) tetap jalan.
 */

const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

function parseAllowList() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isPrivateOrigin(origin) {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return PRIVATE_HOST.test(url.hostname) || PRIVATE_HOST.test(`[${url.hostname}]`);
  } catch {
    return false;
  }
}

function buildOriginChecker(allowList) {
  return (origin, callback) => {
    // Tanpa header Origin: permintaan bukan dari browser (curl, antar-server, cetak).
    // CORS memang tidak berlaku di situ; keamanannya dijaga token, bukan asal.
    if (!origin) return callback(null, true);

    const bersih = origin.replace(/\/$/, '');
    if (allowList.length > 0) {
      return allowList.includes(bersih)
        ? callback(null, true)
        : callback(new Error(`Asal ${origin} tidak diizinkan oleh CORS.`));
    }

    return isPrivateOrigin(bersih)
      ? callback(null, true)
      : callback(new Error(`Asal ${origin} tidak diizinkan. Isi CORS_ORIGINS untuk mengizinkannya.`));
  };
}

/** Body JSON dibatasi kecil: tidak ada endpoint yang menerima unggahan besar. */
const BODY_LIMIT = process.env.BODY_LIMIT || '1mb';

function applyHttpSecurity(app, express) {
  const allowList = parseAllowList();

  app.disable('x-powered-by');

  app.use(
    helmet({
      // API ini tidak menyajikan halaman HTML, jadi CSP tidak relevan dan
      // justru bisa mengganggu alat bantu seperti health check.
      contentSecurityPolicy: false,
      // Gambar/logo dipakai frontend di origin berbeda.
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  app.use(cors({
    origin: buildOriginChecker(allowList),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));

  return {
    allowList,
    warn() {
      if (allowList.length === 0) {
        console.warn(
          '[SECURITY] CORS_ORIGINS belum diisi. Untuk sekarang hanya localhost & jaringan lokal ' +
          'yang diizinkan. Sebelum deploy, isi CORS_ORIGINS dengan alamat frontend, ' +
          'contoh: CORS_ORIGINS=https://app.winnersport.com'
        );
      } else {
        console.log(`[server] CORS dibatasi ke: ${allowList.join(', ')}`);
      }
    }
  };
}

module.exports = { applyHttpSecurity, isPrivateOrigin, parseAllowList, buildOriginChecker, BODY_LIMIT };
