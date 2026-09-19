const prisma = require('../api/db');

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
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/inventory/movements
  async getMovements(req, res) {
    try {
      const { itemType, limit = 100 } = req.query;
      const where = itemType ? { itemType } : {};

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          rawMaterial: { include: { unit: true } },
          product: { include: { unit: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });

      res.json(movements);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/inventory/movements/manual
  async createManualMovement(req, res) {
    try {
      const { itemType, rawMaterialId, productId, type, quantity, notes } = req.body;
      const qty = Number(quantity);

      if (!qty || qty === 0) {
        return res.status(400).json({ error: 'Kuantitas tidak boleh 0.' });
      }

      let balanceAfter = 0;

      if (itemType === 'RAW_MATERIAL') {
        const mat = await prisma.rawMaterial.findUnique({ where: { id: rawMaterialId } });
        if (!mat) return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });

        balanceAfter = Number(mat.currentStock) + qty;
        await prisma.rawMaterial.update({
          where: { id: rawMaterialId },
          data: { currentStock: balanceAfter }
        });
      } else {
        const prod = await prisma.product.findUnique({ where: { id: productId } });
        if (!prod) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

        balanceAfter = Number(prod.currentStock) + qty;
        await prisma.product.update({
          where: { id: productId },
          data: { currentStock: Math.round(balanceAfter) }
        });
      }

      const movement = await prisma.stockMovement.create({
        data: {
          itemType,
          rawMaterialId: itemType === 'RAW_MATERIAL' ? rawMaterialId : null,
          productId: itemType === 'PRODUCT' ? productId : null,
          type: type || 'STOCK_ADJUSTMENT',
          quantity: qty,
          balanceAfter,
          referenceType: 'MANUAL',
          referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
          notes
        }
      });

      res.status(201).json(movement);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/inventory/opname
  async createOpname(req, res) {
    try {
      const { itemType, notes, items } = req.body;
      const opnameNumber = `OP-${Date.now().toString().slice(-6)}`;

      const opname = await prisma.stockOpname.create({
        data: {
          opnameNumber,
          itemType: itemType || 'RAW_MATERIAL',
          status: 'DRAFT',
          notes,
          items: {
            create: (items || []).map(i => ({
              rawMaterialId: i.rawMaterialId || null,
              productId: i.productId || null,
              systemQty: Number(i.systemQty) || 0,
              physicalQty: Number(i.physicalQty) || 0,
              difference: (Number(i.physicalQty) || 0) - (Number(i.systemQty) || 0),
              notes: i.notes
            }))
          }
        },
        include: { items: true }
      });

      res.status(201).json(opname);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/inventory/opname/:id/apply
  async applyOpname(req, res) {
    try {
      const { id } = req.params;
      const opname = await prisma.stockOpname.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!opname || opname.status === 'APPLIED') {
        return res.status(400).json({ error: 'Opname tidak ditemukan atau sudah diterapkan.' });
      }

      for (const item of opname.items) {
        if (item.difference !== 0) {
          if (opname.itemType === 'RAW_MATERIAL' && item.rawMaterialId) {
            await prisma.rawMaterial.update({
              where: { id: item.rawMaterialId },
              data: { currentStock: item.physicalQty }
            });
            await prisma.stockMovement.create({
              data: {
                itemType: 'RAW_MATERIAL',
                rawMaterialId: item.rawMaterialId,
                type: 'STOCK_ADJUSTMENT',
                quantity: item.difference,
                balanceAfter: item.physicalQty,
                referenceType: 'OPNAME',
                referenceId: opname.opnameNumber,
                notes: `Penyesuaian Opname Fisik: ${item.notes || '-'}`
              }
            });
          } else if (opname.itemType === 'PRODUCT' && item.productId) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { currentStock: Math.round(Number(item.physicalQty)) }
            });
            await prisma.stockMovement.create({
              data: {
                itemType: 'PRODUCT',
                productId: item.productId,
                type: 'STOCK_ADJUSTMENT',
                quantity: item.difference,
                balanceAfter: item.physicalQty,
                referenceType: 'OPNAME',
                referenceId: opname.opnameNumber,
                notes: `Penyesuaian Opname Fisik: ${item.notes || '-'}`
              }
            });
          }
        }
      }

      const updated = await prisma.stockOpname.update({
        where: { id },
        data: { status: 'APPLIED' }
      });

      res.json({ message: 'Hasil opname berhasil diterapkan ke stok.', opname: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = inventoryController;
