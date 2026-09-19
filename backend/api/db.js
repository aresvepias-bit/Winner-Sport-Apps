const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

let prisma;

try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    const dbConfig = parse(process.env.DATABASE_URL);
    dbConfig.ssl = { rejectUnauthorized: false };
    const pool = new Pool(dbConfig);

    // Set search_path ke winner_sport, public setiap koneksi baru dibuat
    pool.on('connect', (client) => {
      client.query('SET search_path TO winner_sport, public')
        .catch(err => console.error('[db] Error setting search_path:', err.message));
    });

    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    prisma = new PrismaClient();
  }
} catch (err) {
  console.warn('[db] Falling back to standard PrismaClient:', err.message);
  prisma = new PrismaClient();
}

module.exports = prisma;
