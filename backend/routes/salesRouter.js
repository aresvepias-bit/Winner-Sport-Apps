const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken, checkRole } = require('../api/authMiddleware');
const policy = require('../api/rolePolicy');

// Semua endpoint wajib login + role sesuai modul
router.use(verifyToken, checkRole(policy.SALES));

// Endpoint Order Penjualan, Faktur & Pembayaran
router.get('/orders', salesController.getOrders);
router.get('/orders/:id', salesController.getOrderById);
router.post('/orders', salesController.createOrder);
router.post('/payments', salesController.createPayment);

module.exports = router;
