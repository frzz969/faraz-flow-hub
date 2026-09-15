# FARAZZ FLOW — Peta Struktur (Navigasi)

**Fisik aktual, bukan struktur ideal.** Setiap path di bawah ini sudah
diverifikasi ada di disk (cek: `frontend/src/routes/`, `frontend/src/components/farazz/`,
`frontend/src/lib/farazz/`, `backend/src/controllers/`, `database/migrations/`).
Dokumen pendamping: `docs/ARCHITECTURE.md` (HOW, as-built) dan
`docs/API.md` (CONTRACT endpoint).

> **Catatan migrasi restruktur:** frontend `src/*` → `frontend/src/*`
> (`public/*` → `frontend/public/*`); backend `src/routes/v1/*` →
> `src/controllers/*`, `lib/crud|workflow.ts` → `services/`,
> `lib/db|pool.ts` → `repositories/`, `config.ts` →
> `config/config.ts` (semua relatif ke `backend/src/`), plus `validators/common.ts`,
> `database/index.ts`, dan barrel
> `modules/{auth,shipments,orders,warehouse,fleet,business,finance,
> analytics}/index.ts`; database bertambah `seeds/` dan `schema.sql`.
> Direktori lama `src/` dan `backend/src/routes/` sudah tidak dipakai.

Konvensi kolom:

* **Route UI** — file TanStack file-router di `frontend/src/routes/`
  (nama file bare, mis. `shipments.tsx` = `frontend/src/routes/shipments.tsx`)
* **Komponen** — `frontend/src/components/farazz/*` (`app-layout`, `data-table`,
  `page-header`, `status-badge`, `confirm-delete`, `primitives`,
  `export-button`, `global-search`, `timeline`) + `frontend/src/components/ui/*`
* **API** — `backend/src/controllers/*.ts` (nama bare, mis. `shipments.ts` =
  `backend/src/controllers/shipments.ts`) + mount path `/api/v1/...`
  (sumber mount: `backend/src/app.ts:80-133`)
* **Lib** — pendukung frontend (`frontend/src/lib/farazz/*`) / backend
  (`backend/src/services/*`, `backend/src/lib/*`,
  `backend/src/middleware/*`, `backend/src/repositories/*`)
* **DB** — `database/migrations/00X_*.sql` yang relevan

---

## Dashboard

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Dashboard / KPI | `frontend/src/routes/index.tsx` | `app-layout`, `page-header`, `status-badge` | `reports.ts` → `GET /reports/usage-overview`, `GET /reports/shipments-by-status`, `monitoring.ts` → `GET /monitoring/overview` | `frontend/src/lib/farazz/api.ts` (`usageOverview`, `monitoringOverview`), `backend/src/services/crud.ts` | 002, 006, 007 |

## Operations

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Shipments | `frontend/src/routes/shipments.tsx` + `shipments-create.tsx` | `data-table`, `status-badge`, `timeline` | `shipments.ts` → `/shipments` CRUD + `PATCH /shipments/:id/status`, `GET /:id/status-history` | `backend/src/services/crud.ts`, `backend/src/services/workflow.ts` (`SHIPMENT_FLOW`), `frontend/src/lib/farazz/api.ts` (`advanceShipment`, `shipmentHistory`) | 002_operations |
| Orders | `frontend/src/routes/orders.tsx` | `data-table`, `status-badge` | `orders.ts` → `/orders` CRUD + `PATCH /orders/:id/status` | `backend/src/services/crud.ts`, `backend/src/services/workflow.ts` (`ORDER_FLOW`) | 002_operations |
| Delivery | `frontend/src/routes/delivery.tsx` | `data-table`, `status-badge` | `deliveries.ts` → `/deliveries` CRUD (mod **`delivery`** — anomali) + `PATCH /deliveries/:id/status` | `backend/src/services/crud.ts`, `backend/src/services/workflow.ts` (`DELIVERY_FLOW`) | 002_operations |
| Exceptions | `frontend/src/routes/exceptions.tsx` | `data-table`, `status-badge`, `timeline` | `exceptions.ts` → `/exceptions` CRUD (mod **`shipments`** — anomali) + `PATCH /exceptions/:id/resolve` | `backend/src/services/crud.ts`, `backend/src/services/workflow.ts` (`EXCEPTION_FLOW`) | 002_operations |
| Returns | `frontend/src/routes/returns.tsx` | `data-table`, `status-badge` | `returns.ts` → `/returns` CRUD (mod **`orders`** — anomali) + `PATCH /returns/:id/status` | `backend/src/services/crud.ts`, `backend/src/services/workflow.ts` (`RETURN_FLOW`) | 002_operations |
| Tracking | `frontend/src/routes/tracking.tsx` | `status-badge`, `timeline`, `global-search` | `shipments.ts` → `GET /shipments?q=`, `GET /shipments/:id/status-history` | `frontend/src/lib/farazz/api.ts` (`get`, `shipmentHistory`) | 002_operations |

