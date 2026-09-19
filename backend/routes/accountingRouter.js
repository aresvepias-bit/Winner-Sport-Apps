const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint Akuntansi, Kas & Bank, Pengeluaran, dan Laporan Laba Rugi
router.get('/accounts', accountingController.getAccounts);
router.post('/accounts', verifyToken, accountingController.createAccount);
router.get('/expenses', accountingController.getExpenses);
router.post('/expenses', verifyToken, accountingController.createExpense);
router.get('/cash-bank', accountingController.getCashBank);
router.get('/profit-and-loss', accountingController.getProfitAndLoss);

module.exports = router;
