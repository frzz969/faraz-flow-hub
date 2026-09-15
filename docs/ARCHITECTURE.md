# FARAZZ FLOW

## As-Built System Architecture

**Version:** 1.0 (as-built correction — see note below)
**Project Type:** Enterprise Logistics & Supply Chain Operations Platform

> **Catatan koreksi as-built (13 Sep 2026, sinkron restruktur):**
> Restruktur memindahkan frontend `src/` → `frontend/src/`
> (`vite.config.ts: srcDirectory`, alias `@/*`, css `components.json`),
> backend `routes/v1/` → `controllers/` (20 file) dengan
> `services/crud|workflow|audit`, `repositories/db|pool`,
> `config/config.ts`, `validators/common.ts`, `database/index.ts`, dan
> barrel `modules/{auth,shipments,orders,warehouse,fleet,business,
> finance,analytics}/index.ts`; `lib/` tersisa
> `errors|logger|session|security|realtime`; database bertambah
> `seeds/README.md`, `seeds/schema.sql`, dan `schema.sql` (snapshot
> gabungan 001-009). Direktori lama `src/` dan `backend/src/routes/`
> sudah tidak dipakai. Versi tetap **1.0**; isi `docs/PRD.md` tidak
> diubah selain sinkron path §9/§12.

---

## 1. Architecture Overview

FARAZZ FLOW menggunakan arsitektur full-stack terpisah:

```text
                         FARAZZ FLOW
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        FRONTEND                            BACKEND
  React + TS (frontend/src/)        Node.js + TS (backend/src)
             │                                 │
             │            REST API              │
             └───────────────┬─────────────────┘
                             │
                          MySQL
                             │
                    Persistent Database
```

Frontend bertanggung jawab terhadap UI dan interaksi pengguna.

Backend bertanggung jawab terhadap business logic, authentication,
authorization, validation, API, dan komunikasi dengan database.

MySQL bertanggung jawab terhadap penyimpanan data aplikasi.

---

## 2. Technology Stack

### Frontend (aktual)

* React 19 + TypeScript
* TanStack Router / Start — **file-based routing** di `frontend/src/routes/*.tsx`
* Vite 8, build via **nitro 3 beta** dengan target default **cloudflare**,
  seluruhnya dibungkus `@lovable.dev/vite-tanstack-config` v2
  (lihat `vite.config.ts`: `srcDirectory: "frontend/src"`, alias
  `@/* → frontend/src/*`, server entry TanStack Start ke
  `frontend/src/server.ts`). **Bukan Vercel.**
* Tailwind CSS 4, shadcn/ui + Radix UI
* TanStack Query (server state), React Hook Form + Zod (form),
  Recharts, Sonner, i18n ID / EN

### Backend (aktual)

* Node.js ≥ 20, TypeScript, Express 5
* REST API di bawah `/api/v1`, Server-Sent Events (SSE)
* Session authentication (DB-backed, hashed token) + CSRF double-submit
* RBAC server-side (`requirePermission`, `super_admin` bypass)
* Zod validation per router, generic CRUD factory (`services/crud.ts`)
* Rate limiting (`express-rate-limit`) + account lockout
* Audit & security logging (`services/audit.ts` → `audit_logs`,
  `security_events`, `login_attempts`)

### Database (aktual)

* MySQL 8 / MariaDB via `mysql2/promise` pool
  (`repositories/pool.ts`, `repositories/db.ts`)
* Migrasi SQL bernomor `database/migrations/001-009.sql`,
  dijalankan via `backend/scripts/migrate.ts`
* Snapshot gabungan `database/schema.sql` + `database/seeds/schema.sql`
  (`database/seeds/README.md` menjelaskan pemakaian)
* Seed demo via `backend/scripts/seed.ts`, backup via
  `backend/scripts/backup.ts`
* Soft delete (`deleted_at`) sebagai default; foreign key + transaksi
  di query yang membutuhkan

---

## 3. Project Structure

> Peta navigasi per domain: [`docs/STRUCTURE.md`](STRUCTURE.md).
> Kontrak endpoint: [`docs/API.md`](API.md).

