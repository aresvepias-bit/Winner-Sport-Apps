const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, checkRole } = require('../api/authMiddleware');
const policy = require('../api/rolePolicy');

// Semua endpoint wajib login + role sesuai modul
router.use(verifyToken, checkRole(policy.PURCHASING));

// Endpoint Purchase Order Supplier & Penerimaan Barang
router.get('/orders', purchaseController.getOrders);
router.post('/orders', purchaseController.createOrder);
router.post('/orders/:id/receive', purchaseController.receiveOrder);

module.exports = router;
