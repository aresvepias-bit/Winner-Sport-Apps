const prisma = require('../api/db');

/**
 * Controller: Laporan Keuangan Berperiode (Laba Rugi & Arus Kas)
 *
 * Laporan lama menjumlahkan seluruh riwayat tanpa batas tanggal, sehingga
 * "laba bulan ini" sebenarnya laba sejak aplikasi dipakai. Semua perhitungan di
 * sini selalu terikat rentang tanggal, dan bisa dibandingkan dengan periode
 * sebelumnya yang sama panjang.
 */

const awalHari = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const akhirHari = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const bulat = (n) => Math.round(Number(n) * 100) / 100;
const persen = (bagian, dari) => (dari > 0 ? Number(((bagian / dari) * 100).toFixed(2)) : 0);

/** Rentang dari query; bawaannya bulan berjalan. */
function rentangPeriode(query = {}) {
  const sekarang = new Date();
  const to = query.to ? akhirHari(query.to) : akhirHari(sekarang);
  const from = query.from
    ? awalHari(query.from)
    : awalHari(new Date(to.getFullYear(), to.getMonth(), 1));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw Object.assign(new Error('Tanggal periode tidak valid.'), { status: 400 });
  }
  if (from > to) {
    throw Object.assign(new Error('Tanggal awal tidak boleh lewat dari tanggal akhir.'), { status: 400 });
  }
  return { from, to };
}

/** Periode sebelumnya dengan panjang yang sama persis, untuk pembanding. */
function periodeSebelumnya(from, to) {
  const panjang = to.getTime() - from.getTime();
  const toLalu = new Date(from.getTime() - 1);
  const fromLalu = new Date(toLalu.getTime() - panjang);
  return { from: fromLalu, to: toLalu };
}

async function hitungLabaRugi(from, to) {
  const [orders, expenses] = await Promise.all([
    prisma.salesOrder.findMany({
      where: { status: { not: 'CANCELLED' }, orderDate: { gte: from, lte: to } },
      include: { items: true }
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true }
    })
  ]);

  const totalRevenue = orders.reduce((t, o) => t + Number(o.totalAmount), 0);

  // HPP dibaca dari yang direkam saat order dibuat, bukan dihitung ulang dari
  // master. Mengubah HPP acuan produk hari ini tidak boleh mengubah laba bulan
  // yang sudah lewat. Baris lama bernilai 0; `coverage` memberi tahu porsinya.
  let totalHpp = 0;
  let itemsTotal = 0;
  let itemsWithHpp = 0;
  for (const order of orders) {
    for (const item of order.items) {
      itemsTotal += 1;
      const hpp = Number(item.hppTotal) || 0;
      if (hpp > 0) itemsWithHpp += 1;
      totalHpp += hpp;
    }
  }

  const totalExpenses = expenses.reduce((t, e) => t + Number(e.amount), 0);
  const expenseBreakdown = {};
  for (const e of expenses) {
    const nama = e.category ? e.category.name : 'Operasional Umum';
    expenseBreakdown[nama] = bulat((expenseBreakdown[nama] || 0) + Number(e.amount));
  }

  const grossProfit = totalRevenue - totalHpp;
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue: bulat(totalRevenue),
    totalHpp: bulat(totalHpp),
    coverage: { itemsTotal, itemsWithHpp },
    grossProfit: bulat(grossProfit),
    grossProfitMargin: persen(grossProfit, totalRevenue),
    totalExpenses: bulat(totalExpenses),
    expenseBreakdown,
    netProfit: bulat(netProfit),
    netProfitMargin: persen(netProfit, totalRevenue),
    jumlahOrder: orders.length,
    jumlahPengeluaran: expenses.length
  };
}

async function hitungArusKas(from, to) {
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { account: true }
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true, account: true }
    })
  ]);

  const masuk = payments.filter((p) => p.type === 'INCOME');
  const bayarKeluar = payments.filter((p) => p.type === 'EXPENSE');

  const totalMasuk = masuk.reduce((t, p) => t + Number(p.amount), 0);
  const totalBayarKeluar = bayarKeluar.reduce((t, p) => t + Number(p.amount), 0);
  const totalBeban = expenses.reduce((t, e) => t + Number(e.amount), 0);
  const totalKeluar = totalBayarKeluar + totalBeban;

  const perMetode = {};
  for (const p of masuk) {
    perMetode[p.method] = bulat((perMetode[p.method] || 0) + Number(p.amount));
  }

  const bebanPerKategori = {};
  for (const e of expenses) {
    const nama = e.category ? e.category.name : 'Operasional Umum';
    bebanPerKategori[nama] = bulat((bebanPerKategori[nama] || 0) + Number(e.amount));
  }

  return {
    masuk: {
      total: bulat(totalMasuk),
      dariPelanggan: bulat(totalMasuk),
      perMetode,
      jumlahTransaksi: masuk.length
    },
    keluar: {
      total: bulat(totalKeluar),
      keSupplier: bulat(totalBayarKeluar),
      bebanOperasional: bulat(totalBeban),
      bebanPerKategori,
      jumlahTransaksi: bayarKeluar.length + expenses.length
    },
    arusKasBersih: bulat(totalMasuk - totalKeluar)
  };
}

/** Saldo kas & bank hari ini. Bukan saldo akhir periode: saldo akun hanya
 *  menyimpan nilai berjalan, tidak ada riwayat saldo per tanggal. */
