require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

async function createSchema() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const config = parse(url);
  config.ssl = { rejectUnauthorized: false };
  const pool = new Pool(config);

  const client = await pool.connect();
  console.log('📦 Membuat schema PostgreSQL `winner_sport` di Supabase...');
  await client.query('CREATE SCHEMA IF NOT EXISTS winner_sport;');
  console.log('✅ Schema `winner_sport` berhasil dibuat / sudah ada.');
  client.release();
  await pool.end();
}

createSchema().catch(err => {
  console.error('❌ Error creating schema:', err.message);
  process.exit(1);
});
