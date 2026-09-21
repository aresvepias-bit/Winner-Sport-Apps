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
- Role = enum `Role` di `schema.prisma`: `OWNER, ADMIN, WAREHOUSE, PRODUCTION, SALES, ACCOUNTING`. **OWNER selalu lolos** dan tidak bisa dibatasi — ini yang menjaga sistem tidak bisa terkunci.
- Backend **menolak start** bila `JWT_SECRET` kosong atau sama dengan default lama (default lama sudah ter-commit → dianggap bocor).

### Pengamanan login (tahap 1)

| Perlindungan | Cara kerja |
|---|---|
| **Batas percobaan** | Tabel `LoginThrottle`, dua kunci sekaligus: `email:<alamat>` dan `ip:<alamat>`. Per akun: kunci 1 menit pada kegagalan ke-5, naik ke 5 / 15 / 60 menit pada ke-7 / 10 / 15. Per IP lebih longgar (20 / 40 / 60). Disimpan di database, jadi tidak hilang saat server restart. |
| **Pesan seragam** | Email asing, password salah, dan akun nonaktif semuanya dijawab "Email atau password salah." Perbandingan hash tetap dijalankan walau email tidak ada, agar keberadaan akun tidak terbaca dari selisih waktu respons. |
| **Versi sesi** | `User.tokenVersion` ikut masuk token sebagai klaim `tv`. Naik saat logout, reset password, dan penonaktifan akun — semua token lama langsung ditolak. Token lama tanpa klaim `tv` juga ditolak. |
| **Logout sungguhan** | `POST /api/auth/logout` menaikkan `tokenVersion`. Tanpa daftar sesi per perangkat, logout memang mengeluarkan **semua** perangkat; ini disengaja agar tombol keluar berarti. |
| **Masa berlaku** | Token 12 jam (`JWT_EXPIRES_IN`), turun dari 7 hari. |
| **Batas diam** | 30 menit (`SESSION_IDLE_MINUTES`), dilacak lewat `User.lastSeenAt` yang ditulis paling sering sekali per menit. |

Catatan perilaku yang disengaja:
- **Percobaan saat sedang terkunci tidak memperpanjang kunci.** Kalau dihitung, penyerang bisa menahan akun orang lain terkunci selamanya hanya dengan terus menembak.
- **Email yang tidak terdaftar pun ikut dihitung.** Tanpa itu, pesan "terkunci" hanya muncul untuk email yang benar-benar ada — dan justru membocorkan akun mana yang terdaftar.
- **Login berhasil hanya membersihkan hitungan email, bukan IP.** Satu login benar tidak boleh menghapus jejak puluhan kegagalan dari sumber yang sama.
- Catatan lama dibersihkan otomatis tiap jam (`loginThrottle.prune()`).

### Pengamanan lapis berikutnya (tahap 2)

| Perlindungan | Cara kerja |
|---|---|
| **Security header** | `helmet` di `api/httpSecurity.js`. CSP dimatikan (API ini tidak menyajikan HTML) dan `crossOriginResourcePolicy` dibuat `cross-origin` agar logo tetap termuat frontend. `x-powered-by` dimatikan. |
| **CORS terbatas** | Isi `CORS_ORIGINS` (dipisah koma) di server produksi. Bila kosong, hanya localhost & jaringan lokal (10.x, 192.168.x, 172.16-31.x) yang diterima, dan server memberi peringatan saat start. Permintaan tanpa header `Origin` (curl, antar-server) tetap dilayani — CORS memang hanya berlaku di browser. |
| **Batas body** | 1 MB (`BODY_LIMIT`), turun dari 50 MB. Kiriman lebih besar dijawab 413. |
| **Kekuatan hash** | bcrypt cost 12 (`BCRYPT_COST`) lewat `api/passwordHash.js`. Hash lama cost 10 **ditulis ulang otomatis saat pemiliknya login**, jadi seluruh akun ikut naik tanpa perlu ganti password. |
| **Riwayat login** | Tabel `LoginAudit` + tab **Riwayat Login** di menu Pengguna (OWNER/ADMIN). Mencatat email, hasil, alasan gagal, IP, dan peramban — **tidak pernah password**. Disimpan 90 hari (`LOGIN_AUDIT_RETENTION_DAYS`), dibersihkan otomatis tiap jam. |

