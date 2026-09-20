# Winner Sport Konveksi — Project Handover Notes

> Last updated: 2026-09-20 | Status: Production-ready, GitHub connected

---

## 📍 Lokasi Project

```
d:\External Project\Winner Sport\
├── backend\       → Express.js API (port 5005)
└── frontend\      → Next.js App (port 3005)
```

**GitHub:** https://github.com/aresvepias-bit/Winner-Sport-Apps  
**Branch:** `main`

---

## 🏗️ Arsitektur

| Layer | Teknologi | Port |
|---|---|---|
| Frontend | Next.js 16.2.9, TypeScript, Tailwind CSS v4, Turbopack | 3005 |
| Backend | Express.js, Node.js | 5005 |
| Database | PostgreSQL via Supabase + Prisma ORM | Cloud |
| Auth | JWT (authMiddleware.js) | — |

### Struktur Frontend
```
frontend/src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx          → Dashboard
│   │   ├── master/page.tsx   → Master Database Konveksi
│   │   ├── production/       → SPK / Work Orders
│   │   ├── sales/            → Penjualan
│   │   ├── purchasing/       → Purchase Order Bahan
│   │   ├── inventory/        → Stok & Opname
│   │   └── accounting/       → Laba Rugi, Kas, Upah
│   └── login/page.tsx
├── components/
│   ├── common/NumberInput.tsx  → Input ribuan id-ID (1000 → 1.000)
│   ├── dashboard/ | master/ | production/ | sales/
│   ├── purchasing/ | inventory/ | accounting/ | print/
│   └── sidebar.tsx
└── lib/
    ├── api.ts         → Semua fetch ke http://localhost:5005/api/*
    ├── utils.ts       → formatRupiah, formatNumber, formatDate, formatThousand, parseThousand
    └── exportUtils.ts → Export Excel/CSV
```

### Struktur Backend
```
backend/
├── api/index.js          → Entry point Express
├── api/db.js             → Prisma client
├── api/authMiddleware.js → JWT middleware
├── controllers/          → masterController, salesController, dll
├── routes/               → Router per domain
└── prisma/schema.prisma
```

---

## 🎨 Design System

**GLC Corporate Blue:**
- Button utama: `bg-blue-600 hover:bg-blue-700 shadow-blue-600/25`
- Edit icon: `bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200`
- Active Nav Tab: `bg-blue-600`
- Delete/Danger: `bg-rose-600` / `text-red-600`
- Dark Mode: ✅ Supported (`dark:` prefix Tailwind)

**NumberInput Component:**
```tsx
import NumberInput from "@/components/common/NumberInput";

<NumberInput
  value={qty}
  onChange={(val) => setQty(val)}
  allowDecimals={true}
  suffix="kg"
/>
// Format otomatis: 1000 → 1.000 | desimal pakai koma (12,5)
```

**Utility Functions (lib/utils.ts):**
```ts
formatRupiah(1000000)    // → "Rp 1.000.000"
formatNumber(1500)       // → "1.500"
formatDate("2026-01-01") // → "1 Jan 2026"
parseThousand("1.500")   // → 1500 (number)
```

---

## 🔑 API Endpoints

```
POST   /api/auth/login

GET|POST           /api/master/raw-materials
PUT|DELETE         /api/master/raw-materials/:id
GET|POST           /api/master/products
PUT|DELETE         /api/master/products/:id
GET|POST           /api/master/contacts
PUT|DELETE         /api/master/contacts/:id
GET|POST           /api/master/employees
PUT|DELETE         /api/master/employees/:id
GET                /api/master/boms

GET|POST           /api/sales/orders
GET|POST           /api/purchase/orders
GET|POST           /api/production/work-orders
PATCH              /api/production/work-orders/:id/complete
GET|POST           /api/inventory/stock-opname
GET                /api/inventory/movements
GET|POST           /api/accounting/expenses
GET                /api/accounting/profit-loss
GET                /api/accounting/cash-bank
GET                /api/accounting/tailor-payroll
GET                /api/dashboard
```

