const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../api/authMiddleware');

// Endpoint Autentikasi Pengguna
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getProfile);

module.exports = router;
