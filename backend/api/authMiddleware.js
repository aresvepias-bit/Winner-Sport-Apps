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

/**
 * Middleware: wajib token JWT valid (Authorization: Bearer <token>).
 * User dicek ulang ke database agar akun nonaktif / perubahan role langsung berlaku,
 * bukan menunggu token kedaluwarsa.
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
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Akun tidak ditemukan atau nonaktif.' });
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
  JWT_SECRET
};