### A. Struktur Konseptual / Ideal — JANGKA PANJANG, bukan fisik saat ini

Diagram di bawah adalah struktur ideal/generik dari pengguna
(`frontend/src/pages/...`, layer `controllers/repositories/validators/
modules`, `database/seeds/` + `schema.sql` tunggal). Ini **bukan**
kondisi repo saat ini — disimpan sebagai referensi arah jangka panjang
bila refactor besar disetujui. Jangan mengacu ke diagram ini untuk
menavigasi kode hari ini; gunakan blok B.

```text
FARAZZ-FLOW/                              # ← IDEAL, bukan fisik saat ini
│
├── frontend/
│   ├── src/
│   │   ├── components/  layouts/
│   │   ├── pages/                        # dashboard/ operations/ warehouse/
│   │   │                                # fleet/ business/ finance/
│   │   │                                # analytics/ workspace/ admin/
│   │   ├── services/api.ts  hooks/  stores/
│   │   ├── schemas/  types/  i18n/  main.tsx
│   ├── public/  package.json
├── backend/
│   ├── src/
│   │   ├── controllers/  services/  repositories/
│   │   ├── routes/  middleware/  validators/
│   │   ├── modules/                      # auth/ shipments/ orders/
│   │   │                                # warehouse/ fleet/ business/ ...
│   │   ├── config/  database/  server.ts
│   ├── uploads/  package.json
├── database/
│   ├── migrations/  seeds/  schema.sql   # ← tunggal + seeds: ideal
├── docs/  .env.example  .gitignore  README.md
```

### B. Struktur Fisik Aktual — AKTUAL (terverifikasi di disk)

