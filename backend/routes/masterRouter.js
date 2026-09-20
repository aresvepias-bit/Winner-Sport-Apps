const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { verifyToken, checkRole } = require('../api/authMiddleware');

// Semua endpoint wajib login. Baca (GET) terbuka untuk semua role karena dipakai form modul lain
// (lookup produk, bahan, kontak). Tulis (POST/PUT/DELETE) hanya role master. Data karyawan dibatasi.
router.use(verifyToken);
router.use('/employees', checkRole('MASTER_EMPLOYEES'));
router.use((req, res, next) =>
  req.method === 'GET' ? next() : checkRole('MASTER_WRITE')(req, res, next)
);

// 1. Kategori & Satuan
router.get('/categories', masterController.getCategories);
router.post('/categories', masterController.createCategory);
router.get('/units', masterController.getUnits);
router.post('/units', masterController.createUnit);

// 2. Bahan Baku (Raw Materials)
router.get('/raw-materials', masterController.getRawMaterials);
router.post('/raw-materials', masterController.createRawMaterial);
router.put('/raw-materials/:id', masterController.updateRawMaterial);
router.delete('/raw-materials/:id', masterController.deleteRawMaterial);

// 3. Produk Jadi (Products)
router.get('/products', masterController.getProducts);
router.post('/products', masterController.createProduct);
router.put('/products/:id', masterController.updateProduct);
router.delete('/products/:id', masterController.deleteProduct);

// 4. Bill of Materials (BOM)
router.get('/boms', masterController.getBoms);
router.post('/boms', masterController.createBom);
router.delete('/boms/:id', masterController.deleteBom);

// 5. Kontak (Supplier & Customer)
router.get('/contacts', masterController.getContacts);
router.post('/contacts', masterController.createContact);
router.put('/contacts/:id', masterController.updateContact);
router.delete('/contacts/:id', masterController.deleteContact);

// 6. Karyawan & Penjahit
router.get('/employees', masterController.getEmployees);
router.post('/employees', masterController.createEmployee);
router.put('/employees/:id', masterController.updateEmployee);
router.delete('/employees/:id', masterController.deleteEmployee);

module.exports = router;