---

## 📦 Git Workflow

**.gitignore — TIDAK di-push:**
- `.env`, `.env.local`, `.env.production`
- `*.pdf`, `*.doc`, `*.docx`, `*.xls`, `*.xlsx`, `*.ppt`, `*.pptx`
- `Logo/`, `Docs/`, `Documents/`
- `node_modules/`, `.next/`, `dist/`
- `*.pem`, `*.key`, `*.cert`, `secrets/`

**Cara push perubahan:**
```powershell
git add .
git commit -m "feat: deskripsi perubahan"
git push
```

**Jalankan server dev:**
```powershell
# Frontend
cd frontend; npm run dev

# Backend
cd backend; node api/index.js
```

---

## ✅ Fitur Selesai

| Fitur | Status |
|---|---|
| Dashboard KPI + Trend Chart | ✅ |
| Master Database CRUD (Bahan, Produk, Kontak, Karyawan, BOM) | ✅ |
| Edit & Delete modal dengan referential integrity check | ✅ |
| SPK / Work Orders + kalkulasi HPP otomatis | ✅ |
| Sales Orders + Print Faktur | ✅ |
| Purchase Orders Bahan Baku | ✅ |
| Inventory Stok + Stock Opname | ✅ |
| Akuntansi — Laba Rugi, Kas Bank, Upah Penjahit | ✅ |
| Print SPK, Faktur, Slip Upah | ✅ |
| Dark Mode | ✅ |
| Format angka 1.000 (id-ID) di semua input & display | ✅ |
| GLC Corporate Blue button styling | ✅ |
| Modular components (<150 lines/file) | ✅ |
| GitHub connected + .gitignore exclude PDF/Office/env | ✅ |

---

## 🔐 Autentikasi & Hak Akses (RBAC)

- Semua endpoint `/api/*` (kecuali `POST /api/auth/login`) **wajib** header `Authorization: Bearer <JWT>`. Tanpa token / token demo / token salah → `401`.
- `verifyToken` mengecek user ke DB tiap request (akun nonaktif & perubahan role langsung berlaku).
- Role = enum `Role` di `schema.prisma`: `OWNER, ADMIN, WAREHOUSE, PRODUCTION, SALES, ACCOUNTING`. OWNER selalu lolos.
- Kebijakan per modul ada di `backend/api/rolePolicy.js` (mengikuti menu di `sidebar.tsx`). Master data: baca untuk semua role yang login, tulis hanya ADMIN/PRODUCTION; data karyawan hanya ADMIN/PRODUCTION.
- Backend **menolak start** bila `JWT_SECRET` kosong atau sama dengan default lama (default lama sudah ter-commit → dianggap bocor).
- **Frontend:** `frontend/src/lib/routeAccess.ts` = daftar role per halaman (cermin `rolePolicy.js`; ubah keduanya bersamaan). Dipakai sidebar (menu per item) dan `useAuthGuard` di `lib/session.ts`.
- Guard di `(dashboard)/layout.tsx`: tanpa token → `/login`; role diverifikasi ke `/auth/me` tiap load halaman penuh (bukan cuma percaya localStorage); halaman terlarang → dialihkan ke halaman pertama yang boleh (`homeFor`); role tanpa halaman sama sekali → layar "Akses ditolak".
- Pengganti role di sidebar kini hanya untuk **OWNER** dan berupa pratinjau menu (`winner_preview_role`); tidak mengubah akses. Hak akses sebenarnya = role di database.

## 🧭 Perilaku Data di Frontend

- Halaman **tidak lagi** menampilkan data contoh saat API kosong/gagal. Gagal muat → `ErrorBanner` + tombol coba lagi. Gagal simpan → alert berisi pesan error asli, modal tetap terbuka, tidak ada record lokal palsu.
- Payload yang dikirim frontend harus cocok dengan controller backend (PO = header + `items[]`, Opname = create lalu `apply`, Pengeluaran = `categoryId` + `accountId`, Sales = `customerId` dipilih dari Master > Rekanan).

