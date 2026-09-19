const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint Inventori Stok, Mutasi & Stock Opname
router.get('/summary', inventoryController.getSummary);
router.get('/movements', inventoryController.getMovements);
router.post('/movements/manual', verifyToken, inventoryController.createManualMovement);
router.get('/opname', inventoryController.getOpnames);
router.post('/opname', verifyToken, inventoryController.createOpname);
router.post('/opname/:id/apply', verifyToken, inventoryController.applyOpname);

module.exports = router;
