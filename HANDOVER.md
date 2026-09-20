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

## 🚧 Potential Next Steps

- [ ] Role-based access control (admin vs staff)
- [ ] Export laporan Excel (exportUtils.ts sudah siap, tinggal integrasi)
- [ ] Alert notifikasi stok minimum (stok < minimumStock)
- [ ] Pagination untuk tabel data besar
- [ ] Deploy ke VPS via PM2 (`ecosystem.config.js` sudah ada di root)
- [ ] Unit testing backend controllers

---

## ⚠️ Catatan Penting

1. **Jangan hapus** `frontend/public/logo.png` dan `logo-emblem.png` — dipakai sidebar & login page
2. **Backend harus jalan dulu** sebelum frontend bisa fetch data
3. **Prisma schema** → `backend/prisma/schema.prisma` — jika ubah schema: `npx prisma migrate dev`
4. **Env file** → `backend/.env` *(tidak di-push)* — isi: `DATABASE_URL` Supabase + `JWT_SECRET`
5. **seed_transactions.js** → hanya untuk dummy data development, jangan jalankan di production
