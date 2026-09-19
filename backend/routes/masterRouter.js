const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { verifyToken } = require('../api/authMiddleware');

// 1. Kategori & Satuan
router.get('/categories', masterController.getCategories);
router.post('/categories', verifyToken, masterController.createCategory);
router.get('/units', masterController.getUnits);
router.post('/units', verifyToken, masterController.createUnit);

// 2. Bahan Baku (Raw Materials)
router.get('/raw-materials', masterController.getRawMaterials);
router.post('/raw-materials', verifyToken, masterController.createRawMaterial);
router.put('/raw-materials/:id', verifyToken, masterController.updateRawMaterial);
router.delete('/raw-materials/:id', verifyToken, masterController.deleteRawMaterial);

// 3. Produk Jadi (Products)
router.get('/products', masterController.getProducts);
router.post('/products', verifyToken, masterController.createProduct);
router.put('/products/:id', verifyToken, masterController.updateProduct);
router.delete('/products/:id', verifyToken, masterController.deleteProduct);

// 4. Bill of Materials (BOM)
router.get('/boms', masterController.getBoms);
router.post('/boms', verifyToken, masterController.createBom);
router.delete('/boms/:id', verifyToken, masterController.deleteBom);

// 5. Kontak (Supplier & Customer)
router.get('/contacts', masterController.getContacts);
router.post('/contacts', verifyToken, masterController.createContact);
router.put('/contacts/:id', verifyToken, masterController.updateContact);
router.delete('/contacts/:id', verifyToken, masterController.deleteContact);

// 6. Karyawan & Penjahit
router.get('/employees', masterController.getEmployees);
router.post('/employees', verifyToken, masterController.createEmployee);
router.put('/employees/:id', verifyToken, masterController.updateEmployee);
router.delete('/employees/:id', verifyToken, masterController.deleteEmployee);

module.exports = router;
