const prisma = require('./db');

/**
 * Pencatatan riwayat percobaan login.
 *
 * Password dan token tidak pernah masuk ke sini. Yang dicatat hanya email yang
 * dicoba, hasilnya, alasan gagal, IP, dan perangkat — cukup untuk mengenali
 * percobaan menebak, tanpa menyimpan hal yang berbahaya bila tabel ini bocor.
 */

/** Riwayat lebih tua dari ini dibuang saat pembersihan berkala. */
const RETENTION_DAYS = Number(process.env.LOGIN_AUDIT_RETENTION_DAYS || 90);

const clientIp = (req) =>
  (req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
  req?.ip ||
  req?.socket?.remoteAddress ||
  null;

/**
 * Mencatat satu percobaan. Sengaja tidak pernah melempar error:
 * kegagalan mencatat riwayat tidak boleh sampai menggagalkan proses login.
 */
async function record({ req, email, userId = null, success, reason = null }) {
  try {
    await prisma.loginAudit.create({
      data: {
        email: String(email || '').toLowerCase().trim().slice(0, 200),
        userId,
        success,
        reason,
        ip: clientIp(req),
        userAgent: (req?.headers?.['user-agent'] || '').slice(0, 300) || null
      }
    });
  } catch (err) {
    console.warn('[loginAudit] gagal mencatat percobaan login:', err.message);
  }
}

/** Daftar riwayat terbaru untuk ditampilkan di menu Pengguna. */
async function list({ limit = 100, email, onlyFailed = false } = {}) {
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return prisma.loginAudit.findMany({
    where: {
      ...(email ? { email: String(email).toLowerCase().trim() } : {}),
      ...(onlyFailed ? { success: false } : {})
    },
    orderBy: { createdAt: 'desc' },
    take
  });
}

/** Ringkasan singkat 24 jam terakhir, untuk memberi tanda bila ada yang janggal. */
async function summary() {
  const sejak = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await prisma.loginAudit.findMany({
    where: { createdAt: { gte: sejak } },
    select: { success: true, email: true }
  });

  const gagal = rows.filter((r) => !r.success);
  return {
    sejak,
    total: rows.length,
    berhasil: rows.length - gagal.length,
    gagal: gagal.length,
    akunDicoba: [...new Set(gagal.map((r) => r.email))].length
  };
}

async function prune() {
  const batas = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const hasil = await prisma.loginAudit.deleteMany({ where: { createdAt: { lt: batas } } });
  return hasil.count;
}

module.exports = { record, list, summary, prune, RETENTION_DAYS };
