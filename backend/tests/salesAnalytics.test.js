const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../frontend/node_modules/typescript');
const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/components/sales/salesAnalytics.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const target = { exports: {} };
new Function('exports', 'module', compiled)(target.exports, target);
const { salesMonth, salesSegment, summarizeSales } = target.exports;

test('bulan transaksi mengikuti WIB di batas pergantian bulan', () => {
  assert.equal(salesMonth('2026-08-31T17:00:00Z'), '2026-09');
  assert.equal(salesMonth('2026-08-31T16:59:59Z'), '2026-08');
});

test('ringkasan bulanan memisahkan corporate, customer, pembatalan, dan saldo tagihan', () => {
  const base = { createdAt: '2026-09-12T00:00:00Z', status: 'CONFIRMED', totalAmount: '100', paidAmount: '25' };
  const summary = summarizeSales([
    { ...base, customer: { companyName: 'PT Contoh' } },
    { ...base, totalAmount: 200, paidAmount: 210, customer: { companyName: '  ' } },
    { ...base, status: 'CANCELLED' },
    { ...base, createdAt: '2026-08-01T00:00:00Z' },
  ], '2026-09');
  assert.equal(summary.valid.length, 2);
  assert.equal(summary.period.length, 3);
  assert.equal(summary.cancelled, 1);
  assert.equal(summary.corporate.length, 1);
  assert.equal(summary.customer.length, 1);
  assert.equal(summary.total, 300);
  assert.equal(summary.paid, 235);
  assert.equal(summary.outstanding, 75);
  assert.equal(summary.days[11].count, 2);
  assert.equal(summary.days.reduce((sum, day) => sum + day.value, 0), summary.total);
  assert.equal(salesSegment({ customer: { companyName: '   ' } }), 'CUSTOMER');
});

test('bulan tanpa transaksi dan tahun kabisat tidak menghasilkan angka palsu', () => {
  const summary = summarizeSales([], '2028-02');
  assert.equal(summary.days.length, 29);
  assert.equal(summary.total, 0);
  assert.equal(summary.outstanding, 0);
  assert.equal(summary.valid.length, 0);
});
