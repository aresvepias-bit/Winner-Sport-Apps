const prisma = require('../api/db');
const { randomUUID } = require('node:crypto');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const itemModel = (db, type) => {
  if (!['RAW_MATERIAL', 'PRODUCT'].includes(type)) fail('Tipe barang tidak valid.');
  return type === 'RAW_MATERIAL' ? db.rawMaterial : db.product;
};
const quantityValue = (value, type) => {
  if (value === null || value === undefined || value === '' || !['number', 'string'].includes(typeof value)) fail('Kuantitas wajib diisi.');
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > (type === 'PRODUCT' ? 2147483647 : 9999999999.99) || Math.abs(n * 100 - Math.round(n * 100)) > 0.0001) fail('Kuantitas tidak valid; maksimal 2 angka desimal.');
  if (type === 'PRODUCT' && !Number.isInteger(n)) fail('Stok produk harus berupa pcs bulat.');
  return n;
};
const sendError = (res, err) => res.status(err.code === 'P2034' ? 409 : err.status || 500).json({ error: err.code === 'P2034' ? 'Stok sedang berubah. Segarkan data dan coba kembali.' : err.message });
const transact = (fn) => prisma.$transaction(fn, { isolationLevel: 'Serializable' });

/**
 * Controller: Inventori Bahan Baku, Pakaian Jadi, Mutasi, dan Stock Opname
 */
