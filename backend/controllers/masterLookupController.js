const prisma = require('../api/db');
const unitConversion = require('../api/unitConversion');

/**
 * Master Satuan & Tipe Penjualan.
 * Keduanya dipakai form Order Penjualan; satuan juga menentukan rasio ke pcs
 * yang memengaruhi HPP dan pengurangan stok, jadi perubahannya membatalkan cache.
 */
const masterLookupController = {
  // ---------------------------------------------------------------- SATUAN
  // GET /api/master/units
  async getUnits(req, res) {
    try {
      const { activeOnly } = req.query;
      const units = await prisma.unit.findMany({
        where: activeOnly === 'true' ? { isActive: true } : {},
        orderBy: { name: 'asc' }
      });
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/master/units
  async createUnit(req, res) {
    try {
      const { name, symbol, ratioToPcs, description } = req.body;
      if (!name || !symbol) return res.status(400).json({ error: 'Nama dan simbol satuan wajib diisi.' });

      const ratio = Number(ratioToPcs);
      if (!Number.isFinite(ratio) || ratio <= 0) {
        return res.status(400).json({ error: 'Isi satuan (berapa pcs) harus lebih dari 0.' });
      }

      const unit = await prisma.unit.create({
        data: { name: name.trim(), symbol: symbol.trim().toLowerCase(), ratioToPcs: ratio, description }
      });
      unitConversion.invalidate();
      res.status(201).json(unit);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Nama satuan itu sudah ada.' });
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/master/units/:id
  async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { name, symbol, ratioToPcs, description, isActive } = req.body;

      if (ratioToPcs !== undefined) {
        const ratio = Number(ratioToPcs);
        if (!Number.isFinite(ratio) || ratio <= 0) {
          return res.status(400).json({ error: 'Isi satuan (berapa pcs) harus lebih dari 0.' });
        }
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(symbol !== undefined ? { symbol: symbol.trim().toLowerCase() } : {}),
          ...(ratioToPcs !== undefined ? { ratioToPcs: Number(ratioToPcs) } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(isActive !== undefined ? { isActive } : {})
        }
      });
      unitConversion.invalidate();
      res.json(unit);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Nama satuan itu sudah ada.' });
      if (err.code === 'P2025') return res.status(404).json({ error: 'Satuan tidak ditemukan.' });
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/master/units/:id
  async deleteUnit(req, res) {
    try {
      const { id } = req.params;
      const [materials, products] = await Promise.all([
        prisma.rawMaterial.count({ where: { unitId: id } }),
        prisma.product.count({ where: { unitId: id } })
      ]);

      // Masih dipakai item master: nonaktifkan agar data lama tetap terbaca.
      if (materials + products > 0) {
        const unit = await prisma.unit.update({ where: { id }, data: { isActive: false } });
        unitConversion.invalidate();
        return res.json({
          message: `Satuan masih dipakai ${materials + products} item, jadi dinonaktifkan (bukan dihapus).`,
          unit
        });
      }

      await prisma.unit.delete({ where: { id } });
      unitConversion.invalidate();
      res.json({ message: 'Satuan berhasil dihapus.' });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Satuan tidak ditemukan.' });
      res.status(500).json({ error: err.message });
    }
  },

  // -------------------------------------------------------- TIPE PENJUALAN
  // GET /api/master/sales-types
  async getSalesTypes(req, res) {
    try {
      const { activeOnly } = req.query;
      const types = await prisma.salesType.findMany({
        where: activeOnly === 'true' ? { isActive: true } : {},
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      });
      res.json(types);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/master/sales-types
  async createSalesType(req, res) {
    try {
      const { code, name, description, sortOrder } = req.body;
      if (!code || !name) return res.status(400).json({ error: 'Kode dan nama tipe penjualan wajib diisi.' });

      // Kode dipakai apa adanya di data order, jadi dibakukan: HURUF_BESAR tanpa spasi.
      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (!cleanCode) return res.status(400).json({ error: 'Kode harus memuat huruf atau angka.' });

      const type = await prisma.salesType.create({
        data: { code: cleanCode, name: name.trim(), description, sortOrder: Number(sortOrder) || 0 }
      });
      res.status(201).json(type);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Kode tipe penjualan itu sudah dipakai.' });
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/master/sales-types/:id
  async updateSalesType(req, res) {
    try {
      const { id } = req.params;
      const { name, description, sortOrder, isActive } = req.body;

      // Kode sengaja tidak bisa diubah: sudah tersimpan di order yang ada.
      const type = await prisma.salesType.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
          ...(isActive !== undefined ? { isActive } : {})
        }
      });
      res.json(type);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Tipe penjualan tidak ditemukan.' });
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/master/sales-types/:id
  async deleteSalesType(req, res) {
    try {
      const { id } = req.params;
      const type = await prisma.salesType.findUnique({ where: { id } });
      if (!type) return res.status(404).json({ error: 'Tipe penjualan tidak ditemukan.' });

      const dipakai = await prisma.salesOrder.count({ where: { orderType: type.code } });
      if (dipakai > 0) {
        const updated = await prisma.salesType.update({ where: { id }, data: { isActive: false } });
        return res.json({
          message: `Tipe ini dipakai ${dipakai} order, jadi dinonaktifkan (bukan dihapus) agar riwayat tetap terbaca.`,
          salesType: updated
        });
      }

      await prisma.salesType.delete({ where: { id } });
      res.json({ message: 'Tipe penjualan berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = masterLookupController;
