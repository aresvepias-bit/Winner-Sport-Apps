const prisma = require('../api/db');
const { postJournal, AKUN } = require('../api/journal');

/**
 * Controller: Purchasing & Pengadaan Bahan Baku Supplier
 */
const purchaseController = {
  // GET /api/purchasing/orders
  async getOrders(req, res) {
    try {
      const orders = await prisma.purchaseOrder.findMany({
        include: {
          supplier: true,
          createdBy: { select: { id: true, name: true } },
          items: {
            include: { rawMaterial: { include: { unit: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/purchasing/orders
  async createOrder(req, res) {
    try {
      const { supplierId, expectedDate, notes, items } = req.body;

      if (!supplierId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Supplier dan daftar bahan wajib diisi.' });
      }

      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      let totalAmount = 0;

      const itemsData = items.map(item => {
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const lineSubtotal = qty * price;
        totalAmount += lineSubtotal;

        return {
          rawMaterialId: item.rawMaterialId,
          quantity: qty,
          unitPrice: price,
          subtotal: lineSubtotal,
          receivedQty: 0
        };
      });

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          status: 'ORDERED',
          totalAmount,
          paidAmount: 0,
          notes,
          createdById: req.user.id,
          items: { create: itemsData }
        },
        include: {
          supplier: true,
          items: { include: { rawMaterial: true } }
        }
      });

      res.status(201).json(purchaseOrder);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/purchasing/orders/:id/receive
  /**
   * Penerimaan barang dari supplier.
   *
   * Sebelumnya: PO langsung ditandai RECEIVED walau baru diterima sebagian,
   * kelebihan kiriman tidak ditolak, tidak ada transaksi, dan tidak ada jurnal —
   * padahal produksi mengkredit akun Persediaan Bahan Baku, sehingga tanpa
   * lawan debitnya saldo akun itu terus minus.
   */
  async receiveOrder(req, res) {
    try {
      const { id } = req.params;
      const { items, notes } = req.body || {};

      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { items: { include: { rawMaterial: true } }, supplier: true }
      });
      if (!po) return res.status(404).json({ error: 'PO tidak ditemukan.' });
      if (po.status === 'CANCELLED') return res.status(400).json({ error: 'PO sudah dibatalkan.' });
      if (po.status === 'RECEIVED') return res.status(400).json({ error: 'PO ini sudah diterima seluruhnya.' });

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Tidak ada barang yang diterima.' });
      }

      // Validasi dulu seluruh baris sebelum ada satu pun perubahan disimpan.
      const rencana = [];
      const sudahDipakai = new Set();
      for (const baris of items) {
        const qty = Number(baris.receivedQty);
        if (!Number.isFinite(qty) || qty <= 0) continue; // baris kosong dilewati

        const poItem = po.items.find((i) => i.id === baris.itemId || i.rawMaterialId === baris.rawMaterialId);
        if (!poItem) return res.status(400).json({ error: 'Ada barang yang bukan bagian dari PO ini.' });
        if (sudahDipakai.has(poItem.id)) return res.status(400).json({ error: 'Barang yang sama dikirim lebih dari sekali.' });
        sudahDipakai.add(poItem.id);

        const sisa = Number(poItem.quantity) - Number(poItem.receivedQty);
        if (qty > sisa + 0.001) {
          return res.status(400).json({
            error: `Jumlah terima ${poItem.rawMaterial.name} melebihi sisa pesanan (sisa ${sisa}).`
          });
        }
        rencana.push({ poItem, qty });
      }

      if (rencana.length === 0) {
        return res.status(400).json({ error: 'Isi jumlah yang diterima minimal pada satu barang.' });
      }

      const hasil = await prisma.$transaction(async (tx) => {
        let nilaiDiterima = 0;

        for (const { poItem, qty } of rencana) {
          const mat = await tx.rawMaterial.findUnique({ where: { id: poItem.rawMaterialId } });
          if (!mat) throw Object.assign(new Error('Bahan baku tidak ditemukan.'), { status: 404 });

          const saldoBaru = Number(mat.currentStock) + qty;
          await tx.rawMaterial.update({ where: { id: mat.id }, data: { currentStock: saldoBaru } });

          await tx.stockMovement.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: mat.id,
              type: 'GOODS_RECEIPT',
              quantity: qty,
              balanceAfter: saldoBaru,
              referenceType: 'PO',
              referenceId: po.poNumber,
              notes: notes || `Penerimaan dari ${po.supplier.name} (${po.poNumber})`
            }
          });

          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: Number(poItem.receivedQty) + qty }
          });

          nilaiDiterima += qty * Number(poItem.unitPrice);
        }

        // Status ditentukan dari kenyataan, bukan diasumsikan selesai.
        const setelah = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
        const lengkap = setelah.every((i) => Number(i.receivedQty) >= Number(i.quantity) - 0.001);

        // Barang masuk menambah persediaan dan menimbulkan hutang ke supplier.
        await postJournal(tx, {
          date: new Date(),
          description: `Penerimaan bahan ${po.poNumber}`,
          referenceType: 'PO',
          referenceId: po.poNumber,
          lines: [
            { code: AKUN.PERSEDIAAN_BAHAN, debit: nilaiDiterima },
            { code: AKUN.HUTANG_SUPPLIER, credit: nilaiDiterima }
          ]
        });

        return tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: lengkap ? 'RECEIVED' : 'PARTIAL' },
          include: { supplier: true, items: { include: { rawMaterial: true } } }
        });
      });

      res.json({
        message: hasil.status === 'RECEIVED'
          ? 'Seluruh barang PO telah diterima dan stok bertambah.'
          : 'Penerimaan sebagian tercatat. PO masih terbuka untuk sisa kiriman.',
        purchaseOrder: hasil
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
};

module.exports = purchaseController;
