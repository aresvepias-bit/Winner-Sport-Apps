const prisma = require('../api/db');
const { toPcs } = require('../api/unitConversion');

/**
 * Controller: Penjualan & Distribusi Pakaian (Kodi, Grosir, Custom)
 */
const salesController = {
  // GET /api/sales/orders
  async getOrders(req, res) {
    try {
      const { status, orderType } = req.query;
      const where = {};
      if (status) where.status = status;
      if (orderType) where.orderType = orderType;

      const orders = await prisma.salesOrder.findMany({
        where,
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true } },
          items: {
            include: { product: true }
          },
          invoices: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/sales/orders/:id
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await prisma.salesOrder.findUnique({
        where: { id },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true } },
          items: { include: { product: { include: { unit: true } } } },
          invoices: { include: { payments: true } }
        }
      });

      if (!order) return res.status(404).json({ error: 'Order tidak ditemukan.' });
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/sales/orders
  async createOrder(req, res) {
    try {
      const { customerId, orderType, dueDate, discount, tax, notes, items } = req.body;

      if (!customerId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer dan item penjualan wajib diisi.' });
      }

      const soNumber = `SO-${Date.now().toString().slice(-6)}`;
      const invNumber = `INV-${Date.now().toString().slice(-6)}`;

      let subtotal = 0;

      const itemsData = items.map(item => {
        const qty = parseInt(item.quantity);
        const price = Number(item.pricePerUnit);
        const lineSubtotal = qty * price;
        subtotal += lineSubtotal;

        return {
          productId: item.productId || null,
          customDescription: item.customDescription || null,
          quantity: qty,
          unitName: item.unitName || 'pcs',
          pricePerUnit: price,
          subtotal: lineSubtotal
        };
      });

      const disc = Number(discount) || 0;
      const tx = Number(tax) || 0;
      const totalAmount = subtotal - disc + tx;

      const salesOrder = await prisma.salesOrder.create({
        data: {
          soNumber,
          customerId,
          orderType: orderType || 'SATUAN',
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'CONFIRMED',
          paymentStatus: 'UNPAID',
          subtotal,
          discount: disc,
          tax: tx,
          totalAmount,
          paidAmount: 0,
          notes,
          createdById: req.user.id,
          items: { create: itemsData },
          invoices: {
            create: {
              invoiceNumber: invNumber,
              customerId,
              dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              totalAmount,
              paidAmount: 0,
              status: 'UNPAID',
              notes: `Faktur untuk ${soNumber}`
            }
          }
        },
        include: {
          customer: true,
          items: { include: { product: true } },
          invoices: true
        }
      });

      // Kurangi stok jika produk terdaftar di master
      for (const item of items) {
        if (item.productId) {
          // Rasio satuan diambil dari master Satuan (kodi 20, lusin 12, dst).
          const totalPcsDeducted = Math.round(await toPcs(item.quantity, item.unitName));

          const prod = await prisma.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = Math.max(0, Number(prod.currentStock) - totalPcsDeducted);
            await prisma.product.update({
              where: { id: item.productId },
              data: { currentStock: newStock }
            });

            await prisma.stockMovement.create({
              data: {
                itemType: 'PRODUCT',
                productId: item.productId,
                type: 'SALES_ISSUE',
                quantity: -totalPcsDeducted,
                balanceAfter: newStock,
                referenceType: 'SO',
                referenceId: soNumber,
                notes: `Penjualan ${soNumber} (${item.quantity} ${item.unitName || 'pcs'})`
              }
            });
          }
        }
      }

      res.status(201).json(salesOrder);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/sales/payments
  async createPayment(req, res) {
    try {
      const { invoiceId, salesOrderId, amount, method, accountId, referenceNumber, notes } = req.body;
      const payAmount = Number(amount);

      if (!invoiceId || payAmount <= 0) {
        return res.status(400).json({ error: 'Invoice dan nominal pembayaran wajib diisi.' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { salesOrder: true }
      });

      if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan.' });

      const newPaidAmount = Number(invoice.paidAmount) + payAmount;
      const isFull = newPaidAmount >= Number(invoice.totalAmount);
      const newStatus = isFull ? 'PAID' : 'PARTIAL';

      const payNumber = `PAY-${Date.now().toString().slice(-6)}`;

      const payment = await prisma.payment.create({
        data: {
          paymentNumber: payNumber,
          type: 'INCOME',
          method: method || 'BANK_TRANSFER',
          amount: payAmount,
          accountId: accountId || null,
          invoiceId,
          referenceNumber,
          notes
        }
      });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });

      if (invoice.salesOrderId) {
        await prisma.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus: newStatus
          }
        });
      }

      if (accountId) {
        const acc = await prisma.account.findUnique({ where: { id: accountId } });
        if (acc) {
          await prisma.account.update({
            where: { id: accountId },
            data: { balance: Number(acc.balance) + payAmount }
          });
        }
      }

      res.status(201).json({
        message: 'Pembayaran berhasil dicatat.',
        payment,
        invoiceStatus: newStatus
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = salesController;
