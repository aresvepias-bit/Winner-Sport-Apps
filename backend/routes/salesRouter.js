const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint Order Penjualan, Faktur & Pembayaran
router.get('/orders', salesController.getOrders);
router.get('/orders/:id', salesController.getOrderById);
router.post('/orders', verifyToken, salesController.createOrder);
router.post('/payments', verifyToken, salesController.createPayment);

module.exports = router;