async function saldoKasSekarang() {
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { name: { contains: 'Kas', mode: 'insensitive' } },
        { name: { contains: 'Bank', mode: 'insensitive' } },
        { code: { startsWith: '10' } }
      ]
    },
    orderBy: { code: 'asc' }
  });

  return {
    accounts: accounts.map((a) => ({ id: a.id, code: a.code, name: a.name, balance: bulat(a.balance) })),
    total: bulat(accounts.reduce((t, a) => t + Number(a.balance), 0))
  };
}

/** Batas awal/akhir tiap periode dalam satu tahun. */
function periodeSetahun(tahun, mode) {
  const daftar = [];
  if (mode === 'kuartal') {
    for (let k = 0; k < 4; k += 1) {
      daftar.push({
        label: `Q${k + 1}`,
        from: new Date(tahun, k * 3, 1, 0, 0, 0, 0),
        to: new Date(tahun, k * 3 + 3, 0, 23, 59, 59, 999)
      });
    }
    return daftar;
  }
  const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  for (let b = 0; b < 12; b += 1) {
    daftar.push({
      label: NAMA_BULAN[b],
      from: new Date(tahun, b, 1, 0, 0, 0, 0),
      to: new Date(tahun, b + 1, 0, 23, 59, 59, 999)
    });
  }
  return daftar;
}

const reportController = {
  // GET /api/reports/profit-loss?from=&to=
  async profitLoss(req, res) {
    try {
      const { from, to } = rentangPeriode(req.query);
      const lalu = periodeSebelumnya(from, to);

      const [sekarang, sebelumnya] = await Promise.all([
        hitungLabaRugi(from, to),
        hitungLabaRugi(lalu.from, lalu.to)
      ]);

      res.json({
        periode: { from, to },
        periodeSebelumnya: { from: lalu.from, to: lalu.to },
        ...sekarang,
        sebelumnya
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  // GET /api/reports/cash-flow?from=&to=
  async cashFlow(req, res) {
    try {
      const { from, to } = rentangPeriode(req.query);
      const lalu = periodeSebelumnya(from, to);

      const [sekarang, sebelumnya, saldo] = await Promise.all([
        hitungArusKas(from, to),
        hitungArusKas(lalu.from, lalu.to),
        saldoKasSekarang()
      ]);

      res.json({
        periode: { from, to },
        periodeSebelumnya: { from: lalu.from, to: lalu.to },
        ...sekarang,
        sebelumnya,
        saldoKasSekarang: saldo
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  // GET /api/reports/series?tahun=2026&mode=bulan|kuartal
  async series(req, res) {
    try {
      const tahun = Number(req.query.tahun) || new Date().getFullYear();
      const mode = req.query.mode === 'kuartal' ? 'kuartal' : 'bulan';
      if (tahun < 2000 || tahun > 2100) {
        return res.status(400).json({ error: 'Tahun laporan tidak masuk akal.' });
      }

      const daftar = periodeSetahun(tahun, mode);
      const awalTahun = daftar[0].from;
      const akhirTahun = daftar[daftar.length - 1].to;

      // Satu tarikan untuk setahun, lalu dikelompokkan di memori. Jauh lebih
      // murah daripada 12 kali query terpisah ke basis data.
      const [orders, expenses, payments] = await Promise.all([
        prisma.salesOrder.findMany({
          where: { status: { not: 'CANCELLED' }, orderDate: { gte: awalTahun, lte: akhirTahun } },
          include: { items: true }
        }),
        prisma.expense.findMany({ where: { date: { gte: awalTahun, lte: akhirTahun } } }),
        prisma.payment.findMany({ where: { date: { gte: awalTahun, lte: akhirTahun } } })
      ]);

      const indeks = (tanggal) => {
        const d = new Date(tanggal);
        return mode === 'kuartal' ? Math.floor(d.getMonth() / 3) : d.getMonth();
      };

      const hasil = daftar.map((p) => ({
        label: p.label,
        from: p.from,
        to: p.to,
        pendapatan: 0,
        hpp: 0,
        beban: 0,
        labaKotor: 0,
        labaBersih: 0,
        kasMasuk: 0,
        kasKeluar: 0
      }));

      for (const o of orders) {
        const i = indeks(o.orderDate);
        if (!hasil[i]) continue;
        hasil[i].pendapatan += Number(o.totalAmount);
        for (const item of o.items) hasil[i].hpp += Number(item.hppTotal) || 0;
      }
      for (const e of expenses) {
        const i = indeks(e.date);
        if (!hasil[i]) continue;
        hasil[i].beban += Number(e.amount);
        hasil[i].kasKeluar += Number(e.amount);
      }
      for (const p of payments) {
        const i = indeks(p.date);
        if (!hasil[i]) continue;
        if (p.type === 'INCOME') hasil[i].kasMasuk += Number(p.amount);
        else hasil[i].kasKeluar += Number(p.amount);
      }

      for (const h of hasil) {
        h.pendapatan = bulat(h.pendapatan);
        h.hpp = bulat(h.hpp);
        h.beban = bulat(h.beban);
        h.labaKotor = bulat(h.pendapatan - h.hpp);
        h.labaBersih = bulat(h.labaKotor - h.beban);
        h.kasMasuk = bulat(h.kasMasuk);
        h.kasKeluar = bulat(h.kasKeluar);
      }

      res.json({ tahun, mode, periode: hasil });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
};

module.exports = reportController;
module.exports._internal = { rentangPeriode, periodeSebelumnya, periodeSetahun };
