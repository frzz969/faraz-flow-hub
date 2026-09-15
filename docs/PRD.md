# PRD — FARAZZ FLOW HUB
**Enterprise Logistics & Supply Chain Operations Platform**

- Versi: 1.0 (Draft)
- Tanggal: 13 Sep 2026
- Status: Draft untuk review
- Sumber: `README.md`, `docs/SPEC.md`, implementasi `src/`, `backend/src/`, `database/migrations/`
- Bahasa UI: EN / ID (bilingual)

---

## 1. Ringkasan Eksekutif

FARAZZ FLOW adalah platform operasi internal enterprise untuk perusahaan logistik / distribusi / supply-chain. Bukan landing page, bukan tracker sederhana.

Fungsi inti: mengelola siklus **Order → Shipment → Warehouse (Inbound/Sorting/Outbound/Inventory) → Fleet/Dispatch → Delivery → Billing/Payment/COD → Analytics**, plus modul pendukung **Business (Customer/Supplier/Pricing/Contract), Workspace (Approval/Task/Document/Activity), dan Admin Console (Company/Users/Roles/Audit/Security)**.

Prinsip produk: **"Powerful underneath, simple on surface"** — operasi kompleks di belakang, UI tetap intuitif.

Mode operasi: **Live-first, resilient** — UI auto-detect backend (`VITE_API_URL`, default `http://localhost:4100/api/v1`), fallback ke dataset demo lokal saat backend tidak terjangkau. Ada indikator pill **Live API / Demo**.

---

## 2. Masalah & Tujuan

### Masalah
1. Operasi logistik terfragmentasi: shipment, gudang, armada, billing dicatat di sistem berbeda.
2. Status tidak konsisten, sulit dilacak (histori, exception, return).
3. Kontrol akses lemah — semua user bisa lihat/ubah semua hal.
4. Laporan operasional & keuangan lambat, tidak drill-down.
5. Master data (warehouse, service, customer) statis, tidak langsung terpakai di form operasional.

### Tujuan Produk (Objectives)
1. Satu platform operasi end-to-end yang konsisten status-nya.
2. RBAC ditegakkan di API + UI untuk semua modul.
3. State machine tervalidasi untuk shipment/order/delivery/billing/approval.
4. Tetap bisa dipakai demo/offline saat backend mati.
5. Bilingual EN/ID, responsif desktop/tablet/mobile, cepat dan ringan.

### Non-Tujuan (v1)
- Bukan marketplace, bukan tracking publik untuk end-customer.
- Tanpa integrasi eksternal: payment gateway, GPS/maps live, notifikasi email/WA, AI chatbot (hanya placeholder "Ask FARAZZ").

---

## 3. Target Pengguna & Persona

| Role (akun demo, password `Admin123!`) | Kebutuhan utama |
|---|---|
| Super Admin (`faraz@farazzflow.example.com`) | Kelola company, user, role, audit, security |
| Operations Manager (`test.ops@...`) | Dashboard, shipment, order, exception, return, tracking |
| Warehouse Manager / Staff (`test.warehouse@...`) | Inbound, sorting, outbound, inventory, stock movement |
| Fleet Manager / Dispatcher (`test.fleet@...`, `test.dispatcher@...`) | Vehicle, driver, route, dispatch, maintenance |
| Finance (`test.finance@...`) | Billing, invoice, payment, COD |
| CS (`test.cs@...`) | Customer, order, shipment, exception, document |
| Driver (`test.driver@...`) | Delivery, task, dispatch yang ditugaskan |

Semua role login via session cookie HttpOnly + CSRF double-submit. UI bilingual, persist `farazz.lang`.

---

## 4. Scope v1

### In-scope
- **Overview:** Dashboard Control Center (KPI shipments/inTransit/delivered/processing/exceptions + chart + alert), Analytics, Reports, Tracking, Shipments Create.
- **Operations:** Shipments, Orders, Delivery, Exceptions, Returns — CRUD + transisi status + histori/timeline.
- **Warehouse:** Warehouses, Zones, Inventory, Inbound, Outbound, Sorting, Stock Movement.
- **Fleet:** Vehicles, Drivers, Routes, Dispatches, Maintenance.
- **Business:** Customers, Suppliers, Service Types, Pricing, Contracts.
- **Finance:** Billing (+bill-items, status draft/sent/partial/settled/cancelled), Invoices, Payments, COD.
- **Workspace:** Approvals (approve/reject), Tasks (todo/in_progress/done), Documents, Activity, Notifications (+unread-count), Realtime SSE heartbeat, Files (upload base64/download/version), Import-Export CSV.
- **Admin Console:** Company, Users, Roles & Permissions matrix, Audit, Security Events, Monitoring/Health.
- **Cross-cutting:** Auth/session, RBAC, search global, data-table (sort/filter/pagination/row-action), status-badge, timeline, dialog/drawer, toast, empty/loading/error state, i18n, live/demo fallback.