---

## 🚧 Potential Next Steps

- [x] Role-based access control di backend
- [x] Export CSV (Sales, PO, SPK, Stok Bahan/Produk, Mutasi, Akuntansi) — belum ada di halaman Master
- [x] Alert stok minimum (banner dashboard + badge sidebar)
- [x] Pagination tabel daftar (sisi klien, 10 baris/halaman; mutasi stok 15). Catatan: `/inventory/movements` dibatasi 100 baris oleh backend
- [x] Pecah `master/page.tsx` (358 → 74 baris): `masterEntities.ts` (endpoint + pesan per entitas), `useMasterData`, `useMasterCrud`, `MasterTabViews`, `MasterModals`
- [x] Guard per role di sisi halaman frontend (akses via URL langsung)
- [ ] **WAJIB sebelum deploy:** ganti password akun default di database — `cd backend && node scripts/set-password.js owner@winnersport.com` (ulangi untuk `admin@winnersport.com`). Backend mencetak peringatan `[SECURITY]` saat start selama masih ada akun ber-password `admin123` (password itu ada di riwayat git → publik). Kotak kredensial & prefill di halaman login sudah dihapus.
- [ ] Export `.xlsx` sungguhan (CSV berkoma bisa menumpuk di satu kolom pada Excel regional Indonesia)
- [ ] Deploy ke VPS via PM2 (`ecosystem.config.js` sudah ada di root) — set `JWT_SECRET` baru di environment server
- [x] Unit test backend controllers (`cd backend && npm test` — 68 test, tanpa database)

---

## 🧪 Testing

```powershell
cd backend
npm test          # node --test, tanpa database & tanpa dependensi baru
```

- Berkas ada di `backend/tests/`. Prisma digantikan stub in-memory (`tests/helpers/stubPrisma.js`), jadi test tidak menyentuh Supabase.
- Cakupan: middleware auth & role, perhitungan HPP/SPK, penerimaan PO, opname 2 langkah, pembayaran & status invoice, pengurangan saldo kas, serta deteksi stok minimum.
- `tests/routeAccess.test.js` membandingkan `frontend/src/lib/routeAccess.ts` dengan `backend/api/rolePolicy.js` — kalau keduanya tidak lagi sama, test gagal. Butuh `npm install` di folder frontend; kalau belum, test ini dilewati (skip), bukan gagal.
- Menjalankan lewat direktori (`node --test tests/`) error di Node 22 Windows; pakai `npm test` yang sudah memakai pola glob.

---

## ⚠️ Catatan Penting

1. **Jangan hapus** `frontend/public/logo.png` dan `logo-emblem.png` — dipakai sidebar & login page
2. **Backend harus jalan dulu** sebelum frontend bisa fetch data
3. **Prisma schema** → `backend/prisma/schema.prisma` — jika ubah schema: `npx prisma migrate dev`
4. **Env file** → `backend/.env` *(tidak di-push)* — isi: `DATABASE_URL` Supabase + `JWT_SECRET` **acak baru** (buat: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
5. **Peringatan `pg` saat backend start** (`client.query() ... already executing a query`) berasal dari `backend/api/db.js` baris 16-19: handler event `connect` memanggil `client.query('SET search_path ...')` tanpa `await`. Belum diperbaiki — menyentuh `search_path` berisiko, sebaiknya ditangani terpisah sebelum upgrade ke `pg@9`.
6. **Seed** (`backend/scripts/seed.js`) tidak lagi memakai password tetap: pakai env `SEED_PASSWORD` atau buat acak dan tampilkan sekali. User yang sudah ada tidak diubah passwordnya.
7. **seed_transactions.js** → hanya untuk dummy data development, jangan jalankan di production