**Sebelum deploy:** isi `CORS_ORIGINS` dengan alamat frontend. Tanpa itu, akses dari internet akan ditolak (aman, tapi aplikasi tidak bisa dipakai dari luar jaringan lokal).

**Masih terbuka:** token disimpan di `localStorage`, jadi masih terpapar XSS — memindahkannya ke cookie `httpOnly` adalah perubahan besar dan belum dikerjakan. `npm audit` melaporkan kerentanan `mysql2`; itu bawaan Prisma, tidak dipakai proyek ini (databasenya PostgreSQL), dan perbaikannya menurunkan Prisma ke versi lama — sengaja dibiarkan.

**Lupa password tanpa email:** OWNER/ADMIN reset lewat menu Pengguna; kalau OWNER sendiri lupa, pakai `node scripts/set-password.js <email>` di terminal server. Keduanya sudah otomatis mencabut sesi lama.

### Sumber hak akses
- Tabel **`RolePermission`** (role + module + allowed) = sumber utama, diubah lewat menu Pengguna & Hak Akses.
- `backend/api/rolePolicy.js` memegang **DEFAULT_POLICY** (dipakai untuk modul yang belum punya baris di DB, atau bila DB gagal dibaca) dan cache. Cache di-*invalidate* tiap penyimpanan, jadi **perubahan langsung berlaku tanpa restart**.
- `checkRole('NAMA_MODUL')` membaca daftar role **saat request**, bukan saat file dimuat.
- Modul: `DASHBOARD, PRODUCTION, SALES, INVENTORY, PURCHASING, ACCOUNTING, MASTER_WRITE, MASTER_EMPLOYEES` (bisa diatur) + `USER_ADMIN` (**dikunci** ke OWNER+ADMIN, sengaja tidak bisa diubah agar ADMIN tidak bisa mengunci dirinya sendiri).
- **Frontend**: `GET /api/auth/me` mengirim `modules` milik pengguna. `frontend/src/lib/routeAccess.ts` hanya memetakan halaman → nama modul; daftar role tidak lagi disalin di frontend.
- Guard di `(dashboard)/layout.tsx`: tanpa token → `/login`; halaman terlarang → dialihkan ke halaman pertama yang boleh; tanpa modul sama sekali → layar "Akses ditolak".

## 👥 Menu Pengguna & Hak Akses (`/users`)

Hanya untuk **OWNER dan ADMIN**. Dua tab:
1. **Akun Pengguna** — tambah akun, ubah data/peran, ganti password, aktif/nonaktifkan.
2. **Matriks Hak Akses** — centang modul per peran, simpan, langsung berlaku.

Pengaman yang berlaku di backend (bukan sekadar disembunyikan di UI):

| Aturan | Alasan |
|---|---|
| ADMIN tidak bisa memberi peran OWNER | mencegah ADMIN menaikkan hak aksesnya sendiri |
| ADMIN tidak bisa mengubah/menonaktifkan/reset password akun OWNER | melindungi akun tertinggi |
| Tidak bisa menonaktifkan, menghapus, atau mengubah peran akun sendiri | mencegah terkunci |
| OWNER aktif terakhir tidak bisa dinonaktifkan/diturunkan | selalu ada pemegang akses penuh |
| ADMIN tidak bisa mencabut izin perannya sendiri | mencegah ADMIN mengunci semua ADMIN |
| Baris OWNER & modul `USER_ADMIN` tidak ada di matriks | jalan keluar terakhir harus selalu terbuka |

Menghapus akun = **menonaktifkan** (`isActive: false`), bukan hapus baris, karena akun masih dirujuk SPK/SO/PO sebagai pembuat.

## 🧭 Perilaku Data di Frontend

- Halaman **tidak lagi** menampilkan data contoh saat API kosong/gagal. Gagal muat → `ErrorBanner` + tombol coba lagi. Gagal simpan → alert berisi pesan error asli, modal tetap terbuka, tidak ada record lokal palsu.
- Payload yang dikirim frontend harus cocok dengan controller backend (PO = header + `items[]`, Opname = create lalu `apply`, Pengeluaran = `categoryId` + `accountId`, Sales = `customerId` dipilih dari Master > Rekanan).

