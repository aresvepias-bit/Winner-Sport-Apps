const prisma = require('../api/db');
const rolePolicy = require('../api/rolePolicy');

const permissionController = {
  // GET /api/users/permissions
  async getPermissions(req, res) {
    try {
      res.json({
        matrix: await rolePolicy.getMatrix(),
        roles: rolePolicy.EDITABLE_ROLES,
        modules: rolePolicy.EDITABLE_MODULES,
        // Modul yang sengaja tidak bisa diubah, supaya jelas di UI kenapa tidak muncul.
        fixed: rolePolicy.FIXED_POLICY
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/users/permissions
  async updatePermissions(req, res) {
    try {
      const { changes } = req.body;
      if (!Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ error: 'Tidak ada perubahan hak akses yang dikirim.' });
      }

      for (const c of changes) {
        if (!rolePolicy.EDITABLE_MODULES.includes(c.module)) {
          return res.status(400).json({ error: `Modul "${c.module}" tidak bisa diatur dari sini.` });
        }
        if (!rolePolicy.EDITABLE_ROLES.includes(c.role)) {
          return res.status(400).json({ error: `Peran "${c.role}" tidak bisa diatur dari sini.` });
        }
        if (typeof c.allowed !== 'boolean') {
          return res.status(400).json({ error: 'Nilai izin harus true atau false.' });
        }
      }

      // ADMIN yang mencabut akses ADMIN-nya sendiri bisa terkunci dari fitur yang sedang dipakai.
      if (req.user.role !== 'OWNER') {
        const mencabutDiriSendiri = changes.some((c) => c.role === req.user.role && c.allowed === false);
        if (mencabutDiriSendiri) {
          return res.status(403).json({ error: 'Anda tidak bisa mencabut hak akses peran Anda sendiri. Minta OWNER melakukannya.' });
        }
      }

      for (const c of changes) {
        await prisma.rolePermission.upsert({
          where: { role_module: { role: c.role, module: c.module } },
          update: { allowed: c.allowed },
          create: { role: c.role, module: c.module, allowed: c.allowed }
        });
      }

      rolePolicy.invalidate();

      res.json({
        message: 'Hak akses diperbarui. Perubahan langsung berlaku tanpa restart server.',
        matrix: await rolePolicy.getMatrix()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = permissionController;