```text
FARAZZ-FLOW/
│
├── frontend/                     # FRONTEND (dulu root src/)
│   ├── src/
│   │   ├── routes/               # TanStack file-router (40 .tsx + admin/5)
│   │   │   ├── __root.tsx  $.tsx  index.tsx  login.tsx
│   │   │   ├── admin/            # index/users/roles/company/audit.tsx
│   │   │   ├── shipments.tsx  shipments-create.tsx  orders.tsx
│   │   │   ├── delivery.tsx  exceptions.tsx  returns.tsx  tracking.tsx
│   │   │   ├── warehouses.tsx  inventory.tsx  inbound.tsx  outbound.tsx
│   │   │   ├── sorting.tsx  stock-movement.tsx
│   │   │   ├── vehicles.tsx  drivers.tsx  routes.tsx  dispatch.tsx
│   │   │   ├── maintenance.tsx
│   │   │   ├── customers.tsx  suppliers.tsx  service-types.tsx
│   │   │   ├── pricing.tsx  contracts.tsx
│   │   │   ├── billing.tsx  invoices.tsx  payments.tsx  cod.tsx
│   │   │   ├── approvals.tsx  tasks.tsx  documents.tsx  activity.tsx
│   │   │   ├── analytics.tsx  reports.tsx  profile.tsx
│   │   │   ├── settings.tsx  help.tsx
│   │   │   └── ... (lihat frontend/src/routeTree.gen.ts)
│   │   ├── components/
│   │   │   ├── farazz/           # app-layout, data-table, page-header,
│   │   │   │                    # status-badge, confirm-delete, primitives,
│   │   │   │                    # export-button, global-search, timeline
│   │   │   └── ui/               # shadcn/radix primitives
│   │   ├── lib/farazz/
│   │   │   ├── api.ts            # typed client + envelope + CSRF store
│   │   │   ├── store.tsx         # client/UI state
│   │   │   ├── session.tsx       # session context (me/login/logout)
│   │   │   ├── data.ts           # dataset demo (fallback offline)
│   │   │   └── export.ts         # helper export CSV client-side
│   │   ├── router.tsx            # createRouter(routeTree)
│   │   ├── routeTree.gen.ts      # generated — JANGAN edit manual
│   │   ├── server.ts             # SSR error wrapper (server.entry)
│   │   ├── start.ts              # client entry TanStack Start
│   │   └── styles.css            # css entry (components.json)
│   ├── public/                   # favicon.ico, robots.txt (dulu root public/)
│
├── backend/
│   ├── src/
│   │   ├── server.ts             # listen + graceful shutdown
│   │   ├── app.ts                # helmet/CORS/JSON/cookie/log + mount v1
│   │   ├── config/
│   │   │   └── config.ts         # typed env (PORT, DB_*, SESSION_*, ...)
│   │   ├── middleware/           # tetap: auth|csrf|permissions|rate-limit
│   │   │   ├── auth.ts           # attachUser / requireAuth
│   │   │   ├── csrf.ts           # double-submit ffz_csrf + x-csrf-token
│   │   │   ├── permissions.ts    # requirePermission + super_admin bypass
│   │   │   └── rate-limit.ts     # authRateLimiter 20/menit
│   │   ├── lib/                  # sisa: errors|logger|session|security|realtime
│   │   │   ├── errors.ts         # ApiError + envelope error middleware
│   │   │   ├── session.ts        # ffz_session (HttpOnly, SameSite=Lax)
│   │   │   ├── security.ts       # hash/verify password (scrypt)
│   │   │   ├── logger.ts
│   │   │   └── realtime.ts       # SSE pub/sub + heartbeat
│   │   ├── services/
│   │   │   ├── crud.ts           # makeCrud: GET/GET:id/POST/PUT/DELETE
│   │   │   ├── workflow.ts       # SHIPMENT/ORDER/DELIVERY/RETURN/
│   │   │   │                    # EXCEPTION flows + transition helpers
│   │   │   └── audit.ts          # auditLog / recordLoginAttempt / securityEvent
│   │   ├── repositories/
│   │   │   ├── db.ts             # query/execute/pingDb/closePool
│   │   │   └── pool.ts           # mysql2 pool
│   │   ├── validators/
│   │   │   └── common.ts         # schema zod bersama
│   │   ├── database/
│   │   │   └── index.ts          # bootstrap/akses DB backend
│   │   ├── modules/              # barrel per domain (index.ts):
│   │   │   ├── auth/  shipments/  orders/  warehouse/
│   │   │   ├── fleet/  business/  finance/  analytics/
│   │   ├── controllers/          # 20 FILE (dulu routes/v1/):
│   │   │   ├── health.ts         # GET /health, /health/db
│   │   │   ├── auth.ts           # login(public) + me/logout/...
│   │   │   ├── admin.ts          # users/roles/permissions/audit
│   │   │   ├── customers.ts  shipments.ts  orders.ts
│   │   │   ├── deliveries.ts  exceptions.ts  returns.ts
│   │   │   ├── business.ts       # suppliers/service-types/pricing/contracts
│   │   │   ├── warehouse.ts      # warehouses/zones/inventory/inbound/
│   │   │   │                    # outbound/sorting
│   │   │   ├── fleet.ts          # vehicles/drivers/routes/
│   │   │   │                    # dispatches/maintenance
│   │   │   ├── finance.ts        # billing/bill-items/payments/cod
│   │   │   ├── workspace.ts      # approvals/tasks/documents
│   │   │   ├── notifications.ts  # inbox personal + unread-count
│   │   │   ├── realtime.ts       # SSE GET /realtime (+ /ping)
│   │   │   ├── files.ts          # upload base64 + versions/download
│   │   │   ├── import-export.ts  # CSV export/import
│   │   │   ├── reports.ts        # agregasi read-only
│   │   │   └── monitoring.ts     # overview/database/activity/...
│   │   └── routes/               # KOSONG (sisa dir v1, tak dipakai)
│   ├── scripts/
│   │   ├── migrate.ts  seed.ts  backup.ts
│   │   └── smoke.ps1
│   ├── uploads/                  # file dokumen (git-ignored)
│   └── package.json              # farazz-flow-backend, express 5, zod, tsx
│
├── database/
│   ├── migrations/               # 001_auth_core … 009_soft_deletes.sql
│   ├── seeds/
│   │   ├── README.md             # cara pakai seed
│   │   └── schema.sql            # snapshot seed
│   └── schema.sql                # snapshot gabungan 001-009
│
├── docs/
│   ├── PRD.md          # WHAT (§9/§12 path disinkron ke struktur baru)
│   ├── ARCHITECTURE.md # HOW (file ini, as-built)
│   ├── STRUCTURE.md    # PETA navigasi per domain (fisik aktual)
│   └── API.md          # CONTRACT
│
├── .env.example
├── .gitignore
├── vite.config.ts      # srcDirectory frontend/src + alias @/*
├── package.json        # frontend: vite 8, nitro beta, tanstack start
└── README.md
```

