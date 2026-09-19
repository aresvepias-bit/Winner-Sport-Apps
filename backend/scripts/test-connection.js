require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

async function testConnection() {
  console.log('🔍 Menguji koneksi ke Supabase PostgreSQL...');
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!url || url.includes('[YOUR-PASSWORD]')) {
    console.error('❌ Error: Password database belum diisi di file backend/.env!');
    console.log('Silakan ganti [YOUR-PASSWORD] dengan password database Supabase Anda.');
    process.exit(1);
  }

  try {
    const config = parse(url);
    config.ssl = { rejectUnauthorized: false };
    const pool = new Pool(config);

    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as server_time, current_database() as db_name, version();');
    console.log('✅ BERHASIL TERHUBUNG KE SUPABASE!');
    console.log('Server Time:', res.rows[0].server_time);
    console.log('Database Name:', res.rows[0].db_name);
    console.log('PostgreSQL Version:', res.rows[0].version.split('\n')[0]);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Gagal terhubung ke database:', err.message);
    process.exit(1);
  }
}

testConnection();
