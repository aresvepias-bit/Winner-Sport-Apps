const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Semua endpoint wajib login + role sesuai modul
router.use(verifyToken, checkRole('ACCOUNTING'));

// Endpoint Akuntansi, Kas & Bank, Pengeluaran, dan Laporan Laba Rugi
router.get('/accounts', accountingController.getAccounts);
router.post('/accounts', accountingController.createAccount);
router.get('/expenses', accountingController.getExpenses);
router.post('/expenses', accountingController.createExpense);
router.get('/cash-bank', accountingController.getCashBank);
router.get('/profit-and-loss', accountingController.getProfitAndLoss);

module.exports = router;