> Direktori lama `src/` dan `backend/src/routes/` sudah tidak dipakai
> (tertulis di sini hanya sebagai catatan migrasi, bukan acuan):
> `src/*` → `frontend/src/*`, `public/*` → `frontend/public/*`,
> `backend/src/routes/v1/*` → `backend/src/controllers/*`.

---

## 4. Frontend Architecture (as-built)

Alur aktual:

```text
frontend/src/routes/*.tsx (file-router)
  ↓
frontend/src/components/farazz/* + ui/*
  ↓
TanStack Query (server state) + frontend/src/lib/farazz/store.tsx (client state)
  ↓
frontend/src/lib/farazz/api.ts (typed client) / session.tsx
  ↓
REST API http://localhost:4100/api/v1 (+ demo fallback)
```

* **Routes:** file-based; `frontend/src/router.tsx` membangun router dari
  `frontend/src/routeTree.gen.ts` (generated). `__root.tsx` = layout global,
  `$.tsx` = 404.
* **API client** (`lib/farazz/api.ts:20-98`): `API_BASE` dari
  `VITE_API_URL` (default `http://localhost:4100/api/v1`),
  `credentials: "include"`, header `x-csrf-token` otomatis untuk
  non-GET dari token yang diterima saat login; `ApiError` membawa
  `status/code/network`.
* **Session** (`session.tsx`): `login()` menyimpan CSRF token,
  `me()` memuat user, `logout()` menghapus token.
* **Demo fallback:** `pingBackend()` → jika backend tak terjangkau,
  UI memakai `data.ts` lokal + pill **Live API / Demo**.
* **SSR/server:** `frontend/src/server.ts` = error wrapper SSR yang dipakai
  sebagai `server.entry` nitro; `frontend/src/start.ts` = client entry.

---

## 5. Backend Architecture (as-built)

Backend memakai layer `controllers/` (endpoint + zod),
`services/` (makeCrud, workflow, audit), `repositories/` (akses DB),
`validators/` (schema bersama), dan barrel `modules/` per domain.
Alur request aktual:

```text
HTTP Request
  ↓
app.ts mount (/api/v1/<router>)      — csrfProtect global KECUALI /health
  ↓                                     dan POST /auth/login (penerbit token)
attachUser (baca ffz_session → req.user)
  ↓
requireAuth (401 jika anonim)
  ↓
requirePermission("<module>.<aksi>") — 403 jika kurang; super_admin lolos
  ↓
Zod safeParse body/query             — 400 BAD_REQUEST + flatten details
  ↓
makeCrud handler / workflow transition / raw query (mysql2 pool)
  ↓
auditLog / securityEvent (best-effort, tabel audit_logs dkk.)
  ↓
success(res, data) → { success: true, data }
```

* `makeCrud` (`services/crud.ts`) menghasilkan 5 endpoint baku per
  resource: `GET /`, `GET /:id`, `POST /`, **`PUT /:id`**,
  `DELETE /:id`. Komentar kode menyebut `update`, tetapi permission
  yang benar-benar dipakai adalah **`.edit`** (lihat §6).
* List mendukung `q` (LIKE multi-kolom), filter enum (`?status=`),
  filter tanggal (`?from_<col>=&to_<col>=`), `limit` (default 50,
  maks 500) + `offset`, plus hitungan `total`.
* Error selalu lewat `errorMiddleware` → envelope
  `{ success:false, error:{code,message,details?} }`.

---

