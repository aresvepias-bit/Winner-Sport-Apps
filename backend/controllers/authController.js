const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { JWT_SECRET } = require('../api/authMiddleware');
const rolePolicy = require('../api/rolePolicy');
const loginThrottle = require('../api/loginThrottle');

// Masa berlaku token. Sengaja pendek: token tidak bisa dicabut satu per satu,
// hanya lewat tokenVersion (yang mencabut seluruh sesi pengguna itu).
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '12h';

/**
 * Satu pesan untuk email tak dikenal, password salah, maupun akun nonaktif.
 * Membedakannya akan memberi tahu penyerang email mana yang terdaftar.
 */
const PESAN_GAGAL = 'Email atau password salah.';

// Hash palsu untuk dibandingkan saat email tidak ditemukan, supaya lama proses
// login kira-kira sama dan keberadaan akun tidak terbaca dari selisih waktu.
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || req.socket?.remoteAddress || 'unknown';

/**
 * Controller: Autentikasi Pengguna
 */
const authController = {
  // POST /api/auth/login
  async login(req, res) {
    const ip = clientIp(req);
    const { email, password } = req.body || {};

    try {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi.' });
      }

      const kunci = await loginThrottle.check(email, ip);
      if (kunci.locked) {
        const menit = Math.ceil(kunci.retryAfterSeconds / 60);
        res.set('Retry-After', String(kunci.retryAfterSeconds));
        return res.status(429).json({
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`,
          retryAfterSeconds: kunci.retryAfterSeconds
        });
      }

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

      // Akun nonaktif diperlakukan sama dengan password salah, tanpa petunjuk tambahan.
      const boleh = user && user.isActive;
      const cocok = await bcrypt.compare(password, boleh ? user.password : DUMMY_HASH);

      if (!boleh || !cocok) {
        const gagal = await loginThrottle.recordFailure(email, ip);
        if (gagal.retryAfterSeconds > 0) {
          const menit = Math.ceil(gagal.retryAfterSeconds / 60);
          res.set('Retry-After', String(gagal.retryAfterSeconds));
          return res.status(429).json({
            error: `Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`,
            retryAfterSeconds: gagal.retryAfterSeconds
          });
        }
        return res.status(401).json({ error: PESAN_GAGAL });
      }

      const sekarang = new Date();
      await Promise.all([
        loginThrottle.recordSuccess(email, ip),
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: sekarang, lastSeenAt: sekarang }
        })
      ]);

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role, tv: user.tokenVersion },
        JWT_SECRET,
        { expiresIn: TOKEN_TTL }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('[auth/login error]:', err);
      res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
    }
  },

  /**
   * POST /api/auth/logout
   * Menaikkan tokenVersion, sehingga seluruh token milik pengguna ini ditolak.
   * Tanpa daftar sesi per perangkat, logout memang mengeluarkan semua perangkat —
   * pilihan yang disengaja agar tombol keluar benar-benar berarti.
   */
  async logout(req, res) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { tokenVersion: { increment: 1 } }
      });
      res.json({ message: 'Berhasil keluar. Semua sesi perangkat lain ikut diakhiri.' });
    } catch (err) {
      console.error('[auth/logout error]:', err);
      res.status(500).json({ error: 'Gagal mengakhiri sesi.' });
    }
  },

  // GET /api/auth/me
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, phone: true, isActive: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan.' });
      }

      // Modul ikut dikirim agar menu & guard halaman di frontend mengikuti
      // hak akses terbaru, termasuk perubahan dari menu Pengguna & Hak Akses.
      res.json({ ...user, modules: await rolePolicy.getModulesForRole(user.role) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;