## Warehouse

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Warehouses | `frontend/src/routes/warehouses.tsx` | `data-table`, `page-header`, `confirm-delete` | `warehouse.ts` → `/warehouses` CRUD (mod `warehouse`, auto `WH-`) | `backend/src/services/crud.ts` | 003_warehouse |
| Zones | (bagian warehouses) | `data-table`, `confirm-delete` | `warehouse.ts` → `/warehouse-zones/:warehouseId` GET/POST + `DELETE /:warehouseId/:zoneId` (**hard**, auth-only) | `backend/src/middleware/auth.ts` | 003_warehouse |
| Inventory | `frontend/src/routes/inventory.tsx` | `data-table`, `status-badge` | `warehouse.ts` → `/inventory` CRUD (mod `inventory`) + `POST /inventory/:id/stock` + `GET /:id/movements` | `backend/src/services/crud.ts` | 003_warehouse |
| Inbound | `frontend/src/routes/inbound.tsx` | `data-table`, `status-badge` | `warehouse.ts` → `/inbound` CRUD (mod `warehouse`, auto `INB-`) | `backend/src/services/crud.ts` | 003_warehouse |
| Outbound | `frontend/src/routes/outbound.tsx` | `data-table`, `status-badge` | `warehouse.ts` → `/outbound` CRUD (mod `warehouse`, auto `OB-`) | `backend/src/services/crud.ts` | 003_warehouse |
| Sorting | `frontend/src/routes/sorting.tsx` | `data-table`, `status-badge` | `warehouse.ts` → `/sorting` CRUD (mod `warehouse`, auto `ST-`) | `backend/src/services/crud.ts` | 003_warehouse |
| Stock movement | `frontend/src/routes/stock-movement.tsx` | `timeline`, `data-table` | `warehouse.ts` → `GET /inventory/:id/movements`, `POST /inventory/:id/stock` | `backend/src/services/crud.ts` | 003_warehouse |

## Fleet

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Vehicles | `frontend/src/routes/vehicles.tsx` | `data-table`, `status-badge` | `fleet.ts` → `/vehicles` CRUD (mod `fleet`) | `backend/src/services/crud.ts` | 004_fleet |
| Drivers | `frontend/src/routes/drivers.tsx` | `data-table`, `status-badge` | `fleet.ts` → `/drivers` CRUD (mod `fleet`, join users) | `backend/src/services/crud.ts` | 004_fleet (+001 users) |
| Routes | `frontend/src/routes/routes.tsx` | `data-table` | `fleet.ts` → `/routes` CRUD (mod `fleet`, auto `RT-`) | `backend/src/services/crud.ts` | 004_fleet |
| Dispatch | `frontend/src/routes/dispatch.tsx` | `data-table`, `status-badge` | `fleet.ts` → `/dispatches` CRUD (mod `fleet`, auto `DSP-`) + `PATCH /dispatches/:id/status` | `backend/src/services/crud.ts` | 004_fleet |
| Maintenance | `frontend/src/routes/maintenance.tsx` | `data-table`, `status-badge` | `fleet.ts` → `/maintenance` CRUD (mod `fleet`, tabel `maintenance_records`) | `backend/src/services/crud.ts` | 004_fleet |

## Business

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Customers | `frontend/src/routes/customers.tsx` | `data-table`, `export-button`, `confirm-delete` | `customers.ts` → `/customers` CRUD (mod `customers`, auto `CUS-`) | `backend/src/services/crud.ts` | 005_business |
| Suppliers | `frontend/src/routes/suppliers.tsx` | `data-table`, `export-button` | `business.ts` → `/suppliers` CRUD (mod `suppliers`, auto `SUP-`) | `backend/src/services/crud.ts` | 005_business |
| Service types | `frontend/src/routes/service-types.tsx` | `data-table` | `business.ts` → `/service-types` CRUD (mod **`settings`** — anomali, **hard delete**) | `backend/src/services/crud.ts` | 005_business |
| Pricing | `frontend/src/routes/pricing.tsx` | `data-table` | `business.ts` → `/pricing` CRUD (mod **`settings`** — anomali, **hard delete**) | `backend/src/services/crud.ts` | 005_business |
| Contracts | `frontend/src/routes/contracts.tsx` | `data-table`, `status-badge` | `business.ts` → `/contracts` CRUD (mod **`customers`** — anomali, auto `CT-`) | `backend/src/services/crud.ts` | 005_business |

