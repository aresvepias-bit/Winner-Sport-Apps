const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Semua endpoint wajib login + role sesuai modul
router.use(verifyToken, checkRole('PRODUCTION'));

// Endpoint SPK Produksi & Pengeluaran Bahan Baku
router.get('/work-orders', productionController.getWorkOrders);
router.get('/work-orders/:id', productionController.getWorkOrderById);
router.post('/work-orders', productionController.createWorkOrder);
router.post('/work-orders/:id/issue-materials', productionController.issueMaterials);
router.post('/work-orders/:id/complete', productionController.completeWorkOrder);

module.exports = router;