## 6. API Conventions (as-built)

Base: `/api/v1` (lihat `docs/API.md` untuk kontrak penuh).

### Envelope sukses

```json
{ "success": true, "data": { "rows": [], "total": 0, "limit": 50, "offset": 0 } }
{ "success": true, "data": { "row": {} } }
{ "success": true, "data": { "id": 12 } }
{ "success": true, "data": { "updated": true } }
{ "success": true, "data": { "deleted": true } }
{ "success": true, "data": { "user": {}, "csrfToken": "..." } }
```

### Envelope error

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "shipment not found" } }
```

Kode aktual (`backend/src/lib/errors.ts` + `controllers/health.ts`):

```text
BAD_REQUEST (400, validasi Zod / transisi ilegal / payload salah)
UNAUTHORIZED (401, belum login / kredensial salah / akun terkunci)
FORBIDDEN (403, tanpa permission / CSRF hilang & salah)
NOT_FOUND (404, row / route tidak ada)
CONFLICT (409, stok kurang / approval sudah diputus)
TOO_MANY_REQUESTS (429, rate-limit auth)
DB_UNAVAILABLE (503, hanya GET /health/db saat DB down)
INTERNAL_ERROR (500, fallback; + INVALID_JSON untuk body malformed)
```

### Update & delete (as-built)

* Update memakai **`PUT /:id`** dengan permission **`<module>.edit`**
  (bukan PATCH, bukan `.update`).
* Delete default = **soft** (`deleted_at = NOW()`); list/detail
  otomatis memfilter `deleted_at IS NULL`.
* **Hard delete** (tanpa `deleted_at`): `service-types`,
  `pricing` (`softDelete: false`), `warehouse-zones`, `bill-items`.
* PATCH hanya untuk **transisi status** (`/:id/status`,
  `exceptions/:id/resolve`, `approvals/:id/decide`), **stok**
  (`inventory POST :id/stock`), dan aksi admin tertentu.

---

## 7. Domain Modules → permission module aktual

| Area | Router/mount | `module` untuk permission |
|---|---|---|
| Customers | `/customers` | `customers` |
| Shipments | `/shipments` | `shipments` |
| Orders | `/orders` | `orders` |
| Deliveries | `/deliveries` | `delivery` (singular — anomali, lihat §11) |
| Exceptions | `/exceptions` | `shipments` (anomali) |
| Returns | `/returns` | `orders` (anomali) |
| Suppliers | `/suppliers` | `suppliers` |
| Service types / Pricing | `/service-types`, `/pricing` | `settings` (anomali, hard delete) |
| Contracts | `/contracts` | `customers` (anomali) |
| Warehouses / Inbound / Outbound / Sorting | `/warehouses`, `/inbound`, `/outbound`, `/sorting` | `warehouse` |
| Inventory | `/inventory` | `inventory` |
| Vehicles / Drivers / Routes / Dispatches / Maintenance | `/vehicles`... | `fleet` |
| Billing / Payments / COD | `/billing`, `/payments`, `/cod` | `finance` |
| Approvals / Tasks / Documents | `/approvals`, `/tasks`, `/documents` | `settings` (anomali) |
| Admin | `/admin/...` | `admin.users.*`, `admin.roles.*`, `admin.audit.*` |
| Zones, bill-items, notifications, realtime, files, import-export, reports, monitoring | mount masing-masing | auth-only (tanpa `requirePermission`; import CSV butuh `settings.view`) |

Pola permission CRUD: `<module>.view | .create | .edit | .delete`.
Admin memakai `admin.users.view|create|update|delete`,
`admin.roles.view|update|delete`, `admin.audit.view`.

---

## 8. Business Flow (tetap)

```text
Order → Shipment → Warehouse (Inbound/Sorting/Inventory/Outbound)
  → Fleet/Dispatch → Delivery → Billing/Payment/COD → Reports
