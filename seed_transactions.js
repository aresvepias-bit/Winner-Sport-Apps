const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });
const prisma = require('./backend/api/db');

async function seedData() {
  console.log('Seeding operational transactions to Supabase PostgreSQL...');

  const owner = await prisma.user.findFirst({ where: { email: 'owner@winnersport.com' } });
  if (!owner) {
    console.error('Owner user not found!');
    return;
  }

  // 1. Ensure Contacts (Customer & Supplier)
  let customer1 = await prisma.contact.findFirst({ where: { name: 'FC Juara Futsal' } });
  if (!customer1) {
    customer1 = await prisma.contact.create({
      data: {
        name: 'FC Juara Futsal',
        type: 'CUSTOMER',
        phone: '0812-9988-7766',
        address: 'Gedung Olahraga Futsal Kemang, Jakarta Selatan',
        companyName: 'FC Juara Jakarta',
        paymentTerm: 14
      }
    });
  }

  let customer2 = await prisma.contact.findFirst({ where: { name: 'Toko Sport Jaya Abadi' } });
  if (!customer2) {
    customer2 = await prisma.contact.create({
      data: {
        name: 'Toko Sport Jaya Abadi',
        type: 'CUSTOMER',
        phone: '0813-1122-3344',
        address: 'Pasar Grosir Tanah Abang Blok A No. 12',
        companyName: 'Toko Jaya Abadi',
        paymentTerm: 30
      }
    });
  }

  let customer3 = await prisma.contact.findFirst({ where: { name: 'Event Fun Run Jakarta' } });
  if (!customer3) {
    customer3 = await prisma.contact.create({
      data: {
        name: 'Event Fun Run Jakarta',
        type: 'CUSTOMER',
        phone: '0811-3344-5566',
        address: 'Kompleks Gelora Bung Karno Senayan',
        companyName: 'PT Inspira Kreasi Mandiri',
        paymentTerm: 7
      }
    });
  }

  // 2. Products
  const products = await prisma.product.findMany();
  const jerseyProd = products.find(p => p.sku === 'PROD-JERSEY-01') || products[0];
  const kaosProd = products.find(p => p.sku === 'PROD-TSHIRT-01') || products[1] || products[0];

  // 3. Create Sales Orders if 0
  const orderCount = await prisma.salesOrder.count();
  if (orderCount === 0) {
    console.log('Creating initial sales orders...');

    // SO 1: FC Juara Futsal (Custom)
    const so1 = await prisma.salesOrder.create({
      data: {
        soNumber: 'SO-2026-0012',
        customerId: customer1.id,
        orderType: 'CUSTOM_ORDER',
        status: 'CONFIRMED',
        paymentStatus: 'PARTIAL',
        subtotal: 3750000,
        totalAmount: 3750000,
        paidAmount: 2000000,
        notes: 'Jersey Futsal Full Print Custom 50 pcs (FC Juara)',
        createdById: owner.id,
        items: {
          create: [
            {
              productId: jerseyProd ? jerseyProd.id : null,
              customDescription: 'Jersey Futsal Winner Dryfit Custom Full Print (50 pcs)',
              quantity: 50,
              unitName: 'pcs',
              pricePerUnit: 75000,
              subtotal: 3750000
            }
          ]
        },
        invoices: {
          create: {
            invoiceNumber: 'INV-2026-0012',
            customerId: customer1.id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            totalAmount: 3750000,
            paidAmount: 2000000,
            status: 'PARTIAL',
            notes: 'Faktur Uang Muka SO-2026-0012'
          }
        }
      }
    });

    // SO 2: Toko Sport Jaya Abadi (Kodian)
    const so2 = await prisma.salesOrder.create({
      data: {
        soNumber: 'SO-2026-0011',
        customerId: customer2.id,
        orderType: 'KODIAN',
        status: 'IN_PRODUCTION',
        paymentStatus: 'PAID',
        subtotal: 6000000,
        totalAmount: 6000000,
        paidAmount: 6000000,
        notes: 'Order 5 Kodi Jersey Futsal Toko Jaya Abadi',
        createdById: owner.id,
        items: {
          create: [
            {
              productId: jerseyProd ? jerseyProd.id : null,
              customDescription: 'Jersey Futsal Winner Dryfit (5 Kodi / 100 Pcs)',
              quantity: 5,
              unitName: 'kodi',
              pricePerUnit: 1200000,
              subtotal: 6000000
            }
          ]
        },
        invoices: {
          create: {
            invoiceNumber: 'INV-2026-0011',
            customerId: customer2.id,
            dueDate: new Date(),
            totalAmount: 6000000,
            paidAmount: 6000000,
            status: 'PAID',
            notes: 'Lunas Transfer BCA'
          }
        }
      }
    });

    // SO 3: Event Fun Run (Project)
    const so3 = await prisma.salesOrder.create({
      data: {
        soNumber: 'SO-2026-0010',
        customerId: customer3.id,
        orderType: 'PROJECT',
        status: 'READY_TO_SHIP',
        paymentStatus: 'PAID',
        subtotal: 18500000,
        totalAmount: 18500000,
        paidAmount: 18500000,
        notes: 'Kaos Peserta Event Fun Run 300 Pcs Combed 30s',
        createdById: owner.id,
        items: {
          create: [
            {
              productId: kaosProd ? kaosProd.id : null,
              customDescription: 'Kaos Event Fun Run Jakarta 2026 (300 pcs)',
              quantity: 300,
              unitName: 'pcs',
              pricePerUnit: 61666,
              subtotal: 18500000
            }
          ]
        },
        invoices: {
          create: {
            invoiceNumber: 'INV-2026-0010',
            customerId: customer3.id,
            dueDate: new Date(),
            totalAmount: 18500000,
            paidAmount: 18500000,
            status: 'PAID',
            notes: 'Faktur Proyek Fun Run Lunas'
          }
        }
      }
    });

    console.log('Created 3 Sales Orders with Invoices.');
  }

  // 4. Work Orders (SPK)
  const woCount = await prisma.workOrder.count();
  if (woCount === 0 && jerseyProd) {
    console.log('Creating initial work orders (SPK)...');
    await prisma.workOrder.create({
      data: {
        woNumber: 'SPK-2026-0041',
        productId: jerseyProd.id,
        targetQty: 100,
        completedQty: 0,
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        materialCost: 2125000,
        notes: 'Pesanan FC Juara Futsal - Sablon Polyflex Nama Punggung',
        createdById: owner.id
      }
    });

    if (kaosProd) {
      await prisma.workOrder.create({
        data: {
          woNumber: 'SPK-2026-0040',
          productId: kaosProd.id,
          targetQty: 200,
          completedQty: 200,
          scrapQty: 4,
          status: 'COMPLETED',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          materialCost: 6270000,
          sewingCost: 1300000,
          laborCost: 300000,
          overheadCost: 100000,
          totalProductionCost: 7970000,
          hppPerPcs: 39850,
          notes: 'Restock gudang kodi distro',
          createdById: owner.id
        }
      });
    }
    console.log('Created Work Orders.');
  }

  // 5. Operational Expenses
  const expCount = await prisma.expense.count();
  if (expCount === 0) {
    console.log('Creating initial operational expenses...');
    let catListrik = await prisma.expenseCategory.findFirst({ where: { name: 'Listrik & Air' } });
    if (!catListrik) {
      catListrik = await prisma.expenseCategory.create({
        data: { name: 'Listrik & Air', code: 'EXP-UTIL', description: 'Listrik mesin jahit, AC, & air workshop' }
      });
    }

    let catOperasional = await prisma.expenseCategory.findFirst({ where: { name: 'Operasional Pabrik' } });
    if (!catOperasional) {
      catOperasional = await prisma.expenseCategory.create({
        data: { name: 'Operasional Pabrik', code: 'EXP-OPS', description: 'Perawatan mesin jahit, jarum, minyak' }
      });
    }

    let catAdmin = await prisma.expenseCategory.findFirst({ where: { name: 'Gaji & Upah Admin' } });
    if (!catAdmin) {
      catAdmin = await prisma.expenseCategory.create({
        data: { name: 'Gaji & Upah Admin', code: 'EXP-ADM', description: 'Staff administrasi & keuangan' }
      });
    }

    const cashAccount = await prisma.account.findFirst({ where: { code: '1001' } });

    await prisma.expense.create({
      data: {
        expenseNumber: 'EXP-2026-0001',
        date: new Date(),
        amount: 850000,
        recipient: 'PLN Pascabayar',
        categoryId: catListrik.id,
        accountId: cashAccount ? cashAccount.id : null,
        notes: 'Tagihan listrik mesin jahit workshop September 2026'
      }
    });

    await prisma.expense.create({
      data: {
        expenseNumber: 'EXP-2026-0002',
        date: new Date(),
        amount: 1500000,
        recipient: 'Toko Perkakas Garmen',
        categoryId: catOperasional.id,
        accountId: cashAccount ? cashAccount.id : null,
        notes: 'Minyak mesin Singer, jarum obras Organ, & gunting kain'
      }
    });

    await prisma.expense.create({
      data: {
        expenseNumber: 'EXP-2026-0003',
        date: new Date(),
        amount: 1900000,
        recipient: 'Staff Admin',
        categoryId: catAdmin.id,
        accountId: cashAccount ? cashAccount.id : null,
        notes: 'Uang makan & operasional admin'
      }
    });

    console.log('Created Expenses.');
  }

  console.log('Seeding completed successfully!');
}

seedData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