---

## 🚧 Potential Next Steps

- [x] Role-based access control di backend (kini bisa diatur dari UI)
- [x] Menu Pengguna & Hak Akses (kelola akun + matriks izin)
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

## 🖨️ Dokumen Cetak

- Identitas perusahaan (nama, alamat, telepon) ada di **`frontend/src/lib/companyInfo.ts`** — satu sumber untuk semua cetakan. Ubah di sana, ketiga dokumen ikut berubah.
- Ditampilkan lewat komponen `components/print/CompanyContact.tsx` (`variant="compact"` untuk dokumen ringkas).
- Dokumen yang ada: **Faktur Penjualan**, **SPK Produksi**, **Slip Upah**. Purchase Order belum punya cetakan sama sekali.
- Mencetak memakai `window.print()` dengan varian `print:` dari Tailwind; tidak ada berkas CSS cetak terpisah.

---

## 🗂️ Master Satuan & Tipe Penjualan

- **Satuan** (`Master > Satuan`) sudah ada sejak awal di tabel `Unit`, kini bisa dikelola dari UI. Kolom **Isi Satuan (`ratioToPcs`)** menentukan konversi ke pcs dan **memengaruhi HPP serta pengurangan stok** — Kodi 20, Lusin 12, sisanya 1.
- **Tipe Penjualan** (`Master > Tipe Penjualan`) dulunya enum terkunci `SalesOrderType`; sekarang tabel `SalesType`. `SalesOrder.orderType` menyimpan **kode**-nya, jadi kode tidak bisa diubah setelah dibuat.
- Menghapus satuan/tipe yang masih dipakai akan **menonaktifkan**, bukan menghapus, supaya riwayat lama tetap terbaca.
- Form Order Penjualan mengambil pelanggan, tipe, dan satuan dari master, serta bisa **menambah pelanggan langsung** dari form (tombol "Baru").
- Konversi satuan ada di `backend/api/unitConversion.js` (dengan cache; `invalidate()` dipanggil tiap satuan diubah). **Sebelumnya rasio ditulis di kode dan hanya mengenali "kodi", sehingga penjualan lusin dihitung 1 pcs — bukan 12 — dan membuat HPP serta stok meleset.**

### Catatan migrasi (penting bila deploy ke database lain)
`prisma db push` untuk perubahan enum → teks akan membuat `DROP COLUMN` dan **menghilangkan data**. Di database ini konversi dilakukan manual lebih dulu agar nilai lama selamat:

```sql
ALTER TABLE winner_sport."SalesOrder" ALTER COLUMN "orderType" DROP DEFAULT;
ALTER TABLE winner_sport."SalesOrder" ALTER COLUMN "orderType" TYPE TEXT USING "orderType"::text;
ALTER TABLE winner_sport."SalesOrder" ALTER COLUMN "orderType" SET DEFAULT 'SATUAN';
```

Lalu isi master tipe: `cd backend && node scripts/seed-sales-types.js` (aman diulang).

---

## 📊 Dashboard & Grafik

- **Semua angka dashboard dihitung dari transaksi nyata.** Sebelumnya `trendData` mengarang 5 dari 6 bulan (`monthSales * (0.8 + sin(i)*0.2)`); kini dikelompokkan per bulan dari `salesOrder` + `expense`.
- Bulan tanpa transaksi tampil sebagai 0, bukan disembunyikan atau ditebak. Bila baru satu bulan yang berisi, grafik memberi catatan sejak kapan data tersedia.
- Item pesanan custom tanpa produk master **tidak punya HPP standar**, jadi tidak dihitung — lihat `coverage` di respons `/dashboard/stats` untuk tahu berapa item yang HPP-nya sudah lengkap. Kalau banyak item tanpa HPP, laba kotor akan terlihat lebih besar dari sebenarnya.
- Warna grafik ada di `frontend/src/lib/chartTheme.ts`. Terang dan gelap punya corak sendiri dan **keduanya sudah lolos pemeriksaan palet** (kelerengan, kroma, keterbedaan bagi buta warna, kontras). Kalau menambah seri, validasi ulang — jangan dikira-kira.
- Urutan warna seri tetap (merah, biru, amber) dan mengikuti entitas, bukan peringkat.
- "Order Penjualan Terbaru" sudah dihapus dari dashboard atas permintaan.