```

Business, Workspace, dan Admin berjalan sebagai modul pendukung.

---

## 9. State Machine (as-built, `backend/src/services/workflow.ts`)

```text
SHIPMENT_FLOW:
  pending → booked | cancelled | exception
  booked → picked_up | cancelled | exception
  picked_up → in_transit | exception
  in_transit → out_for_delivery | exception
  out_for_delivery → delivered | failed_attempt | exception
  exception → out_for_delivery | cancelled
  delivered / cancelled = terminal

ORDER_FLOW:   draft → confirmed → processing → completed (+ cancelled)
RETURN_FLOW:  requested → approved|rejected → picked_up → returned
DELIVERY_FLOW: scheduled → out_for_delivery → delivered|failed_attempt|returned
EXCEPTION_FLOW: open → reviewing|resolved|closed
DISPATCH (controllers/fleet.ts): planned → dispatch → on_route → completed (+ cancelled)
BILLING (controllers/finance.ts): draft|sent|partial|settled|cancelled|overdue (bebas, bukan flow ketat)
TASK (controllers/workspace.ts): todo|in_progress|done|blocked
APPROVAL: pending → approved|rejected via PATCH /:id/decide (409 jika sudah diputus)
```

Efek samping: delivery `delivered` menandai shipment linked
`delivered`; exception `resolved` mengembalikan shipment ke
`out_for_delivery`; dispatch `dispatch/completed` mengubah status
vehicle/driver; billing `settled/partial` mengisi `paid_at`.

---

## 10. Authentication & Session (as-built)

```text
POST /auth/login (public + rate-limit)
  ↓ Set-Cookie ffz_session (HttpOnly, SameSite=Lax) + ffz_csrf (readable)
  ↓ body { user, csrfToken }
GET /auth/me → { user } (+ touchSession)
  ↓
POST /auth/change-password / revoke-sessions / logout (CSRF wajib)
```

* **Session** (`backend/src/lib/session.ts`): cookie `ffz_session`, HttpOnly,
  SameSite=Lax, Secure hanya di production; DB hanya menyimpan
  SHA-256 token (`sessions.token_hash`); TTL default **12 jam**
  (`SESSION_TTL_HOURS`), **168 jam** bila `remember: true`;
  sesi kedaluwarsa di-GC saat login; `revoke-sessions` mencabut semua
  sesi lain (`{ revoked: n }`).
* **CSRF double-submit** (`backend/src/middleware/csrf.ts`): cookie `ffz_csrf`
  = `token.signature` (HMAC-SHA256, `CSRF_SECRET`); client menggemakan
  token mentah di header **`x-csrf-token`**; GET/HEAD/OPTIONS bebas;
  login dikecualikan karena ia yang menerbitkan token; di production
  ada cek Origin/Referer.
* **Rate-limit** (`backend/src/middleware/rate-limit.ts`): endpoint auth
  **20 request/menit/IP** (`AUTH_RATE_LIMIT_MAX/WINDOW_MS`,
  header `draft-7`, body `TOO_MANY_REQUESTS`).
* **Lockout** (`controllers/auth.ts`): gagal **5x**
  (`LOGIN_MAX_FAILED`) → terkunci **15 menit**
  (`LOGIN_LOCK_MINUTES`); email tak dikenal memakai dummy-hash
  agar timing serangan tidak bocor; semua percobaan dicatat di
  `login_attempts` + `security_events`.
* Password: scrypt (`backend/src/lib/security.ts`); ganti password min 8 char
  + huruf + angka; tidak memaksa logout sesi lain (by design).

---

## 11. RBAC (as-built)

Role contoh: `super_admin`, operations/warehouse/fleet/finance/CS/driver, dsb.
(real: `roles.code` + `role_permissions` → `permissions.code`).

* Pola: `{module}.view|create|edit|delete` + `admin.*`.
* **`super_admin` bypass** semua `requirePermission`
  (`backend/src/middleware/permissions.ts:39`).
* Backend sumber kebenaran; frontend hanya gating tampilan.
* **Anomali permission yang disengaja (jangan "dirapikan" tanpa migrasi):**
  `approvals/tasks/documents/service-types/pricing → settings.*`;
  `deliveries → delivery.*` (singular); `exceptions → shipments.*`;
  `returns → orders.*`; `contracts → customers.*`.
* Auth-only tanpa permission: zones, bill-items, notifications,
  realtime/SSE, files, reports, monitoring (import CSV: `settings.view`).

---

## 12. Database Architecture (as-built)

```text
database/migrations/001_auth_core.sql … 009_soft_deletes.sql
backend/scripts/migrate.ts   # up/down migrasi bernomor
backend/scripts/seed.ts      # demo users/roles/shipments/...
backend/scripts/backup.ts    # backup
```

* Snapshot `database/schema.sql` (gabungan 001-009) dan
  `database/seeds/` (`README.md` + `schema.sql`) tersedia sebagai
  referensi/seed; migrasi bernomor tetap sumber kebenaran skema.
* Perintah: `npm run migrate`, `migrate:down`, `seed`, `backup`
  (dari `backend/package.json`, via `tsx`).
* `GET /health/db` = readiness check → `503 DB_UNAVAILABLE` bila down.

---

## 13. Frontend Demo Fallback (tetap, aktual)

```text
Frontend → pingBackend() (/health)
   ├── OK → Live API (cookie sesi mengalir, SameSite=Lax)
   └── gagal → Demo Store (frontend/src/lib/farazz/data.ts) + pill "Demo"
