const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../api/authMiddleware');
const policy = require('../api/rolePolicy');

// Endpoint Statistik & KPI Dashboard Operasional
router.get('/stats', verifyToken, checkRole(policy.DASHBOARD), dashboardController.getStats);

module.exports = router;
