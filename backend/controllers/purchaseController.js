const prisma = require('../api/db');

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
  async receiveOrder(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { items: true, supplier: true }
      });

      if (!po) return res.status(404).json({ error: 'PO tidak ditemukan.' });

      for (const item of items) {
        const qty = Number(item.receivedQty);
        if (qty <= 0) continue;

        const mat = await prisma.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
        if (!mat) continue;

        const newStock = Number(mat.currentStock) + qty;
        await prisma.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data: { currentStock: newStock }
        });

        await prisma.stockMovement.create({
          data: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: item.rawMaterialId,
            type: 'GOODS_RECEIPT',
            quantity: qty,
            balanceAfter: newStock,
            referenceType: 'PO',
            referenceId: po.poNumber,
            notes: `Penerimaan barang dari supplier ${po.supplier.name} (${po.poNumber})`
          }
        });

        const poItem = po.items.find(i => i.rawMaterialId === item.rawMaterialId);
        if (poItem) {
          await prisma.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: Number(poItem.receivedQty) + qty }
          });
        }
      }

      const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
        include: { items: { include: { rawMaterial: true } } }
      });

      res.json({ message: 'Bahan berhasil diterima dan stok telah bertambah.', purchaseOrder: updatedPO });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = purchaseController;
