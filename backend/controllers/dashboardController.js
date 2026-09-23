const prisma = require('../api/db');
const { ratioToPcs } = require('../api/unitConversion');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const TREND_MONTHS = 6;

/** Kunci bulan "2026-09" untuk mengelompokkan data. */
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** Disetarakan ke pcs memakai rasio dari master Satuan, agar cocok dengan HPP per pcs. */
async function toPcs(item) {
  const qty = Number(item.quantity) || 0;
  return qty * (await ratioToPcs(item.unitName));
}

/**
 * Controller: Dashboard Operasional & Agregasi KPI.
 * Semua angka dihitung dari data sebenarnya — tidak ada nilai perkiraan/karangan.
 */
const dashboardController = {
  // GET /api/dashboard/stats
  async getStats(req, res) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Awal jendela tren: awal bulan, (TREND_MONTHS - 1) bulan ke belakang.
      const trendStart = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1), 1);

      // Semua pengambilan data dikirim sekaligus. Tidak ada yang bergantung pada
      // hasil yang lain, jadi menunggunya bergantian hanya menambah waktu tunggu
      // sebanyak jumlah kelompoknya — terasa sekali saat database jauh.
      const [
        allOrders, expenses, rawMaterials, products,
        cashAccounts, workOrders, unpaidInvoices, unpaidPOs
      ] = await Promise.all([
        prisma.salesOrder.findMany({
          where: { status: { not: 'CANCELLED' } },
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.expense.findMany(),
        prisma.rawMaterial.findMany(),
        prisma.product.findMany(),
        prisma.account.findMany({
          where: {
            OR: [
              { name: { contains: 'Kas', mode: 'insensitive' } },
              { name: { contains: 'Bank', mode: 'insensitive' } },
              { code: { startsWith: '10' } },
              { code: { startsWith: '11' } }
            ]
          },
          orderBy: { code: 'asc' }
        }),
        prisma.workOrder.findMany({ select: { status: true } }),
        prisma.invoice.findMany({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
        prisma.purchaseOrder.findMany({ where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } } })
      ]);

      // --- Kerangka bulan untuk tren (selalu 6 bulan, bulan kosong tetap tampil sebagai 0)
      const buckets = new Map();
      const trendOrder = [];
      for (let i = 0; i < TREND_MONTHS; i++) {
        const d = new Date(trendStart.getFullYear(), trendStart.getMonth() + i, 1);
        const key = monthKey(d);
        trendOrder.push(key);
        buckets.set(key, { month: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), revenue: 0, hpp: 0, expenses: 0, orderCount: 0 });
      }

      // --- Penjualan, HPP, dan produk terlaris
      let totalRevenue = 0;
      let totalHpp = 0;
      let todaySales = 0;
      let monthSales = 0;
      let itemsWithHpp = 0;
      let itemsTotal = 0;

      const productSales = new Map();

      for (const order of allOrders) {
        const created = new Date(order.createdAt);
        const orderTotal = Number(order.totalAmount);
        totalRevenue += orderTotal;
        if (created >= today) todaySales += orderTotal;
        if (created >= firstDayOfMonth) monthSales += orderTotal;

        const bucket = buckets.get(monthKey(created));
        if (bucket) {
          bucket.revenue += orderTotal;
          bucket.orderCount += 1;
        }

        for (const item of order.items) {
          itemsTotal += 1;
          const pcs = await toPcs(item);
          // Pesanan custom tanpa produk master tidak punya HPP standar — tidak dikarang.
          const cost = item.product ? Number(item.product.standardCost) : 0;
          if (item.product) itemsWithHpp += 1;

          const itemHpp = pcs * cost;
          totalHpp += itemHpp;
          if (bucket) bucket.hpp += itemHpp;

          const nama = item.product?.name || item.customDescription || 'Pesanan Custom';
          const agg = productSales.get(nama) || { name: nama, revenue: 0, qtyPcs: 0 };
          agg.revenue += Number(item.subtotal ?? pcs * Number(item.pricePerUnit || 0));
          agg.qtyPcs += pcs;
          productSales.set(nama, agg);
        }
      }

      // --- Beban operasional
      let totalExpenses = 0;
      for (const e of expenses) {
        const amount = Number(e.amount);
        totalExpenses += amount;
        const bucket = buckets.get(monthKey(new Date(e.date)));
        if (bucket) bucket.expenses += amount;
      }

      const grossProfit = totalRevenue - totalHpp;
      const netProfit = grossProfit - totalExpenses;

      // --- Persediaan
      const rawMaterialValue = rawMaterials.reduce((acc, m) => acc + Number(m.currentStock) * Number(m.standardCost), 0);
      const productValue = products.reduce((acc, p) => acc + Number(p.currentStock) * Number(p.standardCost), 0);

      // --- Kas & bank
      const cashPosition = cashAccounts.reduce((acc, a) => acc + Number(a.balance), 0);

      // --- Produksi
      const productionByStatus = {};
      for (const wo of workOrders) productionByStatus[wo.status] = (productionByStatus[wo.status] || 0) + 1;
      const activeStatuses = ['DRAFT', 'PENDING_MATERIAL', 'IN_PROGRESS'];
      const activeCount = activeStatuses.reduce((acc, s) => acc + (productionByStatus[s] || 0), 0);

      // --- Piutang & hutang
      const totalReceivable = unpaidInvoices.reduce((acc, i) => acc + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
      const totalPayable = unpaidPOs.reduce((acc, po) => acc + (Number(po.totalAmount) - Number(po.paidAmount)), 0);

      const trendData = trendOrder.map((key) => {
        const b = buckets.get(key);
        return { ...b, netProfit: b.revenue - b.hpp - b.expenses };
      });

      const topProducts = [...productSales.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      res.json({
        sales: { today: todaySales, thisMonth: monthSales, total: totalRevenue, orderCount: allOrders.length },
        profitability: {
          grossProfit,
          netProfit,
          totalHpp,
          totalExpenses,
          margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0
        },
        inventory: {
          rawMaterialValue,
          productValue,
          totalValue: rawMaterialValue + productValue,
          lowStockAlertCount: rawMaterials.filter((m) => Number(m.currentStock) <= Number(m.minimumStock)).length
        },
        production: {
          activeCount,
          completedCount: productionByStatus.COMPLETED || 0,
          byStatus: productionByStatus
        },
        cash: {
          position: cashPosition,
          accounts: cashAccounts.map((a) => ({ code: a.code, name: a.name, balance: Number(a.balance) }))
        },
        debts: { receivable: totalReceivable, payable: totalPayable },
        trendData,
        topProducts,
        // Dipakai UI untuk memberi tahu bila HPP belum lengkap, alih-alih diam-diam melebihkan laba.
        coverage: { itemsTotal, itemsWithHpp }
      });
    } catch (err) {
      console.error('[dashboardController getStats error]:', err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = dashboardController;
