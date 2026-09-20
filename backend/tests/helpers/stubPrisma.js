const path = require('path');

/**
 * Prisma tiruan berbasis array in-memory, cukup untuk menguji controller tanpa database.
 *
 * Catatan bentuk data:
 * - `update` memakai Object.assign (mutasi di tempat), sehingga relasi yang di-seed
 *   sebagai referensi objek ikut terlihat berubah — seperti relasi asli.
 * - `include` diabaikan: relasi cukup di-seed langsung pada barisnya.
 */
function matches(row, where = {}) {
  return Object.entries(where).every(([key, val]) => {
    if (val && typeof val === 'object' && !(val instanceof Date)) return true; // operator (contains, dll) diabaikan
    return row[key] === val;
  });
}

/** Memisahkan nested `create` (mis. items) agar bisa disimpan sebagai array biasa. */
function flatten(data) {
  const out = {};
  for (const [key, val] of Object.entries(data || {})) {
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && 'create' in val) {
      const created = val.create;
      out[key] = (Array.isArray(created) ? created : [created]).map((c, i) => ({ id: `${key}-${i + 1}`, ...c }));
    } else {
      out[key] = val;
    }
  }
  return out;
}

function makeModel(name, seed = []) {
  // Objek seed dipakai langsung (bukan disalin) agar relasi yang di-seed sebagai
  // referensi — mis. workOrder.product — tetap menunjuk baris yang sama saat di-update.
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async findMany({ where, take } = {}) {
      const found = rows.filter((r) => matches(r, where));
      return take ? found.slice(0, take) : found;
    },
    async findUnique({ where } = {}) {
      return rows.find((r) => matches(r, where)) || null;
    },
    async findFirst({ where } = {}) {
      return rows.find((r) => matches(r, where)) || null;
    },
    async create({ data } = {}) {
      const row = { id: `${name}-${++counter}`, ...flatten(data) };
      rows.push(row);
      return row;
    },
    async update({ where, data } = {}) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error(`${name}: baris tidak ditemukan untuk update`);
      Object.assign(row, flatten(data));
      return row;
    },
    async count() {
      return rows.length;
    }
  };
}

const MODELS = [
  'user', 'rawMaterial', 'product', 'category', 'unit', 'contact', 'employee', 'bom', 'bomItem',
  'workOrder', 'workOrderMaterial', 'salesOrder', 'salesOrderItem', 'invoice', 'payment',
  'purchaseOrder', 'purchaseOrderItem', 'stockMovement', 'stockOpname', 'stockOpnameItem',
  'account', 'expense', 'journalEntry', 'journalItem'
];

/**
 * Memasang prisma tiruan ke require.cache untuk api/db.js, lalu mengembalikannya.
 * Harus dipanggil SEBELUM controller di-require.
 */
function installStub(seed = {}) {
  const prisma = { $transaction: async (arg) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)) };
  for (const m of MODELS) prisma[m] = makeModel(m, seed[m] || []);

  const dbPath = require.resolve(path.join(__dirname, '../../api/db.js'));
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
  return prisma;
}

/** req/res tiruan; `res.code` dan `res.body` bisa langsung diperiksa. */
function mockRes() {
  const res = {
    code: 200,
    body: null,
    status(c) { res.code = c; return res; },
    json(b) { res.body = b; return res; }
  };
  return res;
}

function mockReq({ body = {}, params = {}, query = {}, user = { id: 'user-1', role: 'OWNER' }, headers = {} } = {}) {
  return { body, params, query, user, headers };
}

module.exports = { installStub, mockRes, mockReq };
