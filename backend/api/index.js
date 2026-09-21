require('dotenv').config();
const express = require('express');
const prisma = require('./db');
const { applyHttpSecurity } = require('./httpSecurity');

const app = express();

// Security header, pembatasan asal (CORS), dan batas ukuran body.
const httpSecurity = applyHttpSecurity(app, express);

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

// Port Listening
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`[server] Winner Sport Backend API berjalan di http://localhost:${PORT}`);
  httpSecurity.warn();
  require('./defaultPasswordCheck').warnAboutDefaultPasswords();

  // Catatan percobaan login yang sudah tenang dibuang berkala agar tabel tidak menumpuk.
  const loginThrottle = require('./loginThrottle');
  const loginAudit = require('./loginAudit');
  const bersihkan = () => {
    loginThrottle.prune().catch((e) => console.warn('[loginThrottle] gagal membersihkan:', e.message));
    loginAudit.prune().catch((e) => console.warn('[loginAudit] gagal membersihkan:', e.message));
  };
  bersihkan();
  setInterval(bersihkan, 60 * 60 * 1000).unref();
});

module.exports = app;
