const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint Purchase Order Supplier & Penerimaan Barang
router.get('/orders', purchaseController.getOrders);
router.post('/orders', verifyToken, purchaseController.createOrder);
router.post('/orders/:id/receive', verifyToken, purchaseController.receiveOrder);

module.exports = router;
