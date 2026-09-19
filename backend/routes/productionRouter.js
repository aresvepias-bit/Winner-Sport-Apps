const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint SPK Produksi & Pengeluaran Bahan Baku
router.get('/work-orders', productionController.getWorkOrders);
router.get('/work-orders/:id', productionController.getWorkOrderById);
router.post('/work-orders', verifyToken, productionController.createWorkOrder);
router.post('/work-orders/:id/issue-materials', verifyToken, productionController.issueMaterials);
router.post('/work-orders/:id/complete', verifyToken, productionController.completeWorkOrder);

module.exports = router;
