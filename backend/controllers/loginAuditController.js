const loginAudit = require('../api/loginAudit');

/** Riwayat percobaan login, hanya untuk pemegang modul USER_ADMIN. */
const loginAuditController = {
  // GET /api/users/login-audit
  async getAudit(req, res) {
    try {
      const { limit, email, onlyFailed } = req.query;
      const [entries, summary] = await Promise.all([
        loginAudit.list({ limit, email, onlyFailed: onlyFailed === 'true' }),
        loginAudit.summary()
      ]);
      res.json({ entries, summary, retentionDays: loginAudit.RETENTION_DAYS });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = loginAuditController;
