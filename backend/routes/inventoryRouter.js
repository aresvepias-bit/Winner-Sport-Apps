const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Semua endpoint wajib login + role sesuai modul
router.use(verifyToken, checkRole('INVENTORY'));

// Endpoint Inventori Stok, Mutasi & Stock Opname
router.get('/summary', inventoryController.getSummary);
router.get('/movements', inventoryController.getMovements);
router.post('/movements/manual', inventoryController.createManualMovement);
router.get('/opname', inventoryController.getOpnames);
router.post('/opname', inventoryController.createOpname);
router.post('/opname/:id/apply', inventoryController.applyOpname);

module.exports = router;
