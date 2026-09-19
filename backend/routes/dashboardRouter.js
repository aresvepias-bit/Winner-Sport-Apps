const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Endpoint Statistik & KPI Dashboard Operasional
router.get('/stats', dashboardController.getStats);

module.exports = router;
