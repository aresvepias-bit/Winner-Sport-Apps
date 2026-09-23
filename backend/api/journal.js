const prisma = require('./db');

/**
 * Pencatatan jurnal ganda (double entry) beserta pembaruan saldo akun.
 *
 * Sebelumnya tabel JournalEntry ada tapi tidak pernah diisi, sehingga akun
 * "HPP Produksi" selamanya bersaldo nol dan buku besar tidak mencerminkan
 * apa pun. Sekarang penjualan dan penyelesaian SPK menulis jurnalnya.
 */

/** Kode akun yang dipakai otomatis oleh sistem. Harus ada di bagan akun. */
const AKUN = {
  KAS: '1001',
  PIUTANG: '1101',
  PERSEDIAAN_BAHAN: '1201',
  PERSEDIAAN_JADI: '1202',
  PENDAPATAN: '4001',
  HPP: '5001',
  BIAYA_PRODUKSI_DIBEBANKAN: '5101'
};

/** Jenis akun yang bertambah di sisi debit; sisanya bertambah di sisi kredit. */
const SALDO_NORMAL_DEBIT = new Set(['ASSET', 'EXPENSE', 'COGS']);

const bulat = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Menulis satu jurnal. `lines` berisi { code, debit?, credit?, }.
 * Baris bernilai 0 diabaikan, dan jurnal yang tidak seimbang ditolak —
 * lebih baik gagal terang-terangan daripada membuat buku besar yang salah.
 *
 * Harus dijalankan di dalam transaksi database (`tx`) bersama perubahan
 * data aslinya, supaya saldo dan jurnal tidak pernah terpisah.
 */
async function postJournal(tx, { date, description, referenceType, referenceId, lines }) {
  const dipakai = (lines || [])
    .map((l) => ({ code: l.code, debit: bulat(l.debit || 0), credit: bulat(l.credit || 0) }))
    .filter((l) => l.debit !== 0 || l.credit !== 0);

  if (dipakai.length === 0) return null; // tidak ada nilai, tidak perlu jurnal

  const totalDebit = bulat(dipakai.reduce((a, l) => a + l.debit, 0));
  const totalKredit = bulat(dipakai.reduce((a, l) => a + l.credit, 0));
  if (totalDebit !== totalKredit) {
    throw new Error(`Jurnal tidak seimbang: debit ${totalDebit} vs kredit ${totalKredit} (${description})`);
  }

  const kodeUnik = [...new Set(dipakai.map((l) => l.code))];
  const akun = await tx.account.findMany({ where: { code: { in: kodeUnik } } });
  const perKode = new Map(akun.map((a) => [a.code, a]));

  const hilang = kodeUnik.filter((c) => !perKode.has(c));
  if (hilang.length > 0) {
    throw new Error(`Akun belum ada di bagan akun: ${hilang.join(', ')}. Jalankan scripts/seed-accounts.js.`);
  }

  const entry = await tx.journalEntry.create({
    data: {
      entryNumber: `JRN-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6)}`,
      date: date || new Date(),
      description,
      referenceType,
      referenceId,
      items: {
        create: dipakai.map((l) => ({
          accountId: perKode.get(l.code).id,
          debit: l.debit,
          credit: l.credit
        }))
      }
    },
    include: { items: true }
  });

  // Saldo diperbarui sesuai sifat akunnya, bukan asal ditambah.
  for (const l of dipakai) {
    const a = perKode.get(l.code);
    const selisih = SALDO_NORMAL_DEBIT.has(a.type) ? l.debit - l.credit : l.credit - l.debit;
    if (selisih === 0) continue;
    await tx.account.update({
      where: { id: a.id },
      data: { balance: bulat(Number(a.balance) + selisih) }
    });
  }

  return entry;
}

module.exports = { postJournal, AKUN, SALDO_NORMAL_DEBIT };
