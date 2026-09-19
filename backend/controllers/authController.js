const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { JWT_SECRET } = require('../api/authMiddleware');

/**
 * Controller: Autentikasi Pengguna
 */
const authController = {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi.' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Email tidak terdaftar atau akun nonaktif.' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Password salah.' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('[auth/login error]:', err);
      res.status(500).json({ error: 'Terjadi kesalahan internal server: ' + err.message });
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

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;
