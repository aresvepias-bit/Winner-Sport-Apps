const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

/**
 * Klien Prisma tunggal.
 *
 * Disimpan di globalThis agar tidak dibuat ulang saat modul dimuat ulang
 * (nodemon saat pengembangan, dan pemakaian ulang instance di serverless).
 * Tanpa ini, tiap muat ulang membuka pool baru dan koneksi Supabase cepat habis.
 */

// Di serverless tiap instance melayani satu permintaan pada satu waktu, jadi pool
// besar hanya memboroskan kuota koneksi Supabase yang dipakai bersama semua instance.
const POOL_MAX = Number(process.env.DB_POOL_MAX || (process.env.VERCEL ? 1 : 10));

function createPrisma() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url || url.includes('[YOUR-PASSWORD]')) return new PrismaClient();

    const dbConfig = parse(url);
    dbConfig.ssl = { rejectUnauthorized: false };
    dbConfig.max = POOL_MAX;

    // search_path dipasang lewat parameter koneksi, bukan query terpisah setelah
    // koneksi jadi. Cara lama memanggil client.query() tanpa menunggu hasilnya,
    // yang memicu peringatan deprecation pg dan bisa balapan dengan query pertama.
    dbConfig.options = '-c search_path=winner_sport,public';

    return new PrismaClient({ adapter: new PrismaPg(new Pool(dbConfig)) });
  } catch (err) {
    console.warn('[db] Kembali ke PrismaClient standar:', err.message);
    return new PrismaClient();
  }
}

const globalKey = Symbol.for('winnerSport.prisma');
const prisma = globalThis[globalKey] || createPrisma();
if (!globalThis[globalKey]) globalThis[globalKey] = prisma;

module.exports = prisma;
