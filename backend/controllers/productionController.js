const prisma = require('../api/db');
const { postJournal, AKUN } = require('../api/journal');

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
      const { materials } = req.body || {};

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: { materials: { include: { rawMaterial: true } } }
      });

      if (!workOrder) return res.status(404).json({ error: 'SPK tidak ditemukan.' });
      if (workOrder.status === 'COMPLETED') {
        return res.status(400).json({ error: 'SPK sudah selesai, bahan tidak bisa dikeluarkan lagi.' });
      }
      if (workOrder.status === 'CANCELLED') {
        return res.status(400).json({ error: 'SPK sudah dibatalkan.' });
      }
      if (!Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ error: 'Tidak ada bahan yang dikeluarkan.' });
      }

      // Seluruh baris divalidasi lebih dulu. Sebelumnya bahan yang tidak dikenal
      // dilewati diam-diam dan stok boleh jadi minus, tapi pengguna tetap
      // menerima pesan berhasil.
      const rencana = [];
      const sudahDipakai = new Set();

      for (const item of materials) {
        const issued = Number(item.issuedQty);
        if (!Number.isFinite(issued) || issued <= 0) continue;

        const woMat = workOrder.materials.find((m) => m.rawMaterialId === item.rawMaterialId);
        if (!woMat) {
          return res.status(400).json({ error: 'Ada bahan yang bukan bagian dari SPK ini.' });
        }
        if (sudahDipakai.has(woMat.id)) {
          return res.status(400).json({ error: 'Bahan yang sama dikirim lebih dari sekali.' });
        }
        sudahDipakai.add(woMat.id);

        const mat = await prisma.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
        if (!mat) return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
        if (issued > Number(mat.currentStock) + 0.001) {
          return res.status(400).json({
            error: `Stok ${mat.name} tidak cukup: diminta ${issued}, tersedia ${Number(mat.currentStock)}.`
          });
        }

        rencana.push({ woMat, mat, issued });
      }

      if (rencana.length === 0) {
        return res.status(400).json({ error: 'Isi jumlah bahan yang dikeluarkan minimal pada satu baris.' });
      }

      const updatedWO = await prisma.$transaction(async (tx) => {
        let totalMaterialCost = 0;

        for (const { woMat, mat, issued } of rencana) {
          const newStock = Number(mat.currentStock) - issued;
          await tx.rawMaterial.update({
            where: { id: mat.id },
            data: { currentStock: newStock }
          });

          await tx.stockMovement.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: mat.id,
              type: 'MATERIAL_ISSUE',
              quantity: -issued,
              balanceAfter: newStock,
              referenceType: 'WO',
              referenceId: workOrder.woNumber,
              notes: `Pengeluaran bahan baku untuk ${workOrder.woNumber}`
            }
          });

          const totalDikeluarkan = Number(woMat.actualIssuedQty) + issued;
          await tx.workOrderMaterial.update({
            where: { id: woMat.id },
            data: {
              actualIssuedQty: totalDikeluarkan,
              unitCost: mat.standardCost,
              subtotal: totalDikeluarkan * Number(mat.standardCost)
            }
          });

          totalMaterialCost += issued * Number(mat.standardCost);
        }

        // Tidak ada jurnal di sini: pemakaian bahan baru dibukukan saat SPK
        // diselesaikan (Dr Persediaan Jadi / Cr Persediaan Bahan). Menjurnal
        // dua kali akan mengkredit persediaan bahan dobel.
        return tx.workOrder.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            materialCost: Number(workOrder.materialCost) + totalMaterialCost
          },
          include: { materials: { include: { rawMaterial: true } } }
        });
      });

      res.json({ message: 'Bahan berhasil dikeluarkan ke produksi.', workOrder: updatedWO });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
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

      // Semua perubahan (stok, mutasi, SPK, jurnal) dijalankan sekaligus.
      // Kalau jurnalnya gagal, stok pun tidak jadi bertambah — tidak ada keadaan separuh jadi.
      const newProductStock = Number(workOrder.product.currentStock) + cQty;
      const biayaKonversi = sewCost + labCost + ovhCost;

      const completedWO = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: workOrder.productId },
        data: {
          currentStock: newProductStock,
          ...(updateProductHpp ? { standardCost: hppPerPcs } : {})
        }
      });

      await tx.stockMovement.create({
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
        await tx.stockMovement.create({
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

      const wo = await tx.workOrder.update({
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

      // Jurnal produksi: biaya bahan & biaya konversi berubah jadi nilai barang jadi.
      // Biaya konversi (jahit, upah, overhead) dikreditkan ke akun penampung
      // "Biaya Produksi Dibebankan", yang nanti meniadakan beban upah saat
      // pembayarannya dicatat di menu Pengeluaran — supaya tidak terhitung dua kali.
      await postJournal(tx, {
        date: new Date(),
        description: `Hasil produksi ${workOrder.woNumber}`,
        referenceType: 'WO',
        referenceId: workOrder.woNumber,
        lines: [
          { code: AKUN.PERSEDIAAN_JADI, debit: totalProductionCost },
          { code: AKUN.PERSEDIAAN_BAHAN, credit: matCost },
          { code: AKUN.BIAYA_PRODUKSI_DIBEBANKAN, credit: biayaKonversi }
        ]
      });

      return wo;
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