---

## ☁️ Deploy ke Vercel

Monorepo ini jadi **dua proyek Vercel terpisah** dari repositori yang sama.

### 1. Proyek Backend
- **Root Directory:** `backend`
- Konfigurasinya di `backend/vercel.json`: hanya `api/index.js` yang dijadikan fungsi, dan semua jalur diarahkan ke situ. Setelah deploy pertama, **cek daftar Functions di dasbor** — kalau muncul fungsi lain seperti `api/db`, berarti deteksi otomatis masih jalan dan `vercel.json` perlu disesuaikan.
- `postinstall` menjalankan `prisma generate`.
- Environment Variables (lihat `backend/.env.example`): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, dan **`CORS_ORIGINS` wajib diisi** dengan alamat frontend.

### 2. Proyek Frontend
- **Root Directory:** `frontend`
- Environment Variable: `NEXT_PUBLIC_API_URL` = `https://<backend>.vercel.app/api` (**harus diakhiri `/api`**).
- Urutannya: deploy backend dulu untuk mendapat alamatnya, isi `NEXT_PUBLIC_API_URL` di frontend, lalu isi `CORS_ORIGINS` di backend dengan alamat frontend, dan deploy ulang keduanya.

### Penyesuaian yang sudah dilakukan untuk serverless
| Masalah | Penanganan |
|---|---|
| **Cache hak akses bisa basi** | `invalidate()` hanya membersihkan cache di instance yang memanggilnya. Di serverless instance lain tidak ikut tahu, sehingga izin yang sudah dicabut bisa terus dipakai. Kini cache punya masa berlaku (`ROLE_POLICY_TTL_SECONDS`, bawaan 20 detik; satuan 60 detik), jadi instance lain menyusul sendiri. |
| **`setInterval` tidak jalan** | Pembersihan catatan login dititipkan pada lalu lintas biasa lewat middleware, paling sering sekali per jam per instance. |
| **`app.listen()`** | Hanya dipanggil bila `process.env.VERCEL` kosong. Di Vercel, `app` diekspor sebagai handler. |
| **Koneksi database habis** | Klien Prisma disimpan di `globalThis` agar dipakai ulang antar-permintaan, dan ukuran pool otomatis jadi 1 di Vercel (`DB_POOL_MAX`). |
| **Peringatan `pg`** | `search_path` kini dipasang lewat parameter koneksi (`options`), bukan query tanpa `await` setelah koneksi jadi. Peringatan deprecation lama ikut hilang. |

### Yang perlu diperhatikan
- **Cold start.** Permintaan pertama setelah idle lebih lambat karena Prisma perlu dimuat.
- **Perubahan hak akses** berlaku seketika di instance yang memprosesnya, dan paling lama ~20 detik di instance lain.
- **`prisma db push` tidak otomatis.** Perubahan skema tetap dijalankan manual dari komputer Anda memakai `DIRECT_URL`.
- Supabase punya batas koneksi; kalau muncul error koneksi saat ramai, turunkan `DB_POOL_MAX` atau naikkan batas di Supabase.

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
3. **Prisma schema** → `backend/prisma/schema.prisma`. Proyek ini **tidak memakai folder migrations**; perubahan skema didorong dengan `npx prisma db push` lalu `npx prisma generate`. Sebelum push, periksa SQL-nya dulu: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
4. **Env file** → `backend/.env` *(tidak di-push)* — isi: `DATABASE_URL` Supabase + `JWT_SECRET` **acak baru** (buat: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
5. **Peringatan `pg` saat backend start** (`client.query() ... already executing a query`) berasal dari `backend/api/db.js` baris 16-19: handler event `connect` memanggil `client.query('SET search_path ...')` tanpa `await`. Belum diperbaiki — menyentuh `search_path` berisiko, sebaiknya ditangani terpisah sebelum upgrade ke `pg@9`.
6. **Seed** (`backend/scripts/seed.js`) tidak lagi memakai password tetap: pakai env `SEED_PASSWORD` atau buat acak dan tampilkan sekali. User yang sudah ada tidak diubah passwordnya.
7. **seed_transactions.js** → hanya untuk dummy data development, jangan jalankan di production
