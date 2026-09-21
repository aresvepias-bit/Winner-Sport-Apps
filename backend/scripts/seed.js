require('dotenv').config({ path: __dirname + '/../.env' });
const passwordHash = require('../api/passwordHash');
const prisma = require('../api/db');

async function main() {
  console.log('🚀 Memulai Seeding Data Awal Winner Sport Konveksi...');

  // 1. Buat Pengguna Default (Owner & Admin)
  // Tidak ada password tetap di repo: pakai SEED_PASSWORD, atau buat acak dan tampilkan sekali.
  const seedPassword = process.env.SEED_PASSWORD || require('crypto').randomBytes(9).toString('base64url');
  const generated = !process.env.SEED_PASSWORD;
  const hashedPassword = await passwordHash.hash(seedPassword);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@winnersport.com' },
    update: {},
    create: {
      name: 'Aris Setiyono (Owner)',
      email: 'owner@winnersport.com',
      password: hashedPassword,
      role: 'OWNER',
      phone: '081234567890'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@winnersport.com' },
    update: {},
    create: {
      name: 'Staff Admin Operasional',
      email: 'admin@winnersport.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '081234567891'
    }
  });

  console.log('✅ User default: owner@winnersport.com / admin@winnersport.com');
  console.log('   (user yang sudah ada tidak diubah passwordnya; gunakan scripts/set-password.js untuk mengganti)');
  if (generated) console.log(`   Password awal untuk user BARU (catat, hanya tampil sekali): ${seedPassword}`);

  // 2. Satuan Ukuran Konveksi
  const unitsData = [
    { name: 'Pcs', symbol: 'pcs', ratioToPcs: 1, description: 'Satuan unit tunggal' },
    { name: 'Kodi', symbol: 'kodi', ratioToPcs: 20, description: '1 Kodi = 20 pcs' },
    { name: 'Lusin', symbol: 'lsn', ratioToPcs: 12, description: '1 Lusin = 12 pcs' },
    { name: 'Kilogram', symbol: 'kg', ratioToPcs: 1, description: 'Satuan berat kain' },
    { name: 'Meter', symbol: 'm', ratioToPcs: 1, description: 'Satuan panjang kain/tali' },
    { name: 'Roll', symbol: 'roll', ratioToPcs: 1, description: 'Gulungan kain utuh' }
  ];

  const units = {};
  for (const u of unitsData) {
    units[u.name] = await prisma.unit.upsert({
      where: { name: u.name },
      update: {},
      create: u
    });
  }
  console.log('✅ Satuan ukuran konveksi (Pcs, Kodi, Lusin, Kg, Meter, Roll) siap.');

  // 3. Kategori
  const categoriesData = [
    { name: 'Kain & Tekstil', type: 'RAW_MATERIAL', description: 'Bahan baku utama garmen' },
    { name: 'Aksesoris & Benang', type: 'RAW_MATERIAL', description: 'Kancing, zipper, benang, label' },
    { name: 'Packaging & Kemasan', type: 'RAW_MATERIAL', description: 'Plastik opp, hangtag, polymailer' },
    { name: 'Kaos & Jersey Olahraga', type: 'FINISHED_GOOD', description: 'Produk pakaian olahraga' },
    { name: 'Jaket & Outerwear', type: 'FINISHED_GOOD', description: 'Hoodie, jaket parasut, varsity' },
    { name: 'Celana & Training', type: 'FINISHED_GOOD', description: 'Celana olahraga pendek dan panjang' },
    { name: 'Operasional Pabrik', type: 'EXPENSE', description: 'Biaya utilitas workshop dan gudang' },
    { name: 'Upah Jahit & Borongan', type: 'EXPENSE', description: 'Biaya tenaga kerja langsung' }
  ];

  const categories = {};
  for (const c of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { name: c.name } });
    if (!existing) {
      categories[c.name] = await prisma.category.create({ data: c });
    } else {
      categories[c.name] = existing;
    }
  }
  console.log('✅ Kategori master data berhasil dibuat.');

  // 4. Chart of Accounts (COA)
  const coaData = [
    { code: '1001', name: 'Kas Utama Tunai', type: 'ASSET', balance: 5000000 },
    { code: '1002', name: 'Bank BCA Operasional', type: 'ASSET', balance: 25000000 },
    { code: '1101', name: 'Piutang Usaha Pelanggan', type: 'ASSET', balance: 0 },
    { code: '1201', name: 'Persediaan Bahan Baku', type: 'ASSET', balance: 0 },
    { code: '1202', name: 'Persediaan Barang Jadi', type: 'ASSET', balance: 0 },
    { code: '2001', name: 'Hutang Usaha Supplier', type: 'LIABILITY', balance: 0 },
    { code: '3001', name: 'Modal Usaha Pemilik', type: 'EQUITY', balance: 30000000 },
    { code: '4001', name: 'Pendapatan Penjualan Konveksi', type: 'REVENUE', balance: 0 },
    { code: '5001', name: 'HPP Produksi Konveksi', type: 'COGS', balance: 0 },
    { code: '6001', name: 'Beban Upah & Tenaga Kerja', type: 'EXPENSE', balance: 0 },
    { code: '6002', name: 'Beban Listrik & Utilitas', type: 'EXPENSE', balance: 0 }
  ];

  for (const acc of coaData) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: acc
    });
  }
  console.log('✅ Chart of Accounts (COA) siap.');

  // 5. Bahan Baku Contoh
  const rawMaterialsData = [
    {
      sku: 'MAT-DRY-MILANO',
      name: 'Kain Dryfit Milano (Polyester)',
      categoryId: categories['Kain & Tekstil'].id,
      unitId: units['Kilogram'].id,
      standardCost: 85000,
      currentStock: 150, // 150 kg
      minimumStock: 25,
      description: 'Bahan jersey bola/futsal anti-bakteri cepat kering'
    },
    {
      sku: 'MAT-COMBED-30S',
      name: 'Kain Cotton Combed 30s Reaktif (Hitam)',
      categoryId: categories['Kain & Tekstil'].id,
      unitId: units['Kilogram'].id,
      standardCost: 110000,
      currentStock: 200, // 200 kg
      minimumStock: 30,
      description: 'Bahan kaos distro premium halus & dingin'
    },
    {
      sku: 'MAT-LABEL-WOVEN',
      name: 'Label Woven Damask Winner Sport',
      categoryId: categories['Aksesoris & Benang'].id,
      unitId: units['Pcs'].id,
      standardCost: 350,
      currentStock: 5000,
      minimumStock: 500,
      description: 'Label leher woven logo Winner Sport'
    },
    {
      sku: 'MAT-PLASTIK-OPP',
      name: 'Plastik Packaging OPP Sablon Seal (30x40)',
      categoryId: categories['Packaging & Kemasan'].id,
      unitId: units['Pcs'].id,
      standardCost: 250,
      currentStock: 4000,
      minimumStock: 400,
      description: 'Kemasan satuan dengan seal perekat'
    }
  ];

  const rawMaterials = {};
  for (const m of rawMaterialsData) {
    rawMaterials[m.sku] = await prisma.rawMaterial.upsert({
      where: { sku: m.sku },
      update: {},
      create: m
    });
  }
  console.log('✅ Bahan baku contoh berhasil dibuat.');

  // 6. Produk Jadi Contoh
  const productsData = [
    {
      sku: 'PRD-JRS-FUTSAL-01',
      name: 'Jersey Futsal Winner Dryfit (Custom)',
      categoryId: categories['Kaos & Jersey Olahraga'].id,
      unitId: units['Pcs'].id,
      standardCost: 32500, // HPP kalkulasi bahan + jahit + sablon
      priceSatuan: 75000,
      priceGrosir: 65000,
      priceKodi: 1200000, // 60.000 / pcs jika per kodi
      currentStock: 80,
      minimumStock: 20,
      description: 'Jersey olahraga custom full printing tim futsal'
    },
    {
      sku: 'PRD-KAOS-COMBED-BLK',
      name: 'Kaos Polos Cotton Combed 30s Hitam',
      categoryId: categories['Kaos & Jersey Olahraga'].id,
      unitId: units['Pcs'].id,
      standardCost: 36000,
      priceSatuan: 55000,
      priceGrosir: 45000,
      priceKodi: 800000, // 40.000 / pcs jika per kodi
      currentStock: 120,
      minimumStock: 30,
      description: 'Kaos polos regular fit standar distro'
    }
  ];

  const products = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    });
  }
  console.log('✅ Produk jadi contoh berhasil dibuat.');

  // 7. Bill of Materials (BOM Resep)
  const bomJersey = await prisma.bom.create({
    data: {
      productId: products['PRD-JRS-FUTSAL-01'].id,
      name: 'BOM Standar Jersey Futsal Dewasa',
      version: 'v1.0',
      wastePercent: 3.0,
      notes: 'Estimasi 1 kg kain dryfit menghasilkan 4 pcs jersey',
      items: {
        create: [
          {
            rawMaterialId: rawMaterials['MAT-DRY-MILANO'].id,
            quantityPerPcs: 0.25, // 0.25 kg per jersey
            wasteAllowance: 0.008
          },
          {
            rawMaterialId: rawMaterials['MAT-LABEL-WOVEN'].id,
            quantityPerPcs: 1.0,
            wasteAllowance: 0
          },
          {
            rawMaterialId: rawMaterials['MAT-PLASTIK-OPP'].id,
            quantityPerPcs: 1.0,
            wasteAllowance: 0
          }
        ]
      }
    }
  });

  const bomKaos = await prisma.bom.create({
    data: {
      productId: products['PRD-KAOS-COMBED-BLK'].id,
      name: 'BOM Standar Kaos Distro Combed 30s',
      version: 'v1.0',
      wastePercent: 4.0,
      notes: 'Estimasi 1 kg kain combed menghasilkan 3.5 pcs kaos',
      items: {
        create: [
          {
            rawMaterialId: rawMaterials['MAT-COMBED-30S'].id,
            quantityPerPcs: 0.285,
            wasteAllowance: 0.012
          },
          {
            rawMaterialId: rawMaterials['MAT-LABEL-WOVEN'].id,
            quantityPerPcs: 1.0,
            wasteAllowance: 0
          },
          {
            rawMaterialId: rawMaterials['MAT-PLASTIK-OPP'].id,
            quantityPerPcs: 1.0,
            wasteAllowance: 0
          }
        ]
      }
    }
  });

  console.log('✅ Bill of Materials (BOM) otomatis terhubung ke produk.');

  // 8. Kontak (Supplier & Customer)
  await prisma.contact.createMany({
    data: [
      {
        name: 'CV Multi Tekstil Bandung',
        type: 'SUPPLIER',
        phone: '081298765432',
        email: 'sales@multitekstil.com',
        companyName: 'CV Multi Tekstil',
        paymentTerm: 30
      },
      {
        name: 'FC Juara Futsal Club',
        type: 'CUSTOMER',
        phone: '085712345678',
        address: 'Komplek Olahraga Senayan, Jakarta',
        paymentTerm: 14
      },
      {
        name: 'Toko Sport Jaya Abadi (Grosir)',
        type: 'CUSTOMER',
        phone: '081399887766',
        address: 'Pasar Tanah Abang Blok A',
        paymentTerm: 30,
        creditLimit: 50000000
      }
    ]
  });

  // 9. Karyawan / Operator Konveksi
  await prisma.employee.createMany({
    data: [
      {
        name: 'Pak Sugeng (Kepala Tukang Jahit)',
        role: 'Penjahit',
        wageType: 'BORONGAN',
        ratePerPcs: 6500, // Rp 6.500 per pcs jahit jersey/kaos
        phone: '081801234567'
      },
      {
        name: 'Mas Joko (Cutting & Pola)',
        role: 'Pemotong',
        wageType: 'HARIAN',
        baseSalary: 125000, // Rp 125.000 / hari
        phone: '081801234568'
      }
    ]
  });

  console.log('✨ SEEDING DATA AWAL SELESAI DENGAN SUKSES!');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