## Finance

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Billing | `frontend/src/routes/billing.tsx` | `data-table`, `status-badge` | `finance.ts` → `/billing` CRUD (mod `finance`, auto `INV-`) + `PATCH /billing/:id/status` | `backend/src/services/crud.ts` | 006_finance |
| Invoices (+items) | `frontend/src/routes/invoices.tsx` | `data-table` | `finance.ts` → `/bill-items/:invoiceId` GET/POST + `DELETE /:invoiceId/:itemId` (**hard**, auth-only) | `backend/src/middleware/auth.ts` | 006_finance |
| Payments | `frontend/src/routes/payments.tsx` | `data-table`, `status-badge` | `finance.ts` → `/payments` CRUD (mod `finance`, auto `PAY-`) | `backend/src/services/crud.ts` | 006_finance |
| COD | `frontend/src/routes/cod.tsx` | `data-table`, `status-badge` | `finance.ts` → `/cod` CRUD (mod `finance`, auto `COD-`) | `backend/src/services/crud.ts` | 006_finance |

## Analytics

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Analytics | `frontend/src/routes/analytics.tsx` | `page-header` (+charts) | `reports.ts` → `GET /reports/revenue`, `/top-routes`, `/transport-efficiency`, `/inventory-summary`, `/shipments-timeline` (read-only) | `frontend/src/lib/farazz/api.ts` | 002–006 (agregasi) |
| Reports | `frontend/src/routes/reports.tsx` | `export-button`, `data-table` | `reports.ts` (sama) + `import-export.ts` → `GET /import-export/export/:resource/csv` | `frontend/src/lib/farazz/export.ts` | 002–006 |

## Workspace

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Approvals | `frontend/src/routes/approvals.tsx` | `data-table`, `status-badge` | `workspace.ts` → `/approvals` CRUD (mod **`settings`** — anomali) + `PATCH /approvals/:id/decide` | `backend/src/services/crud.ts`, `backend/src/lib/realtime.ts` | 007_workspace |
| Tasks | `frontend/src/routes/tasks.tsx` | `data-table`, `status-badge` | `workspace.ts` → `/tasks` CRUD (mod **`settings`** — anomali) + `PATCH /tasks/:id/status` | `backend/src/services/crud.ts` | 007_workspace |
| Documents | `frontend/src/routes/documents.tsx` | `data-table`, `export-button` | `workspace.ts` → `/documents` CRUD metadata (mod **`settings`** — anomali); bytes via `files.ts` → `/files` | `backend/src/services/crud.ts` | 007_workspace |
| Activity | `frontend/src/routes/activity.tsx` | `timeline` | `monitoring.ts` → `GET /monitoring/activity`; `admin.ts` → `GET /admin/audit` | `backend/src/services/audit.ts` | 007 + 008 |
| Notifications | (bell di `app-layout` + `global-search`) | `app-layout` | `notifications.ts` → `/notifications`, `GET /unread-count`, `POST /:id/read`, `POST /read-all` | `backend/src/lib/realtime.ts`, `frontend/src/lib/farazz/api.ts` (`unreadNotifications`) | 007_workspace |
| Realtime | (infrastruktur, tanpa halaman) | — | `realtime.ts` → `GET /realtime` (**SSE**), `GET /realtime/ping` | `backend/src/lib/realtime.ts` (+ `startHeartbeat` di `app.ts`) | — (in-memory) |
| Files | (via documents) | `export-button` | `files.ts` → `POST /files` (base64), `GET /:id/versions`, `GET /:id/download`, `POST /:id/version` | `backend/src/config/config.ts` (`upload.*`) | 007_workspace |
| Import/Export | (via `export-button` + halaman list) | `export-button` | `import-export.ts` → `GET /export/:resource/csv`, `POST /import/:resource/csv` (hanya customers+inventory, perm `settings.view`) | `frontend/src/lib/farazz/export.ts` | 002–005 |