const inventoryController = {
  // GET /api/inventory/summary
  async getSummary(req, res) {
    try {
      const rawMaterials = await prisma.rawMaterial.findMany({
        include: { unit: true, category: true }
      });

      const products = await prisma.product.findMany({
        include: { unit: true, category: true }
      });

      const totalRawMaterialStockValue = rawMaterials.reduce((acc, curr) => {
        return acc + (Number(curr.currentStock) * Number(curr.standardCost));
      }, 0);

      const totalProductStockValue = products.reduce((acc, curr) => {
        return acc + (Number(curr.currentStock) * Number(curr.standardCost));
      }, 0);

      const lowStockMaterials = rawMaterials.filter(
        item => Number(item.currentStock) <= Number(item.minimumStock)
      );

      const lowStockProducts = products.filter(
        item => Number(item.currentStock) <= Number(item.minimumStock)
      );

      res.json({
        totalRawMaterialStockValue,
        totalProductStockValue,
        totalInventoryValue: totalRawMaterialStockValue + totalProductStockValue,
        rawMaterialsCount: rawMaterials.length,
        productsCount: products.length,
        lowStockMaterials,
        lowStockProducts
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  // GET /api/inventory/movements
  async getMovements(req, res) {
    try {
      const { itemType, itemId, limit = 100 } = req.query;
      if (itemType) itemModel(prisma, itemType);
      const take = Number(limit);
      if (!Number.isInteger(take) || take < 1 || take > 1000) return res.status(400).json({ error: 'Limit harus antara 1 dan 1000.' });
      if (itemId && !itemType) return res.status(400).json({ error: 'Tipe barang diperlukan.' });
      const where = { ...(itemType ? { itemType } : {}), ...(itemId ? { [itemType === 'RAW_MATERIAL' ? 'rawMaterialId' : 'productId']: itemId } : {}) };

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          rawMaterial: { include: { unit: true } },
          product: { include: { unit: true } }
        },
        orderBy: { createdAt: 'desc' },
        take
      });

      res.json(movements);
    } catch (err) {
      sendError(res, err);
    }
  },

  // Penyesuaian non-PO/SO/WO: saldo dan audit mutasi harus tersimpan bersama.
  async createManualMovement(req, res) {
    try {
      const { itemType, rawMaterialId, productId, notes, type = 'STOCK_ADJUSTMENT' } = req.body;
      itemModel(prisma, itemType);
      const id = itemType === 'RAW_MATERIAL' ? rawMaterialId : productId;
      if (!id || (itemType === 'RAW_MATERIAL' ? productId : rawMaterialId)) fail('Pilih satu barang sesuai tipe.');
      const qty = quantityValue(req.body.quantity, itemType);
      if (!qty) fail('Kuantitas tidak boleh 0.');
      if (type !== 'STOCK_ADJUSTMENT') fail('Gunakan dokumen pembelian, produksi, atau penjualan untuk transaksi terkait.');
      if (typeof notes !== 'string' || !notes.trim()) fail('Alasan penyesuaian wajib diisi.');
      const movement = await transact(async (tx) => {
        const model = itemModel(tx, itemType);
        const item = await model.findUnique({ where: { id } });
        if (!item) fail('Barang tidak ditemukan.', 404);
        const balanceAfter = quantityValue(Number((Number(item.currentStock) + qty).toFixed(2)), itemType);
        if (balanceAfter < 0) fail('Stok tidak cukup. Pengeluaran tidak boleh membuat saldo negatif.');
        await model.update({ where: { id }, data: { currentStock: balanceAfter } });
        return tx.stockMovement.create({ data: {
          itemType, rawMaterialId: itemType === 'RAW_MATERIAL' ? id : null,
          productId: itemType === 'PRODUCT' ? id : null,
          type, quantity: qty, balanceAfter, referenceType: 'MANUAL',
          referenceId: `ADJ-${randomUUID()}`, notes: notes.trim()
        } });
      });
      res.status(201).json(movement);
    } catch (err) { sendError(res, err); }
  },

  // GET /api/inventory/opname
  async getOpnames(req, res) {
    try {
      const opnames = await prisma.stockOpname.findMany({
        include: {
          items: {
            include: {
              rawMaterial: { include: { unit: true } },
              product: { include: { unit: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(opnames);
    } catch (err) {
      sendError(res, err);
    }
  },

  async createOpname(req, res) {
    try {
      const { itemType, notes, items } = req.body;
      itemModel(prisma, itemType);
      if (!Array.isArray(items) || !items.length || items.length > 500) fail('Isi 1 hingga 500 barang untuk opname.');
      const opname = await transact(async (tx) => {
        const seen = new Set();
        const lines = [];
        for (const line of items) {
          if (!line || typeof line !== 'object') fail('Baris opname tidak valid.');
          const id = itemType === 'RAW_MATERIAL' ? line.rawMaterialId : line.productId;
          if (!id || seen.has(id) || (itemType === 'RAW_MATERIAL' ? line.productId : line.rawMaterialId)) fail('Barang opname tidak valid atau duplikat.');
          seen.add(id);
          const physicalQty = quantityValue(line.physicalQty, itemType);
          if (physicalQty < 0) fail('Stok fisik tidak boleh negatif.');
          const item = await itemModel(tx, itemType).findUnique({ where: { id } });
          if (!item) fail('Barang tidak ditemukan.', 404);
          const systemQty = Number(item.currentStock);
          // Tolak hitungan dari layar yang sudah kedaluwarsa; jangan percaya saldo kiriman klien.
          if (line.systemQty !== undefined && quantityValue(line.systemQty, itemType) !== systemQty) fail('Stok berubah sejak halaman dibuka. Segarkan dan hitung ulang.', 409);
          lines.push({ rawMaterialId: itemType === 'RAW_MATERIAL' ? id : null, productId: itemType === 'PRODUCT' ? id : null,
            systemQty, physicalQty, difference: Number((physicalQty - systemQty).toFixed(2)), notes: line.notes });
        }
        return tx.stockOpname.create({ data: { opnameNumber: `OP-${randomUUID()}`, itemType, status: 'DRAFT', notes, items: { create: lines } }, include: { items: true } });
      });
      res.status(201).json(opname);
    } catch (err) { sendError(res, err); }
  },

  async applyOpname(req, res) {
    try {
      const updated = await transact(async (tx) => {
        const opname = await tx.stockOpname.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!opname || opname.status !== 'DRAFT') fail('Opname tidak ditemukan atau sudah diterapkan.');
        if (!opname.items.length) fail('Opname kosong tidak dapat diterapkan.');
        const model = itemModel(tx, opname.itemType);
        // Validasi seluruh baris sebelum melakukan perubahan.
        for (const line of opname.items) {
          const item = await model.findUnique({ where: { id: opname.itemType === 'RAW_MATERIAL' ? line.rawMaterialId : line.productId } });
          if (!item || Number(item.currentStock) !== Number(line.systemQty)) fail('Stok berubah setelah draft dibuat. Buat opname baru berdasarkan stok terkini.', 409);
          if (quantityValue(Number(line.physicalQty), opname.itemType) < 0) fail('Stok fisik tidak boleh negatif.');
        }
        for (const line of opname.items) {
          const balanceAfter = Number(line.physicalQty);
          const difference = Number((balanceAfter - Number(line.systemQty)).toFixed(2));
          if (!difference) continue;
          const id = opname.itemType === 'RAW_MATERIAL' ? line.rawMaterialId : line.productId;
          await model.update({ where: { id }, data: { currentStock: balanceAfter } });
          await tx.stockMovement.create({ data: {
            itemType: opname.itemType, rawMaterialId: line.rawMaterialId, productId: line.productId,
            type: 'STOCK_ADJUSTMENT', quantity: difference, balanceAfter,
            referenceType: 'OPNAME', referenceId: opname.opnameNumber,
            notes: `Penyesuaian Opname Fisik: ${line.notes || opname.notes || '-'}`
          } });
        }
        return tx.stockOpname.update({ where: { id: opname.id }, data: { status: 'APPLIED' } });
      });
      res.json({ message: 'Hasil opname berhasil diterapkan ke stok.', opname: updated });
    } catch (err) { sendError(res, err); }
  }
};

module.exports = inventoryController;
