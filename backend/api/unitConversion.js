const prisma = require('./db');

/**
 * Konversi satuan jual ke pcs memakai master Satuan (Unit.ratioToPcs).
 *
 * Sebelumnya rasio ditulis langsung di kode dan hanya mengenali "kodi", sehingga
 * penjualan dalam lusin dihitung 1 pcs — bukan 12 — dan membuat HPP serta
 * pengurangan stok meleset. Sekarang rasionya diambil dari data master.
 */
/** Alasan sama seperti rolePolicy: instance lain harus ikut menyusul. */
const CACHE_TTL_MS = Number(process.env.UNIT_CACHE_TTL_SECONDS || 60) * 1000;

let cache = null;
let cacheExpiresAt = 0;
let loading = null;

/** Map dibuat dari nama maupun simbol satuan, keduanya huruf kecil. */
function buildCache(units) {
  const map = new Map();
  for (const u of units) {
    const ratio = Number(u.ratioToPcs);
    const value = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
    if (u.name) map.set(u.name.toLowerCase(), value);
    if (u.symbol) map.set(u.symbol.toLowerCase(), value);
  }
  return map;
}

function ensureLoaded() {
  if (cache && Date.now() < cacheExpiresAt) return Promise.resolve(cache);
  if (!loading) {
    loading = prisma.unit
      .findMany({ select: { name: true, symbol: true, ratioToPcs: true } })
      .then((units) => {
        cache = buildCache(units);
        cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        return cache;
      })
      .catch((err) => {
        console.warn('[unitConversion] Gagal memuat master satuan, memakai rasio 1:', err.message);
        cache = new Map();
        cacheExpiresAt = Date.now() + Math.min(CACHE_TTL_MS, 5000);
        return cache;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

function invalidate() {
  cache = null;
  cacheExpiresAt = 0;
}

/** Berapa pcs dalam 1 satuan tersebut. Satuan tak dikenal dianggap 1. */
async function ratioToPcs(unitName) {
  if (!unitName) return 1;
  const map = await ensureLoaded();
  return map.get(String(unitName).toLowerCase()) ?? 1;
}

/** Mengubah kuantitas bersatuan apa pun menjadi jumlah pcs. */
async function toPcs(quantity, unitName) {
  const qty = Number(quantity) || 0;
  return qty * (await ratioToPcs(unitName));
}

module.exports = { ratioToPcs, toPcs, invalidate, ensureLoaded, CACHE_TTL_MS };