```

Retry berkala; `ApiError.network` menandai mode offline.

---

## 14. Realtime (as-built)

* **SSE**: `GET /api/v1/realtime` (auth, `text/event-stream`,
  event awal `connected { user, online }`); heartbeat global via
  `startHeartbeat()` di `app.ts`; `GET /api/v1/realtime/ping`
  mem-publish `ping` dan mengembalikan `{ ok, online }`.
* Event: `shipment:status`, `exception:status`,
  `notification:new`, `approval:decided`, `ping`.
* Konsumen: notifikasi personal, update operasional, badge.
  Tidak ada WebSocket — SSE satu arah saja.

---

## 15. File Upload (as-built)

```text
Frontend (base64 JSON) → POST /api/v1/files → backend/uploads/<yyyymm>/<hex>.bin
                                              + documents / document_versions
```

* Body zod: `{ title, category?, fileName, mimeType?, dataBase64, changeNote? }`,
  base64 ≤ ~8 MiB; respons `{ id, fileName, size }`.
* Versi: `GET /files/:id/versions`, `POST /files/:id/version`
  (bump version + audit); unduh: `GET /files/:id/download`
  (attachment). Metadata dokumen juga CRUD via `/documents`.
  S3 bukan bagian v1.

---

## 16. Import / Export & Reports / Monitoring (as-built)

* **Export CSV**: `GET /import-export/export/:resource/csv`
  (`customers|suppliers|shipments|inventory|vehicles`, BOM + header
  `attachment`). **Import**: `POST /import-export/import/:resource/csv`
  `{ csv }` hanya `customers|inventory` (perm `settings.view`) →
  `{ imported, errors: [{row, reason}] }`.
* **Reports** (read-only, auth): `shipments-by-status`,
  `shipments-timeline (?days)`, `revenue (?year)`, `top-routes`,
  `inventory-summary`, `usage-overview` (`{ kpis }` — dipakai dashboard),
  `transport-efficiency`.
* **Monitoring** (read-only, auth): `overview` (uptime, pid, node,
  env, db latency, SSE online), `database` (information_schema +
  counts), `activity (?hours)`, `security-events (?limit)`,
  `health/live`.

---

## 17. Security Architecture (as-built)

```text
Helmet (+CORS credentials) / Session HttpOnly SameSite=Lax /
CSRF double-submit / RBAC + super_admin bypass / Zod /
auth rate-limit 20/menit + lockout 5x/15m / scrypt /
audit_logs + security_events + login_attempts /
JSON limit ~12MB (base64) / least-privilege DB user
```

Frontend tidak pernah menjadi satu-satunya enforcement.

---

## 18. Environment Configuration (aktual, `backend/src/config/config.ts`)

```text
PORT=4100  NODE_ENV=development  APP_URL=http://localhost:4100
CORS_ORIGINS=http://localhost:5173
DB_HOST=127.0.0.1  DB_PORT=3306  DB_USER=root  DB_PASSWORD=  DB_NAME=farazz_flow
SESSION_TTL_HOURS=12  SESSION_SECRET=  CSRF_SECRET=
LOGIN_MAX_FAILED=5  LOGIN_LOCK_MINUTES=15
AUTH_RATE_LIMIT_MAX=20  AUTH_RATE_LIMIT_WINDOW_MS=60000
UPLOAD_DIR=./uploads  UPLOAD_MAX_MB=10
LOG_LEVEL=info
VITE_API_URL=http://localhost:4100/api/v1   # sisi frontend
```

Secret tidak di-commit; `.env.example` hanya template.

---

## 19. Deployment Architecture (as-built — tanpa klaim Vercel)

```text
Frontend (Vite 8 + TanStack Start, nitro beta, target cloudflare default)
  — dibangun dari @lovable.dev/vite-tanstack-config, server.entry frontend/src/server.ts —
        │
        │  REST /api/v1 + SSE (cookie SameSite=Lax)
        ↓
