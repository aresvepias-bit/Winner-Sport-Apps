const prisma = require('../api/db');

/**
 * Controller: Master Data Konveksi (Bahan, Produk, BOM, Kontak, Karyawan)
 */
const masterController = {
  // 1. KATEGORI & SATUAN
  async getCategories(req, res) {
    try {
      const { type } = req.query;
      const where = type ? { type } : {};
      const categories = await prisma.category.findMany({
        where,
        orderBy: { name: 'asc' }
      });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, type, description } = req.body;
      const category = await prisma.category.create({
        data: { name, type, description }
      });
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUnits(req, res) {
    try {
      const units = await prisma.unit.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createUnit(req, res) {
    try {
      const { name, symbol, ratioToPcs, description } = req.body;
      const unit = await prisma.unit.create({
        data: { name, symbol, ratioToPcs: ratioToPcs || 1, description }
      });
      res.status(201).json(unit);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 2. RAW MATERIALS (BAHAN BAKU KAIN & AKSESORIS)
  async getRawMaterials(req, res) {
    try {
      const materials = await prisma.rawMaterial.findMany({
        include: {
          category: true,
          unit: true
        },
        orderBy: { name: 'asc' }
      });
      res.json(materials);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createRawMaterial(req, res) {
    try {
      let { sku, name, categoryId, categoryName, unitId, unitSymbol, standardCost, currentStock, minimumStock, description } = req.body;

      if (!categoryId) {
        const cat = categoryName
          ? await prisma.category.findFirst({ where: { name: { contains: categoryName, mode: 'insensitive' } } })
          : await prisma.category.findFirst({ where: { type: 'RAW_MATERIAL' } });
        categoryId = cat ? cat.id : (await prisma.category.findFirst()).id;
      }

      if (!unitId) {
        const unit = unitSymbol
          ? await prisma.unit.findFirst({ where: { symbol: { equals: unitSymbol, mode: 'insensitive' } } })
          : await prisma.unit.findFirst({ where: { symbol: 'kg' } });
        unitId = unit ? unit.id : (await prisma.unit.findFirst()).id;
      }

      const material = await prisma.rawMaterial.create({
        data: {
          sku: sku || `MAT-${Date.now().toString().slice(-6)}`,
          name,
          categoryId,
          unitId,
          standardCost: Number(standardCost) || 0,
          currentStock: Number(currentStock) || 0,
          minimumStock: Number(minimumStock) || 0,
          description
        },
        include: { category: true, unit: true }
      });
      res.status(201).json(material);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateRawMaterial(req, res) {
    try {
      const { id } = req.params;
      const { name, categoryId, unitId, standardCost, minimumStock, description } = req.body;
      const material = await prisma.rawMaterial.update({
        where: { id },
        data: {
          name,
          ...(categoryId && { categoryId }),
          ...(unitId && { unitId }),
          standardCost: Number(standardCost) || 0,
          minimumStock: Number(minimumStock) || 0,
          description
        },
        include: { category: true, unit: true }
      });
      res.json(material);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteRawMaterial(req, res) {
    try {
      const { id } = req.params;
      const [bomUsage, woUsage, poUsage] = await Promise.all([
        prisma.bomItem.count({ where: { rawMaterialId: id } }),
        prisma.workOrderMaterial.count({ where: { rawMaterialId: id } }),
        prisma.purchaseOrderItem.count({ where: { rawMaterialId: id } })
      ]);

      if (bomUsage > 0 || woUsage > 0 || poUsage > 0) {
        return res.status(400).json({
          error: `Bahan baku tidak dapat dihapus karena telah terikat dalam ${bomUsage} BOM, ${woUsage} alokasi SPK, atau ${poUsage} faktur pembelian.`
        });
      }

      await prisma.stockMovement.deleteMany({ where: { rawMaterialId: id } });
      await prisma.rawMaterial.delete({ where: { id } });
      res.json({ success: true, message: 'Bahan baku berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 3. PRODUCTS (PAKAIAN JADI)
  async getProducts(req, res) {
    try {
      const products = await prisma.product.findMany({
        include: {
          category: true,
          unit: true,
          boms: {
            where: { isActive: true },
            include: {
              items: {
                include: { rawMaterial: { include: { unit: true } } }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createProduct(req, res) {
    try {
      let { sku, name, categoryId, unitId, standardCost, priceSatuan, priceGrosir, priceKodi, currentStock, minimumStock, description } = req.body;

      if (!categoryId) {
        const cat = await prisma.category.findFirst({ where: { type: 'FINISHED_GOOD' } });
        categoryId = cat ? cat.id : (await prisma.category.findFirst()).id;
      }

      if (!unitId) {
        const unit = await prisma.unit.findFirst({ where: { symbol: 'pcs' } });
        unitId = unit ? unit.id : (await prisma.unit.findFirst()).id;
      }

      const product = await prisma.product.create({
        data: {
          sku: sku || `PRD-${Date.now().toString().slice(-6)}`,
          name,
          categoryId,
          unitId,
          standardCost: Number(standardCost) || 0,
          priceSatuan: Number(priceSatuan) || 0,
          priceGrosir: Number(priceGrosir) || 0,
          priceKodi: Number(priceKodi) || 0,
          currentStock: Number(currentStock) || 0,
          minimumStock: Number(minimumStock) || 0,
          description
        },
        include: { category: true, unit: true }
      });
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, categoryId, unitId, standardCost, priceSatuan, priceGrosir, priceKodi, minimumStock, description } = req.body;
      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          ...(categoryId && { categoryId }),
          ...(unitId && { unitId }),
          standardCost: Number(standardCost) || 0,
          priceSatuan: Number(priceSatuan) || 0,
          priceGrosir: Number(priceGrosir) || 0,
          priceKodi: Number(priceKodi) || 0,
          minimumStock: Number(minimumStock) || 0,
          description
        },
        include: { category: true, unit: true }
      });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const [soUsage, woUsage] = await Promise.all([
        prisma.salesOrderItem.count({ where: { productId: id } }),
        prisma.workOrder.count({ where: { productId: id } })
      ]);

      if (soUsage > 0 || woUsage > 0) {
        return res.status(400).json({
          error: `Produk tidak dapat dihapus karena telah terikat pada ${soUsage} pesanan penjualan atau ${woUsage} SPK manufaktur.`
        });
      }

      await prisma.bom.deleteMany({ where: { productId: id } });
      await prisma.stockMovement.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });
      res.json({ success: true, message: 'Produk pakaian berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 4. BILL OF MATERIALS (BOM)
  async getBoms(req, res) {
    try {
      const boms = await prisma.bom.findMany({
        include: {
          product: true,
          items: {
            include: {
              rawMaterial: { include: { unit: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(boms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createBom(req, res) {
    try {
      const { productId, name, version, wastePercent, notes, items } = req.body;

      const bom = await prisma.bom.create({
        data: {
          productId,
          name,
          version: version || 'v1.0',
          wastePercent: Number(wastePercent) || 3.0,
          notes,
          items: {
            create: (items || []).map(item => ({
              rawMaterialId: item.rawMaterialId,
              quantityPerPcs: Number(item.quantityPerPcs),
              wasteAllowance: Number(item.wasteAllowance) || 0
            }))
          }
        },
        include: {
          product: true,
          items: { include: { rawMaterial: true } }
        }
      });

      res.status(201).json(bom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteBom(req, res) {
    try {
      const { id } = req.params;
      const woUsage = await prisma.workOrder.count({ where: { bomId: id } });
      if (woUsage > 0) {
        return res.status(400).json({
          error: `Formula BOM tidak dapat dihapus karena telah digunakan pada ${woUsage} SPK Produksi.`
        });
      }

      await prisma.bomItem.deleteMany({ where: { bomId: id } });
      await prisma.bom.delete({ where: { id } });
      res.json({ success: true, message: 'Formula BOM berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 5. KONTAK (SUPPLIER & CUSTOMER)
  async getContacts(req, res) {
    try {
      const { type } = req.query;
      const where = type ? { type } : {};
      const contacts = await prisma.contact.findMany({
        where,
        orderBy: { name: 'asc' }
      });
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createContact(req, res) {
    try {
      const { name, type, phone, email, address, companyName, paymentTerm, creditLimit, notes } = req.body;
      const contact = await prisma.contact.create({
        data: {
          name,
          type: type || 'CUSTOMER',
          phone,
          email,
          address,
          companyName,
          paymentTerm: Number(paymentTerm) || 0,
          creditLimit: Number(creditLimit) || 0,
          notes
        }
      });
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateContact(req, res) {
    try {
      const { id } = req.params;
      const { name, type, phone, email, address, companyName, paymentTerm, creditLimit, notes } = req.body;
      const contact = await prisma.contact.update({
        where: { id },
        data: {
          name,
          ...(type && { type }),
          phone,
          email,
          address,
          companyName,
          paymentTerm: Number(paymentTerm) || 0,
          creditLimit: Number(creditLimit) || 0,
          notes
        }
      });
      res.json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteContact(req, res) {
    try {
      const { id } = req.params;
      const [soUsage, poUsage] = await Promise.all([
        prisma.salesOrder.count({ where: { customerId: id } }),
        prisma.purchaseOrder.count({ where: { supplierId: id } })
      ]);

      if (soUsage > 0 || poUsage > 0) {
        return res.status(400).json({
          error: `Kontak rekanan tidak dapat dihapus karena memiliki riwayat ${soUsage} pesanan penjualan atau ${poUsage} PO pembelian.`
        });
      }

      await prisma.contact.delete({ where: { id } });
      res.json({ success: true, message: 'Kontak rekanan berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 6. KARYAWAN & TENAGA KERJA
  async getEmployees(req, res) {
    try {
      const employees = await prisma.employee.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createEmployee(req, res) {
    try {
      const { name, role, wageType, ratePerPcs, baseSalary, phone } = req.body;
      const employee = await prisma.employee.create({
        data: {
          name,
          role: role || 'Penjahit',
          wageType: wageType || 'BORONGAN',
          ratePerPcs: Number(ratePerPcs) || 0,
          baseSalary: Number(baseSalary) || 0,
          phone
        }
      });
      res.status(201).json(employee);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const { name, role, wageType, ratePerPcs, baseSalary, phone, isActive } = req.body;
      const employee = await prisma.employee.update({
        where: { id },
        data: {
          name,
          role,
          ...(wageType && { wageType }),
          ratePerPcs: Number(ratePerPcs) || 0,
          baseSalary: Number(baseSalary) || 0,
          phone,
          ...(isActive !== undefined && { isActive })
        }
      });
      res.json(employee);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      await prisma.employee.delete({ where: { id } });
      res.json({ success: true, message: 'Data karyawan/penjahit berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = masterController;
