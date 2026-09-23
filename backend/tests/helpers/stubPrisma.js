const path = require('path');

/**
 * Prisma tiruan berbasis array in-memory, cukup untuk menguji controller tanpa database.
 *
 * Catatan bentuk data:
 * - `update` memakai Object.assign (mutasi di tempat), sehingga relasi yang di-seed
 *   sebagai referensi objek ikut terlihat berubah — seperti relasi asli.
 * - `include` diabaikan: relasi cukup di-seed langsung pada barisnya.
 */
const teksKecil = (v) => (v === undefined || v === null ? '' : String(v).toLowerCase());

/**
 * Operator yang benar-benar dipakai kode produksi didukung; sisanya dilewati.
 * Semua operator dalam satu objek diperiksa, bukan hanya yang pertama ketemu:
 * `{ gte, lte }` untuk rentang tanggal harus memenuhi keduanya.
 */
function cocokOperator(nilai, val) {
  if (Array.isArray(val.in) && !val.in.includes(nilai)) return false;
  if (val.lt !== undefined && !(new Date(nilai) < new Date(val.lt))) return false;
  if (val.lte !== undefined && !(new Date(nilai) <= new Date(val.lte))) return false;
  if (val.gt !== undefined && !(new Date(nilai) > new Date(val.gt))) return false;
  if (val.gte !== undefined && !(new Date(nilai) >= new Date(val.gte))) return false;
  if (val.not !== undefined && nilai === val.not) return false;
  if (val.contains !== undefined && !teksKecil(nilai).includes(teksKecil(val.contains))) return false;
  if (val.startsWith !== undefined && !teksKecil(nilai).startsWith(teksKecil(val.startsWith))) return false;
  return true;
}

function matches(row, where = {}) {
  return Object.entries(where).every(([key, val]) => {
    if (key === 'OR') return (val || []).some((w) => matches(row, w));
    if (key === 'AND') return (val || []).every((w) => matches(row, w));
    if (key === 'NOT') return !matches(row, val);
    if (val && typeof val === 'object' && !(val instanceof Date)) return cocokOperator(row[key], val);
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

/** Meniru `select` Prisma: hanya kolom bernilai true yang dikembalikan. */
function project(row, select) {
  if (!row || !select) return row;
  const keys = Object.entries(select).filter(([, v]) => v).map(([k]) => k);
  return Object.fromEntries(keys.map((k) => [k, row[k]]));
}

function makeModel(name, seed = []) {
  // Objek seed dipakai langsung (bukan disalin) agar relasi yang di-seed sebagai
  // referensi — mis. workOrder.product — tetap menunjuk baris yang sama saat di-update.
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async findMany({ where, take, select } = {}) {
      const found = rows.filter((r) => matches(r, where));
      return (take ? found.slice(0, take) : found).map((r) => project(r, select));
    },
    async findUnique({ where, select } = {}) {
      return project(rows.find((r) => matches(r, where)) || null, select);
    },
    async findFirst({ where, select } = {}) {
      return project(rows.find((r) => matches(r, where)) || null, select);
    },
    async create({ data, select } = {}) {
      const row = { id: `${name}-${++counter}`, ...flatten(data) };
      rows.push(row);
      return project(row, select);
    },
    async upsert({ where, update, create } = {}) {
      // where majemuk (mis. { role_module: { role, module } }) diratakan dulu
      const flat = Object.values(where || {}).find((v) => v && typeof v === 'object') || where;
      const row = rows.find((r) => matches(r, flat));
      if (row) {
        Object.assign(row, flatten(update));
        return row;
      }
      const baru = { id: `${name}-${++counter}`, ...flatten(create) };
      rows.push(baru);
      return baru;
    },
    async update({ where, data, select } = {}) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error(`${name}: baris tidak ditemukan untuk update`);
      Object.assign(row, flatten(data));
      return project(row, select);
    },
    async delete({ where } = {}) {
      const i = rows.findIndex((r) => matches(r, where));
      if (i === -1) {
        const err = new Error(`${name}: baris tidak ditemukan untuk delete`);
        err.code = 'P2025';
        throw err;
      }
      return rows.splice(i, 1)[0];
    },
    async deleteMany({ where } = {}) {
      const hapus = rows.filter((r) => matches(r, where));
      for (const r of hapus) rows.splice(rows.indexOf(r), 1);
      return { count: hapus.length };
    },
    async count({ where } = {}) {
      return rows.filter((r) => matches(r, where)).length;
    }
  };
}

const MODELS = [
  'user', 'rawMaterial', 'product', 'category', 'unit', 'contact', 'employee', 'bom', 'bomItem',
  'workOrder', 'workOrderMaterial', 'salesOrder', 'salesOrderItem', 'invoice', 'payment',
  'purchaseOrder', 'purchaseOrderItem', 'stockMovement', 'stockOpname', 'stockOpnameItem',
  'account', 'expense', 'journalEntry', 'journalItem', 'rolePermission', 'salesType', 'loginThrottle'
];

/**
 * Memasang prisma tiruan ke require.cache untuk api/db.js, lalu mengembalikannya.
 * Harus dipanggil SEBELUM controller di-require.
 */
function installStub(seed = {}) {
  const target = { $transaction: async (arg) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)) };

  // Model yang umum dipakai dibuat di awal agar Object.values(prisma) melihatnya.
  for (const m of new Set([...MODELS, ...Object.keys(seed)])) target[m] = makeModel(m, seed[m] || []);

  // Model lain dibuat saat pertama diakses, lalu disimpan sebagai properti biasa.
  // Tanpa ini, setiap tabel baru di schema.prisma akan membuat test gagal dengan
  // pesan "reading 'rows' of undefined" yang menyesatkan.
  const prisma = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      if (typeof prop !== 'string' || prop.startsWith('$') || prop === 'then' || prop === 'inspect') return undefined;
      obj[prop] = makeModel(prop, seed[prop] || []);
      return obj[prop];
    }
  });

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