### Out-of-scope / Roadmap
- AI "Ask FARAZZ" chatbot (sekarang 4 suggested Q placeholder).
- SSO/OAuth, GPS tracking, maps, payment gateway, notifikasi email/WA/SMS.
- Storage S3 (sekarang lokal `./uploads`), export PDF/XLS (sekarang CSV).
- Multi-company / multi-tenant penuh (sekarang single company settings).
- Workflow editor (state-machine editable admin).

Lihat §10 Open Questions.

---

## 5. Functional Requirements

### 5.1 Auth & Session
- REQ-A1: Login/logout dengan session cookie HttpOnly, `GET /me` untuk status.
- REQ-A2: Rate-limit login + lockout (`LOGIN_MAX_FAILED`, `LOGIN_LOCK_MINUTES`).
- REQ-A3: CSRF double-submit untuk mutasi.
- REQ-A4: Indikasi mode `live | demo | booting` + retry 30 dtk saat probe gagal.
- REQ-A5: Bilingual EN/ID terpusat (`src/lib/i18n.tsx`), persist localStorage.

### 5.2 Overview / Dashboard
- REQ-D1: KPI: total shipments, in-transit, delivered, processing, exceptions.
- REQ-D2: Chart tren + alert exception.
- REQ-D3: Navigasi cepat ke modul terkait.

### 5.3 Operations
- REQ-O1: CRUD Shipment/Order/Delivery/Exception/Return dengan validasi zod.
- REQ-O2: Transisi status tervalidasi:
  - Shipment: `booked → picked_up → in_transit → out_for_delivery → delivered` + varian `delayed / exception / returned` via `PATCH /shipments/:id/status`.
  - Order: `pending → confirmed → processing → completed / cancelled`.
  - Delivery: `scheduled → out_for_delivery → delivered / failed`.
  - Inbound: `Expected → Put Away`; Outbound: `Ready → Dispatched`; Return: `Requested → Completed`.
- REQ-O3: Histori per shipment (`history`) + timeline UI.
- REQ-O4: Exception resolve flow; Return link ke shipment/order asal.
- REQ-O5: Halaman Tracking (search by AWB/order) + Shipments Create form (master-data dinamis: warehouse/service/customer langsung terpakai).

### 5.4 Warehouse
- REQ-W1: CRUD Warehouse + Zones.
- REQ-W2: Inventory list per warehouse/zone + Stock Movement traceable (masuk/keluar/pindah).
- REQ-W3: Inbound / Outbound / Sorting dengan status workflow §5.3.
- REQ-W4: Master warehouse baru langsung muncul di form operasional.

### 5.5 Fleet
- REQ-F1: CRUD Vehicle, Driver, Route.
- REQ-F2: Dispatch: assign vehicle+driver+route ke shipment/delivery.
- REQ-F3: Maintenance log per vehicle.

### 5.6 Business
- REQ-B1: CRUD Customer, Supplier, Service Type, Pricing, Contract.
- REQ-B2: Pricing/service-type dipakai di order/shipment create.
- REQ-B3: Contract link ke customer/supplier.

### 5.7 Finance
- REQ-FN1: Billing CRUD + Bill Items + status `draft/sent/partial/settled/cancelled`.
- REQ-FN2: Invoice, Payment, COD tracking, link ke shipment/order/customer.
- REQ-FN3: Summary outstanding/settled di dashboard finance.

### 5.8 Workspace
- REQ-WS1: Approval `Pending Manager/Finance → Approved/Rejected` via `decide`.
- REQ-WS2: Task `todo/in_progress/done` assignable.
- REQ-WS3: Document + file upload (base64, max 10MB default) / download / version.
- REQ-WS4: Activity log + Notification in-app + unread-count + SSE realtime heartbeat.
- REQ-WS5: Import-Export CSV per resource; Reports (`usage-overview`, `shipments-by-status`).

