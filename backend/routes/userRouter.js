const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const permissionController = require('../controllers/permissionController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Seluruh menu Pengguna & Hak Akses hanya untuk OWNER dan ADMIN.
// USER_ADMIN sengaja tidak bisa diubah dari UI (lihat api/rolePolicy.js).
router.use(verifyToken, checkRole('USER_ADMIN'));

// Matriks hak akses per role (harus sebelum /:id agar tidak tertangkap sebagai id)
router.get('/permissions', permissionController.getPermissions);
router.put('/permissions', permissionController.updatePermissions);

// Akun pengguna
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.post('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.deleteUser);

module.exports = router;
