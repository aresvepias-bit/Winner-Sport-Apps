require('dotenv').config();
const express = require('express');
const prisma = require('./db');
const { applyHttpSecurity } = require('./httpSecurity');

const app = express();

// Security header, pembatasan asal (CORS), dan batas ukuran body.
const httpSecurity = applyHttpSecurity(app, express);

/**
 * Pembersihan catatan lama.
 *
 * Di serverless tidak ada proses yang hidup terus, jadi setInterval tidak bisa
 * diandalkan. Pembersihan dititipkan pada lalu lintas biasa: paling sering
 * sekali per jam per instance, dan tidak menahan jawaban permintaan.
 */
const JEDA_BERSIH_MS = 60 * 60 * 1000;
let bersihBerikutnya = 0;

function bersihkanBilaWaktunya() {
  if (Date.now() < bersihBerikutnya) return;
  bersihBerikutnya = Date.now() + JEDA_BERSIH_MS;
  require('./loginThrottle').prune().catch((e) => console.warn('[loginThrottle] gagal membersihkan:', e.message));
  require('./loginAudit').prune().catch((e) => console.warn('[loginAudit] gagal membersihkan:', e.message));
}

app.use((req, res, next) => {
  bersihkanBilaWaktunya();
  next();
});

// Rute Dasar & Health Check
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'Winner Sport Konveksi Operations System API',
    version: '1.0.0'
  });
});

app.get('/api/health-check', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'OK',
      database: 'Connected to Supabase PostgreSQL',
      stats: { totalUsers: userCount }
    });
  } catch (err) {
    res.status(500).json({
      status: 'DATABASE_DISCONNECTED',
      error: err.message
    });
  }
});

// Mount Modular Routes
app.use('/api/auth', require('../routes/authRouter'));
app.use('/api/master', require('../routes/masterRouter'));
app.use('/api/inventory', require('../routes/inventoryRouter'));
app.use('/api/production', require('../routes/productionRouter'));
app.use('/api/sales', require('../routes/salesRouter'));
app.use('/api/purchasing', require('../routes/purchaseRouter'));
app.use('/api/accounting', require('../routes/accountingRouter'));
app.use('/api/dashboard', require('../routes/dashboardRouter'));
app.use('/api/users', require('../routes/userRouter'));

// Global Error Handler
app.use((err, req, res, next) => {
  if (err && /tidak diizinkan/.test(err.message || '')) {
    return res.status(403).json({ error: err.message });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Data yang dikirim terlalu besar.' });
  }
  console.error('[server error]:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Di Vercel, platform yang menangani permintaan; app.listen() tidak boleh dipanggil.
const BERJALAN_DI_SERVERLESS = Boolean(process.env.VERCEL);

if (!BERJALAN_DI_SERVERLESS) {
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => {
    console.log(`[server] Winner Sport Backend API berjalan di http://localhost:${PORT}`);
    httpSecurity.warn();
    require('./defaultPasswordCheck').warnAboutDefaultPasswords();
    bersihkanBilaWaktunya();
  });
} else {
  httpSecurity.warn();
}

module.exports = app;