### 5.9 Admin Console
- REQ-AD1: Company settings (single company v1).
- REQ-AD2: Users CRUD + reset akses.
- REQ-AD3: Roles & Permissions matrix pola `${module}.view/create/edit/delete` + `admin.*`, ditegakkan via `requirePermission()` di API dan disembunyikan/disable di UI.
- REQ-AD4: Audit log + Security Events (login gagal, RBAC denial) read-only + retensi (lihat §10).
- REQ-AD5: Monitoring/overview + Health/DB check.

### 5.10 Cross-cutting UX
- REQ-X1: App shell: sidebar grup Overview/Operations/Warehouse/Fleet/Business/Finance/Analytics/Workspace/Admin, collapsible, responsif (card di mobile, bukan tabel sempit).
- REQ-X2: Komponen baku: data-table, status-badge, page-header, global-search, export-button, confirm-delete, timeline, toast sonner.
- REQ-X3: State baku: empty/loading/error + validasi form RHF+zod inline.

---

## 6. Alur Kunci (Happy Path)

1. **Shipment baru:** CS/Ops → Shipments Create (pilih customer/service/warehouse) → `booked` → advance ke `picked_up → in_transit → out_for_delivery → delivered`. Setiap transisi tercatat di history + timeline. Gagal → `exception` → Exceptions resolve → lanjut/kembali.
2. **Gudang:** Inbound `Expected` → cek barang → `Put Away` (inventory +, stock movement). Outbound `Ready` → `Dispatched` (inventory −).
3. **Armada:** Dispatcher buat Dispatch (vehicle+driver+route) → Driver lihat Delivery/Task → `delivered/failed`.
4. **Keuangan:** Order/shipment selesai → Billing `draft → sent` → Payment masuk → `partial/settled`. COD tercatat terpisah.
5. **Approval:** Pengajuan (mis. discount, dispatch khusus) → `Pending` → Manager/Finance `Approved/Rejected` → Activity + Notification.
6. **Fallback demo:** Backend mati → pill Demo → semua CRUD jalan di store lokal (31 koleksi seed) → saat backend hidup kembali, probe sukses → pill Live.

---

## 7. RBAC Matrix (ringkas)

Pola permission: `{shipments,orders,deliveries,exceptions,returns,warehouses,inventory,inbound,outbound,sorting,vehicles,drivers,routes,dispatches,customers,suppliers,billing,payments,...}.{view,create,edit,delete}` + `admin.*` + `approve`.

| Modul | Super Admin | Ops | Warehouse | Fleet/Dispatcher | Finance | CS | Driver |
|---|---|---|---|---|---|---|---|
| Operations | full | full | view | view (dispatch terkait) | view | view/create/edit | view terkait |
| Warehouse | full | view | full | view | — | — | — |
| Fleet | full | view | — | full | — | — | view terkait |
| Business | full | view/create/edit | — | — | view | view/create/edit | — |
| Finance | full | — | — | — | full | — | — |
| Workspace approve | full | approve ops | approve wh | approve fleet | approve finance | request | request |
| Admin | full | — | — | — | — | — | — |

Denial: API 403 `FORBIDDEN` + UI sembunyikan/disable + tercatat di Security Events + dicover smoke test.

---

## 8. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Performa | FE ringan, tanpa animasi/video berat; tabel paginated; Query caching TanStack Query; API envelope `{success,data.rows/total\|row}` konsisten |
| Keamanan | scrypt hash, HttpOnly session, CSRF, helmet, rate-limit, RBAC middleware, audit+security log, validasi zod server+client |
| Reliabilitas | Live-first + demo fallback; migrasi idempoten 001–009; backup mysqldump gzip (keep 15); smoke 84 checks `backend/scripts/smoke.ps1`; `npm test` node:test |
| Kompatibilitas | Node 20+, MySQL 8, browser modern; FE `5173`, BE `4100`; deploy Vite + nitro target Cloudflare |
| Aksesibilitas & i18n | Semua string via `nav.* admin.* common.* dash.* ai.* status.*`; ganti bahasa tanpa reload kehilangan konteks |
| Data | Soft-delete (migrasi 009); upload lokal `./uploads` max ~10MB; CSV import-export; error envelope `{success:false,error:{code,message,details}}` |
| Observability | `/health`, `/monitoring/overview`, `/reports/*`, log level via `LOG_LEVEL` |

