const prisma = require('../api/db');
const { toPcs } = require('../api/unitConversion');

/**
 * Controller: Akuntansi, Kas & Bank, Biaya Operasional, dan Laba Rugi (P&L)
 */
const accountingController = {
  // GET /api/accounting/accounts (COA)
  async getAccounts(req, res) {
    try {
      const accounts = await prisma.account.findMany({
        orderBy: { code: 'asc' }
      });
      res.json(accounts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/accounting/accounts
  async createAccount(req, res) {
    try {
      const { code, name, type, balance, description } = req.body;
      const account = await prisma.account.create({
        data: {
          code,
          name,
          type,
          balance: Number(balance) || 0,
          description
        }
      });
      res.status(201).json(account);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/accounting/expenses
  async getExpenses(req, res) {
    try {
      const expenses = await prisma.expense.findMany({
        include: {
          category: true,
          account: true
        },
        orderBy: { date: 'desc' }
      });
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/accounting/expenses
  async createExpense(req, res) {
    try {
      const { categoryId, accountId, amount, recipient, notes, date } = req.body;
      const expAmount = Number(amount);

      if (!expAmount || expAmount <= 0) {
        return res.status(400).json({ error: 'Nominal pengeluaran harus lebih dari 0.' });
      }

      const expNumber = `EXP-${Date.now().toString().slice(-6)}`;

      const expense = await prisma.expense.create({
        data: {
          expenseNumber: expNumber,
          date: date ? new Date(date) : new Date(),
          categoryId,
          accountId,
          amount: expAmount,
          recipient,
          notes
        },
        include: { category: true, account: true }
      });

      if (accountId) {
        const acc = await prisma.account.findUnique({ where: { id: accountId } });
        if (acc) {
          await prisma.account.update({
            where: { id: accountId },
            data: { balance: Number(acc.balance) - expAmount }
          });
        }
      }

      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/accounting/cash-bank
  async getCashBank(req, res) {
    try {
      const accounts = await prisma.account.findMany({
        where: {
          OR: [
            { name: { contains: 'Kas', mode: 'insensitive' } },
            { name: { contains: 'Bank', mode: 'insensitive' } },
            { code: { startsWith: '10' } },
            { code: { startsWith: '11' } }
          ]
        },
        orderBy: { code: 'asc' }
      });

      const totalCash = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

      res.json({
        accounts,
        totalCash
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/accounting/profit-and-loss
  async getProfitAndLoss(req, res) {
    try {
      const salesOrders = await prisma.salesOrder.findMany({
        where: { status: { not: 'CANCELLED' } },
        include: {
          items: { include: { product: true } }
        }
      });

      const totalRevenue = salesOrders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

      let totalHpp = 0;
      for (const order of salesOrders) {
        for (const item of order.items) {
          const qtyPcs = await toPcs(item.quantity, item.unitName);
          const itemStandardCost = item.product ? Number(item.product.standardCost) : 0;
          totalHpp += (qtyPcs * itemStandardCost);
        }
      }

      const grossProfit = totalRevenue - totalHpp;

      const expenses = await prisma.expense.findMany({
        include: { category: true }
      });

      const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

      const expenseBreakdown = {};
      for (const exp of expenses) {
        const catName = exp.category ? exp.category.name : 'Operasional Umum';
        expenseBreakdown[catName] = (expenseBreakdown[catName] || 0) + Number(exp.amount);
      }

      const netProfit = grossProfit - totalExpenses;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      res.json({
        totalRevenue,
        totalHpp,
        grossProfit,
        grossProfitMargin: Number(grossProfitMargin.toFixed(2)),
        totalExpenses,
        expenseBreakdown,
        netProfit,
        netProfitMargin: Number(netProfitMargin.toFixed(2))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = accountingController;