Backend (Node.js, backend/src/server.ts) ──→ MySQL/MariaDB
```

* Klaim deploy Vercel **dihapus** — tidak ada konfigurasi Vercel di repo.
* Target build aktual mengikuti `vite.config.ts` + preset Lovable
  (nitro beta, cloudflare default). Jalur Lovable/cleanup dimiliki
  tim lain — **dokumen ini tidak mengubah kode tersebut**; jika preset
  dihapus di masa depan, perbarui §2/§19 ini (TODO).
* Development:

```text
Frontend  http://localhost:5173
Backend   http://localhost:4100
MySQL     localhost:3306
API       http://localhost:4100/api/v1
```

---

## 20. Development Strategy (aktual)

Fase mengikuti kode yang ada: file-router + komponen farazz →
`makeCrud` routers + zod → migrasi 001-009 + seed →
session/CSRF/RBAC → flow Order→…→Finance → SSE/workspace/files/CSV →
smoke (`backend/scripts/smoke.ps1`, `npm test` di backend).

---

## 21. Testing Architecture (aktual)

* Backend: `npm test` (`tsx --test tests/**/*.test.ts`) + typecheck
  `tsc --noEmit`; smoke E2E via `backend/scripts/smoke.ps1`.
* Frontend: validasi via build Vite + TanStack Query caching;
  demo fallback menutupi backend-off.
* Acceptance mengikuti PRD (state machine aktual §9, dsb.).

---

## 22. Non-Functional Requirements

Responsif desktop/tablet/mobile; browser modern; pagination
(`limit/offset/total`); caching TanStack Query; envelope konsisten;
secure session + RBAC + audit; i18n ID/EN; soft delete default;
upload lokal; logging; monitoring dasar; SSE heartbeat; tanpa
animasi/video berat.

---

## 23. Out of Scope v1

SSO/OAuth, GPS/live maps, payment gateway, email/WhatsApp/SMS,
S3 storage, PDF/XLS generation, multi-tenancy, editable workflow
editor, AI "Ask FARAZZ" (placeholder bila perlu).

---

## 24. Documentation

```text
docs/PRD.md           # WHAT — tidak diubah
docs/ARCHITECTURE.md  # HOW — file ini (as-built 1.0, 13 Sep 2026)
docs/STRUCTURE.md     # MAP — peta navigasi per domain (fisik aktual)
docs/API.md           # CONTRACT — endpoint, envelope, auth, error
```

---

## 25. Final Architecture Principle

```text
Simple UI + Clear As-Built Architecture + Real Business Flow
+ REST API + MySQL + Session/CSRF/RBAC + SSE + Demo Fallback
= Portfolio-Ready Enterprise Application
```

Stack utama **tidak diubah**: React + TypeScript, Node.js +
TypeScript, MySQL. Laravel bukan bagian v1.

**Status:** Architecture as-built — siap jadi acuan implementasi
tanpa mengubah isi PRD.
