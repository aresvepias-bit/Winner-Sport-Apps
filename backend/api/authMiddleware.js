const jwt = require('jsonwebtoken');
const prisma = require('./db');
const rolePolicy = require('./rolePolicy');

// Secret lama pernah ter-commit ke git, jadi dianggap bocor dan ditolak.
const LEAKED_DEFAULT_SECRET = 'winner_sport_jwt_secret_konveksi_2026';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === LEAKED_DEFAULT_SECRET) {
  throw new Error(
    'JWT_SECRET wajib diisi di backend/.env dengan nilai acak baru (bukan default lama). ' +
    'Buat dengan: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

/** Sesi berakhir bila tidak ada aktivitas selama ini (default 30 menit). */
const IDLE_LIMIT_MS = Number(process.env.SESSION_IDLE_MINUTES || 30) * 60 * 1000;

/** lastSeenAt tidak ditulis tiap request; cukup sekali per selang ini. */
const SEEN_WRITE_INTERVAL_MS = 60 * 1000;

/**
 * Middleware: wajib token JWT valid (Authorization: Bearer <token>).
 * User dicek ulang ke database agar akun nonaktif, perubahan role, ganti password,
 * maupun logout langsung berlaku — bukan menunggu token kedaluwarsa.
 */
const verifyToken = async (req, res, next) => {
  const [scheme, token] = (req.headers['authorization'] || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true, lastSeenAt: true }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Akun tidak ditemukan atau nonaktif.' });
    }

    // Token lama (sebelum ganti password / logout) membawa versi yang tertinggal.
    // Token terbitan lama tanpa klaim `tv` juga ditolak, agar tidak ada celah.
    if ((decoded.tv ?? -1) !== user.tokenVersion) {
      return res.status(401).json({ error: 'Sesi sudah diakhiri. Silakan login kembali.' });
    }

    const sekarang = Date.now();
    const terakhir = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : null;

    if (terakhir !== null && sekarang - terakhir > IDLE_LIMIT_MS) {
      return res.status(401).json({ error: 'Sesi berakhir karena tidak ada aktivitas. Silakan login kembali.' });
    }

    // Ditulis seperlunya saja supaya tidak membebani database tiap request.
    if (terakhir === null || sekarang - terakhir > SEEN_WRITE_INTERVAL_MS) {
      prisma.user
        .update({ where: { id: user.id }, data: { lastSeenAt: new Date(sekarang) } })
        .catch((e) => console.warn('[verifyToken] gagal memperbarui lastSeenAt:', e.message));
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[verifyToken error]:', err);
    res.status(500).json({ error: 'Gagal memverifikasi sesi.' });
  }
};

/**
 * Middleware: batasi akses berdasarkan modul (lihat api/rolePolicy.js).
 * Daftar role dibaca saat request, bukan saat file dimuat, supaya perubahan
 * hak akses langsung berlaku tanpa restart server.
 * OWNER selalu lolos. Harus dipasang setelah verifyToken.
 */
const checkRole = (moduleName) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Session not found.' });
  }
  if (req.user.role === 'OWNER') return next();

  try {
    const allowedRoles = await rolePolicy.getAllowedRoles(moduleName);
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Role Anda tidak memiliki izin untuk fitur ini.' });
    }
    next();
  } catch (err) {
    console.error('[checkRole error]:', err);
    res.status(500).json({ error: 'Gagal memeriksa hak akses.' });
  }
};

module.exports = {
  verifyToken,
  checkRole,
  JWT_SECRET,
  IDLE_LIMIT_MS
};
