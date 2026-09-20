const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Endpoint Statistik & KPI Dashboard Operasional
router.get('/stats', verifyToken, checkRole('DASHBOARD'), dashboardController.getStats);

module.exports = router;