## Admin

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Admin home | `frontend/src/routes/admin/index.tsx` | `app-layout`, `page-header` | — (navigasi) | — | — |
| Company | `frontend/src/routes/admin/company.tsx` | `page-header` | (profil perusahaan — lihat `admin.ts`, `reports.ts` usage) | — | 001 + 008 |
| Users | `frontend/src/routes/admin/users.tsx` | `data-table`, `confirm-delete` | `admin.ts` → `/admin/users` GET/POST, `PUT /:id`, `PUT /:id/status`, `PUT /:id/role`, `POST /:id/reset-password`, `DELETE /:id` | `backend/src/middleware/permissions.ts` (`admin.users.*`) | 001 + 008 |
| Roles | `frontend/src/routes/admin/roles.tsx` | `data-table` | `admin.ts` → `/admin/permissions`, `/admin/roles…`, `PUT /roles/:id/permissions` | `backend/src/middleware/permissions.ts` (`admin.roles.*`) | 001 + 008 |
| Audit | `frontend/src/routes/admin/audit.tsx` | `timeline`, `data-table` | `admin.ts` → `GET /admin/audit`, `GET /admin/security-events`; `monitoring.ts` → `/monitoring/security-events` | `backend/src/services/audit.ts` | 008 |
| Monitoring/Health | `frontend/src/routes/settings.tsx` (ops) | `status-badge` | `monitoring.ts` → `/monitoring/overview|database|activity|health/live`; `health.ts` → `/health`, `/health/db` | `backend/src/repositories/db.ts` (`pingDb`) | — |

## Cross-cutting

| Modul | Route UI | Komponen | API | Lib/pendukung | DB |
|---|---|---|---|---|---|
| Auth/session | `frontend/src/routes/login.tsx`, `frontend/src/routes/profile.tsx` | `app-layout`, `primitives` | `auth.ts` → `POST /auth/login` (public), `GET /auth/me`, `POST /auth/logout|change-password|revoke-sessions` | `backend/src/lib/session.ts` (`ffz_session`), `backend/src/middleware/csrf.ts` (`ffz_csrf`), `backend/src/middleware/rate-limit.ts`, `frontend/src/lib/farazz/session.tsx` | 001_auth_core |
| API client | (semua halaman) | — | seluruh `/api/v1/*` | `frontend/src/lib/farazz/api.ts` (envelope, `x-csrf-token`, `ApiError`) | — |
| Store/demo | (semua halaman) | `global-search` | `GET /health` (deteksi live) | `frontend/src/lib/farazz/store.tsx`, `frontend/src/lib/farazz/data.ts` (dataset demo) | — |
| i18n | `frontend/src/routes/help.tsx`, `settings.tsx` | `primitives` | — | (lihat `ARCHITECTURE.md` §2) | — |
| Shell | `frontend/src/routes/__root.tsx`, `$.tsx` (404) | `app-layout` | — | `frontend/src/router.tsx`, `frontend/src/routeTree.gen.ts` (generated), `frontend/src/server.ts`, `frontend/src/start.ts` | — |

---

## Cara cek cepat

1. **Route UI →** buka file di `frontend/src/routes/<modul>.tsx`, lihat resource
   apa yang dipanggil via `frontend/src/lib/farazz/api.ts` (`list/get/create/
   update/remove` atau helper `advanceShipment`, dsb.).
2. **Router backend →** cocokkan mount di `backend/src/app.ts:80-133`
   (`app.use("/api/v1/<nama>", <nama>Router)`), lalu buka
   `backend/src/controllers/<nama>.ts` untuk schema Zod + endpoint tambahan.
3. **Permission →** cek argumen `requirePermission("<mod>.<aksi>")`
   (CRUD memakai `.view/.create/.edit/.delete`; waspadai anomali §tabel
   di atas) dan bypass `super_admin` di
   `backend/src/middleware/permissions.ts`.
4. **Envelope →** pastikan respons memakai `success(res, …)` dan error
   memakai `ApiError.*` sesuai `backend/src/lib/errors.ts`
   (`BAD_REQUEST|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|CONFLICT|
   TOO_MANY_REQUESTS|DB_UNAVAILABLE|INTERNAL_ERROR`).
5. **DB →** cocokkan nama tabel dengan `database/migrations/00X_*.sql`
   (001 auth … 009 soft deletes); migrasi via
   `backend/scripts/migrate.ts`.