---

## 9. Model Data & API (ringkas)

- **DB:** MySQL `farazz_flow`, 9 migrasi `database/migrations/001-009` + snapshot `database/schema.sql` (+ `database/seeds/`).
- **API base:** `/api/v1` (`backend/src/app.ts:80-132`): `health, auth, admin, customers/shipments/orders/deliveries/exceptions/returns, warehouses/zones/inventory/inbound/outbound/sorting, vehicles/drivers/routes/dispatches/maintenance, billing/bill-items/payments/cod, approvals/tasks/documents/notifications/realtime, files/import-export/reports/monitoring` — handler di `backend/src/controllers/` (20 file).
- **Frontend routes (41, di `frontend/src/routes/`):** `index(dashboard), shipments, shipments-create, tracking, orders, delivery, exceptions, returns, warehouses, inbound, sorting, outbound, inventory, stock-movement, vehicles, drivers, routes, dispatch, maintenance, customers, suppliers, service-types, pricing, contracts, billing, invoices, payments, cod, analytics, reports, approvals, tasks, documents, activity, login, settings, help, profile, admin/{index,company,users,roles,audit}`.
- **Env keys:** `VITE_API_URL, PORT, NODE_ENV, APP_URL, CORS_ORIGINS, DB_HOST/PORT/USER/PASSWORD/NAME, SESSION_TTL_HOURS, SESSION_SECRET, CSRF_SECRET, LOGIN_MAX_FAILED, LOGIN_LOCK_MINUTES, AUTH_RATE_LIMIT_MAX/WINDOW_MS, UPLOAD_DIR, UPLOAD_MAX_MB, LOG_LEVEL`.

---

## 10. Acceptance Criteria (UAT v1)

1. Login semua 8 role demo berhasil, permission denial tercatat.
2. Buat shipment → jalankan full state-machine sampai delivered + history benar.
3. Inbound → inventory bertambah + stock movement tercatat; Outbound → berkurang.
4. Buat dispatch → driver lihat tugasnya.
5. Billing draft → sent → payment → settled; COD tercatat.
6. Approval approve/reject memicu notifikasi + activity.
7. Matikan backend → pill Demo, CRUD demo jalan; hidupkan → pill Live.
8. Ganti EN↔ID, semua nav/status berubah.
9. Smoke 84 checks hijau, `npm test` hijau.
10. Import/export CSV 1 resource berhasil.

---

## 11. Open Questions (butuh keputusan sebelum final)

1. Target eksak: internal 1 perusahaan vs multi-tenant untuk klien enterprise?
2. SSO/OAuth, remember-me TTL, policy password & reset?
3. State-machine hardcode vs editable admin (§39 SPEC)?
4. Soft-delete vs deactivate vs hard-delete per modul + retensi audit/security log?
5. Storage final: lokal vs S3? Limit upload final?
6. Report drill-down + format (PDF/XLS?) selain CSV?
7. Channel notifikasi: in-app saja atau email/WA?
8. "Ask FARAZZ" AI: out-of-scope v1 atau roadmap Q berikutnya?
9. Lisensi (belum ada `LICENSE`) + target deploy prod (Wrangler/Cloudflare? VPS?).
10. SLA, backup/restore prod, dan observability lanjutan?

---

## 12. Referensi Implementasi

- `README.md:1-140` — overview, modul, akun demo, API envelope
- `docs/SPEC.md` (1527 baris) — build brief asli, benchmark monday/HashMicro/Rootera
- `backend/src/app.ts:80-132` — mount `/api/v1`
- `backend/src/controllers/` (20 file, dulu `routes/v1/`) + `middleware/permissions.ts:33`
- `database/migrations/001-009` + `database/schema.sql` — skema
- `frontend/src/router.tsx`, `frontend/src/routes/` (41 file), `components/farazz/app-layout.tsx:24-80`
- `frontend/src/lib/farazz/api.ts:20-23,58-98,211-241`, `session.tsx:28-42`, `store.tsx:12-75`, `lib/i18n.tsx`
- `.env.example` + `backend/.env.example` — env keys

---

*PRD ini mendeskripsikan kondisi berjalan (as-built) + requirement v1. Keputusan §11 akan mengubah status Draft → Approved.*
