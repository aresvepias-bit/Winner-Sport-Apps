const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const prisma = require('./api/db');

async function seedData() {
  console.log('Seeding operational transactions to Supabase PostgreSQL...');

  const owner = await prisma.user.findFirst({ where: { email: 'owner@winnersport.com' } });
  if (!owner) {
    console.error('Owner user not found!');
    return;
  }

  // 5. Operational Expenses
  const expCount = await prisma.expense.count();
  if (expCount === 0) {
    console.log('Creating initial operational expenses...');
    let catListrik = await prisma.category.findFirst({ where: { name: 'Listrik & Air' } });
    if (!catListrik) {
      catListrik = await prisma.category.create({
        data: { name: 'Listrik & Air', type: 'EXPENSE', description: 'Listrik mesin jahit, AC, & air workshop' }
      });
    }

    let catOperasional = await prisma.category.findFirst({ where: { name: 'Operasional Pabrik' } });
    if (!catOperasional) {
      catOperasional = await prisma.category.create({
        data: { name: 'Operasional Pabrik', type: 'EXPENSE', description: 'Perawatan mesin jahit, jarum, minyak' }
      });
    }

    let catAdmin = await prisma.category.findFirst({ where: { name: 'Gaji & Upah Admin' } });
    if (!catAdmin) {
      catAdmin = await prisma.category.create({
        data: { name: 'Gaji & Upah Admin', type: 'EXPENSE', description: 'Staff administrasi & keuangan' }
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
