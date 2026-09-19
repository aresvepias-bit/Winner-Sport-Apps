const prisma = require('../api/db');

/**
 * Controller: Manufaktur & Surat Perintah Kerja (SPK) Konveksi
 */
const productionController = {
  // GET /api/production/work-orders
  async getWorkOrders(req, res) {
    try {
      const { status } = req.query;
      const where = status ? { status } : {};

      const workOrders = await prisma.workOrder.findMany({
        where,
        include: {
          product: { include: { unit: true } },
          bom: true,
          createdBy: { select: { id: true, name: true } },
          materials: {
            include: { rawMaterial: { include: { unit: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(workOrders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/production/work-orders/:id
  async getWorkOrderById(req, res) {
    try {
      const { id } = req.params;
      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          product: { include: { unit: true } },
          bom: { include: { items: { include: { rawMaterial: true } } } },
          createdBy: { select: { id: true, name: true } },
          materials: {
            include: { rawMaterial: { include: { unit: true } } }
          }
        }
      });

      if (!workOrder) {
        return res.status(404).json({ error: 'SPK tidak ditemukan.' });
      }

      res.json(workOrder);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/production/work-orders
  async createWorkOrder(req, res) {
    try {
      const { productId, bomId, targetQty, startDate, dueDate, notes } = req.body;
      const qty = parseInt(targetQty);

      if (!productId || !qty || qty <= 0) {
        return res.status(400).json({ error: 'Produk dan target quantity wajib valid.' });
      }

      let selectedBom = null;
      if (bomId) {
        selectedBom = await prisma.bom.findUnique({
          where: { id: bomId },
          include: { items: { include: { rawMaterial: true } } }
        });
      } else {
        selectedBom = await prisma.bom.findFirst({
          where: { productId, isActive: true },
          include: { items: { include: { rawMaterial: true } } }
        });
      }

      const woNumber = `SPK-${Date.now().toString().slice(-6)}`;

      let materialsData = [];
      let estimatedMaterialCost = 0;

      if (selectedBom && selectedBom.items.length > 0) {
        const wasteFactor = 1 + (Number(selectedBom.wastePercent || 0) / 100);

        materialsData = selectedBom.items.map(item => {
          const plannedQty = (Number(item.quantityPerPcs) * qty * wasteFactor);
          const unitCost = Number(item.rawMaterial.standardCost || 0);
          const subtotal = plannedQty * unitCost;
          estimatedMaterialCost += subtotal;

          return {
            rawMaterialId: item.rawMaterialId,
            plannedQty,
            actualIssuedQty: 0,
            unitCost,
            subtotal: 0
          };
        });
      }

      const workOrder = await prisma.workOrder.create({
        data: {
          woNumber,
          productId,
          bomId: selectedBom ? selectedBom.id : null,
          targetQty: qty,
          status: 'DRAFT',
          startDate: startDate ? new Date(startDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          createdById: req.user.id,
          materialCost: 0,
          materials: {
            create: materialsData
          }
        },
        include: {
          product: true,
          bom: true,
          materials: { include: { rawMaterial: true } }
        }
      });

      res.status(201).json(workOrder);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/production/work-orders/:id/issue-materials
  async issueMaterials(req, res) {
    try {
      const { id } = req.params;
      const { materials } = req.body;

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: { materials: { include: { rawMaterial: true } } }
      });

      if (!workOrder) {
        return res.status(404).json({ error: 'SPK tidak ditemukan.' });
      }

      let totalMaterialCost = 0;

      for (const item of materials) {
        const issued = Number(item.issuedQty);
        if (issued <= 0) continue;

        const mat = await prisma.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
        if (!mat) continue;

        const newStock = Number(mat.currentStock) - issued;
        await prisma.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data: { currentStock: newStock }
        });

        await prisma.stockMovement.create({
          data: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: item.rawMaterialId,
            type: 'MATERIAL_ISSUE',
            quantity: -issued,
            balanceAfter: newStock,
            referenceType: 'WO',
            referenceId: workOrder.woNumber,
            notes: `Pengeluaran bahan baku untuk ${workOrder.woNumber}`
          }
        });

        const itemCost = issued * Number(mat.standardCost);
        totalMaterialCost += itemCost;

        const woMat = workOrder.materials.find(m => m.rawMaterialId === item.rawMaterialId);
        if (woMat) {
          await prisma.workOrderMaterial.update({
            where: { id: woMat.id },
            data: {
              actualIssuedQty: Number(woMat.actualIssuedQty) + issued,
              unitCost: mat.standardCost,
              subtotal: (Number(woMat.actualIssuedQty) + issued) * Number(mat.standardCost)
            }
          });
        }
      }

      const updatedWO = await prisma.workOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          materialCost: Number(workOrder.materialCost) + totalMaterialCost
        },
        include: { materials: { include: { rawMaterial: true } } }
      });

      res.json({ message: 'Bahan berhasil dikeluarkan ke produksi.', workOrder: updatedWO });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/production/work-orders/:id/complete
  async completeWorkOrder(req, res) {
    try {
      const { id } = req.params;
      const { completedQty, scrapQty, sewingCost, laborCost, overheadCost, updateProductHpp } = req.body;

      const cQty = parseInt(completedQty) || 0;
      const sQty = parseInt(scrapQty) || 0;

      if (cQty <= 0) {
        return res.status(400).json({ error: 'Jumlah produk jadi (Grade A) harus lebih dari 0.' });
      }

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: { product: true }
      });

      if (!workOrder) {
        return res.status(404).json({ error: 'SPK tidak ditemukan.' });
      }

      const matCost = Number(workOrder.materialCost);
      const sewCost = Number(sewingCost) || 0;
      const labCost = Number(laborCost) || 0;
      const ovhCost = Number(overheadCost) || 0;

      const totalProductionCost = matCost + sewCost + labCost + ovhCost;
      const hppPerPcs = totalProductionCost / cQty;

      const newProductStock = Number(workOrder.product.currentStock) + cQty;
      await prisma.product.update({
        where: { id: workOrder.productId },
        data: {
          currentStock: newProductStock,
          ...(updateProductHpp ? { standardCost: hppPerPcs } : {})
        }
      });

      await prisma.stockMovement.create({
        data: {
          itemType: 'PRODUCT',
          productId: workOrder.productId,
          type: 'PRODUCTION_RESULT',
          quantity: cQty,
          balanceAfter: newProductStock,
          referenceType: 'WO',
          referenceId: workOrder.woNumber,
          notes: `Hasil produksi Grade A (${cQty} pcs) dari ${workOrder.woNumber}`
        }
      });

      if (sQty > 0) {
        await prisma.stockMovement.create({
          data: {
            itemType: 'PRODUCT',
            productId: workOrder.productId,
            type: 'SCRAP_WASTE',
            quantity: sQty,
            balanceAfter: newProductStock,
            referenceType: 'WO',
            referenceId: workOrder.woNumber,
            notes: `Produk cacat/scrap rijek (${sQty} pcs) dari ${workOrder.woNumber}`
          }
        });
      }

      const completedWO = await prisma.workOrder.update({
        where: { id },
        data: {
          completedQty: cQty,
          scrapQty: sQty,
          sewingCost: sewCost,
          laborCost: labCost,
          overheadCost: ovhCost,
          totalProductionCost,
          hppPerPcs,
          status: 'COMPLETED',
          completedDate: new Date()
        },
        include: { product: true }
      });

      res.json({
        message: 'SPK selesai! Stok produk jadi telah bertambah dan HPP telah dikalkulasi.',
        workOrder: completedWO,
        summary: {
          completedQty: cQty,
          scrapQty: sQty,
          totalCost: totalProductionCost,
          hppPerPcs: Math.round(hppPerPcs)
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = productionController;
