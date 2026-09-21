const prisma = require('../api/db');
const passwordHash = require('../api/passwordHash');

const ROLES = ['OWNER', 'ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'ACCOUNTING'];
const MIN_PASSWORD_LENGTH = 10;
const KNOWN_DEFAULT_PASSWORDS = ['admin123'];

const PUBLIC_FIELDS = {
  id: true, name: true, email: true, role: true, phone: true,
  isActive: true, createdAt: true, updatedAt: true
};

/** Pesan error bila password tidak memenuhi syarat, atau null bila diterima. */
function validatePassword(password, email = '') {
  if (!password || password.length < MIN_PASSWORD_LENGTH) return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  if (KNOWN_DEFAULT_PASSWORDS.includes(password.toLowerCase())) return 'Password itu adalah password default yang sudah publik.';
  const local = (email.split('@')[0] || '').toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) return 'Password tidak boleh memuat nama akun.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Password harus memuat huruf dan angka.';
  return null;
}

/**
 * Hanya OWNER yang boleh menyentuh akun OWNER atau memberi role OWNER.
 * Tanpa aturan ini, seorang ADMIN bisa menaikkan dirinya sendiri menjadi OWNER.
 */
function guardOwnerEscalation(actor, { targetRole, targetUser }) {
  if (actor.role === 'OWNER') return null;
  if (targetUser && targetUser.role === 'OWNER') return 'Hanya OWNER yang boleh mengubah akun OWNER.';
  if (targetRole === 'OWNER') return 'Hanya OWNER yang boleh memberikan peran OWNER.';
  return null;
}

/** Mencegah OWNER terakhir yang aktif dihapus/dinonaktifkan/diturunkan perannya. */
async function wouldRemoveLastOwner(targetUser, { newRole, newIsActive } = {}) {
  if (targetUser.role !== 'OWNER' || !targetUser.isActive) return false;
  const masihOwnerAktif = (newRole === undefined || newRole === 'OWNER') && newIsActive !== false;
  if (masihOwnerAktif) return false;
  const jumlahOwnerAktif = await prisma.user.count({ where: { role: 'OWNER', isActive: true } });
  return jumlahOwnerAktif <= 1;
}

const userController = {
  // GET /api/users
  async getUsers(req, res) {
    try {
      const users = await prisma.user.findMany({ select: PUBLIC_FIELDS, orderBy: { createdAt: 'asc' } });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/users
  async createUser(req, res) {
    try {
      const { name, email, password, role, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
      }
      if (!ROLES.includes(role)) {
        return res.status(400).json({ error: 'Peran (role) tidak dikenal.' });
      }

      const escalation = guardOwnerEscalation(req.user, { targetRole: role });
      if (escalation) return res.status(403).json({ error: escalation });

      const cleanEmail = email.toLowerCase().trim();
      const problem = validatePassword(password, cleanEmail);
      if (problem) return res.status(400).json({ error: problem });

      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) return res.status(409).json({ error: 'Email itu sudah dipakai akun lain.' });

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: await passwordHash.hash(password),
          role,
          phone: phone || null
        },
        select: PUBLIC_FIELDS
      });

      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, phone, isActive } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: 'Akun tidak ditemukan.' });

      if (role !== undefined && !ROLES.includes(role)) {
        return res.status(400).json({ error: 'Peran (role) tidak dikenal.' });
      }

      const escalation = guardOwnerEscalation(req.user, { targetRole: role, targetUser: target });
      if (escalation) return res.status(403).json({ error: escalation });

      // Mencegah mengunci diri sendiri.
      if (target.id === req.user.id) {
        if (isActive === false) return res.status(400).json({ error: 'Anda tidak bisa menonaktifkan akun Anda sendiri.' });
        if (role !== undefined && role !== target.role) {
          return res.status(400).json({ error: 'Anda tidak bisa mengubah peran akun Anda sendiri.' });
        }
      }

      if (await wouldRemoveLastOwner(target, { newRole: role, newIsActive: isActive })) {
        return res.status(400).json({ error: 'Ini satu-satunya OWNER yang aktif. Angkat OWNER lain terlebih dahulu.' });
      }

      if (email && email.toLowerCase().trim() !== target.email) {
        const bentrok = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (bentrok) return res.status(409).json({ error: 'Email itu sudah dipakai akun lain.' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(email !== undefined ? { email: email.toLowerCase().trim() } : {}),
          ...(role !== undefined ? { role } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
          // Menonaktifkan dari form juga harus memutus sesi yang sedang berjalan.
          ...(isActive === false ? { tokenVersion: { increment: 1 } } : {})
        },
        select: PUBLIC_FIELDS
      });

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/users/:id/reset-password
  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: 'Akun tidak ditemukan.' });

      const escalation = guardOwnerEscalation(req.user, { targetUser: target });
      if (escalation) return res.status(403).json({ error: escalation });

      const problem = validatePassword(password, target.email);
      if (problem) return res.status(400).json({ error: problem });

      // tokenVersion naik: seluruh sesi lama pemilik akun ini langsung ditolak.
      await prisma.user.update({
        where: { id },
        data: { password: await passwordHash.hash(password), tokenVersion: { increment: 1 } }
      });
      res.json({ message: 'Password akun berhasil diganti. Sesi lama akun ini otomatis diakhiri.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: 'Akun tidak ditemukan.' });

      const escalation = guardOwnerEscalation(req.user, { targetUser: target });
      if (escalation) return res.status(403).json({ error: escalation });

      if (target.id === req.user.id) {
        return res.status(400).json({ error: 'Anda tidak bisa menghapus akun Anda sendiri.' });
      }
      if (await wouldRemoveLastOwner(target, { newIsActive: false })) {
        return res.status(400).json({ error: 'Ini satu-satunya OWNER yang aktif. Angkat OWNER lain terlebih dahulu.' });
      }

      // Akun tetap dirujuk SPK/SO/PO sebagai pembuat, jadi dinonaktifkan, bukan dihapus.
      // tokenVersion dinaikkan agar sesi yang sedang berjalan langsung terputus.
      await prisma.user.update({ where: { id }, data: { isActive: false, tokenVersion: { increment: 1 } } });
      res.json({ message: 'Akun dinonaktifkan. Riwayat transaksi yang dibuatnya tetap tersimpan.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = userController;
module.exports.validatePassword = validatePassword;
