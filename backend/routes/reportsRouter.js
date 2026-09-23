const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Laporan keuangan mengikuti hak akses modul Akuntansi.
router.use(verifyToken, checkRole('ACCOUNTING'));

router.get('/profit-loss', reportController.profitLoss);
router.get('/cash-flow', reportController.cashFlow);
router.get('/series', reportController.series);

module.exports = router;
