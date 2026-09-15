# FARAZZ FLOW — API Contract

**Version:** 1.0 (as-built, 13 Sep 2026 — dipetakan dari `backend/src/app.ts`,
`backend/src/services/crud.ts`, `backend/src/lib/errors.ts`, `backend/src/services/workflow.ts`, `backend/src/controllers/*`, dan
`frontend/src/lib/farazz/api.ts`)
**Base URL:** `http://localhost:4100/api/v1`
**Override frontend:** `VITE_API_URL` (`frontend/src/lib/farazz/api.ts:20`,
default persis base di atas, trailing slash dipangkas)
**Auth:** cookie session `ffz_session` (HttpOnly, SameSite=Lax) +
header `x-csrf-token` untuk semua non-GET
**Format:** JSON, kecuali `GET /files/:id/download` (binary) dan
`GET /import-export/export/:resource/csv` (`text/csv`)

> Sumber kebenaran mounting: `backend/src/app.ts:80-133`.
> Semua router kecuali `/health` dan `POST /auth/login` berada di
> belakang `csrfProtect` + `attachUser`/`requireAuth`.

---

## 1. Envelopes

### 1.1 Sukses — `{ success: true, data: ... }`

| Bentuk `data` | Dihasilkan oleh |
|---|---|
| `{ rows, total, limit, offset }` | `GET /` (makeCrud list) |
| `{ rows }` / `{ rows, limit, offset }` | sub-list: zones, bill-items, file versions, stock movements, reports |
| `{ row }` | `GET /:id` (makeCrud detail) |
| `{ id }` (+ kode auto, mis. `{ id, shipment_no }`) | `POST /` create (201) |
| `{ updated: true }` | `PUT /:id` |
| `{ deleted: true }` | `DELETE /:id` |
| `{ user, csrfToken }` | `POST /auth/login` |
| `{ id, from, to }` / `{ id, transition }` / `{ id, status }` / `{ id, decision }` | transisi PATCH (lihat §5) |
| `{ id, quantity, reserved_qty }` | `POST /inventory/:id/stock` |
| `{ imported, errors }` | CSV import |
| `{ kpis }`, `{ year, rows, total }`, `{ totals, byCategory, byWarehouse }`, ... | reports |
| `{ count }`, `{ read: true }`, `{ ok, online }`, `{ changed: true }`, `{ revoked: n }`, `{ loggedOut: true }` | aksi kecil |

Contoh:

```json
// GET /api/v1/shipments?limit=2
{ "success": true, "data": {
  "rows": [{ "id": 1, "shipment_no": "SHP-20260913-001", "status": "booked" }],
  "total": 1, "limit": 2, "offset": 0 } }

// POST /api/v1/shipments → 201
{ "success": true, "data": { "id": 7, "shipment_no": "SHP-20260913-007" } }

// PATCH /api/v1/shipments/7/status
{ "success": true, "data": { "id": 7, "from": "booked", "to": "picked_up" } }

// POST /api/v1/auth/login
{ "success": true, "data": {
  "user": { "id": 1, "name": "Admin", "email": "admin@farazz.id",
            "role": "super_admin", "roleName": "Super Admin" },
  "csrfToken": "raw-token-untuk-header-x-csrf-token" } }
```

### 1.2 Error — `{ success: false, error: { code, message, details? } }`

```json
{ "success": false, "error": { "code": "BAD_REQUEST",
  "message": "Invalid shipment payload",
  "details": { "fieldErrors": { "origin": ["Required"] } } } }
```

| Code | HTTP | Kapan |
|---|---|---|
| `BAD_REQUEST` | 400 | Zod gagal, transisi ilegal (`{from,to,allowed}` di details), transfer tanpa `to_inventory_id` |
| `UNAUTHORIZED` | 401 | Tanpa/expired session, kredensial salah, akun terkunci/nonaktif, `currentPassword` salah |
| `FORBIDDEN` | 403 | Tanpa permission (`Missing permission: x.y`), CSRF hilang/salah (`Missing/Invalid/CSRF token mismatch`) |
| `NOT_FOUND` | 404 | Row tidak ada (termasuk soft-deleted), route tak dikenal |
| `CONFLICT` | 409 | Stok kurang, approval sudah diputus |
| `TOO_MANY_REQUESTS` | 429 | Rate-limit auth |
| `DB_UNAVAILABLE` | 503 | Hanya `GET /health/db` saat DB down |
| `INTERNAL_ERROR` | 500 | Fallback (di dev ada `details.message`) |
| `INVALID_JSON` | 400 | Body JSON malformed (edge di `errorMiddleware`) |
| `NETWORK_ERROR` | 0 | **Client-side only** (`ApiError.network`, backend tak terjangkau → demo fallback) |

---

## 2. Auth flow

| METHOD PATH | Auth/CSRF | Body (zod) | Respons |
|---|---|---|---|
| `POST /auth/login` | public + rate-limit, **tanpa CSRF** (ia penerbit token) | `{ email: email≤190, password: 1..128, remember?: boolean }` | `{ user{id,name,email,role,roleName}, csrfToken }` + `Set-Cookie: ffz_session` (Max-Age 12h / 168h bila remember) + `ffz_csrf` |
| `GET /auth/me` | session | — | `{ user }` (+ `touchSession`, `last_active_at`) |
| `POST /auth/logout` | session + CSRF | — | `{ loggedOut: true }` (revoke + clear cookie) |
| `POST /auth/change-password` | session + CSRF | `{ currentPassword: 1..128, newPassword: 8..128 + huruf + angka }` | `{ changed: true }` (sesi lain tetap valid — by design) |
| `POST /auth/revoke-sessions` | session + CSRF | — | `{ revoked: n }` (semua sesi user kecuali saat ini) |

Lockout: gagal `LOGIN_MAX_FAILED` (5) → kunci `LOGIN_LOCK_MINUTES`
(15 mnt). Email tak dikenal → dummy scrypt + `401 Invalid email or password`.

---

## 3. Konvensi CRUD (makeCrud, `backend/src/services/crud.ts`)

Semua resource tabel memakai pola identik:

| METHOD PATH | Perm | Query/Body (zod ringkas) | Respons |
|---|---|---|---|
| `GET /` | `<mod>.view` | `?q=` LIKE multi-kolom, `?<enum>=` (hanya nilai allowlist), `?from_<date>=&to_<date>=`, `?limit=` (dflt 50, maks 500), `?offset=` | `{ rows, total, limit, offset }` |
| `GET /:id` | `<mod>.view` | — | `{ row }` (404 bila soft-deleted) |
| `POST /` | `<mod>.create` | createSchema per resource + auto-code (`SHP/ORD/DLV/RTN/WH/INB/OB/ST/RT/DSP/INV/PAY/COD/APR/TSK/DOC/CT/CUS/SUP`) bila kosong | `{ id }` / `{ id, <code_col> }` (201) + audit CREATE |
| `PUT /:id` | `<mod>.edit` | partial schema; `{}` → `{ updated: true }` tanpa tulis | `{ updated: true }` + audit UPDATE |
| `DELETE /:id` | `<mod>.delete` | — (+ `guardBeforeDelete` bila ada) | `{ deleted: true }` — **soft** (`deleted_at`), kecuali `service-types`/`pricing` (hard) |

---

## 4. Endpoint per router

### 4.1 Health — `GET /health`, `/health/db` (public, tanpa auth/CSRF)

| METHOD PATH | Respons |
|---|---|
| `GET /health` | `{ status:"ok", service:"farazz-flow-api", version, uptimeSec, time }` |
| `GET /health/db` | `{ status:"ok", database:"connected" }` atau `503 { code:"DB_UNAVAILABLE", ... }` |

### 4.2 Admin — mount `/admin` (session + CSRF semua)

| METHOD PATH | Perm | Body ringkas |
|---|---|---|
| `GET /permissions` | `admin.roles.view` | — → `{ modules: [{ module, permissions }] }` |
| `GET /users` | `admin.users.view` | — → `{ users }` |
| `POST /users` | `admin.users.create` | `{ name, email, password≥8+huruf+angka, role_id, phone?, department?, status? }` → `{ id }` |
| `PUT /users/:id` | `admin.users.update` | partial profil → `{ updated: true }` |
| `PUT /users/:id/status` | `admin.users.update` | `{ status: active\|inactive }` |
| `PUT /users/:id/role` | `admin.users.update` | `{ role_id }` |
| `POST /users/:id/reset-password` | `admin.users.update` | `{ newPassword }` (aturan sama) |
| `DELETE /users/:id` | `admin.users.delete` | soft → `{ deleted: true }` |
| `GET /roles`, `GET /roles/:id` | `admin.roles.view` | — |
| `POST /roles` | `admin.roles.update` | `{ code, name, ... }` → `{ id }` |
| `PUT /roles/:id` | `admin.roles.update` | partial → `{ updated: true }` |
| `PUT /roles/:id/permissions` | `admin.roles.update` | `{ permission_ids: number[] }` |
| `DELETE /roles/:id` | `admin.roles.delete` | → `{ deleted: true }` |
| `GET /audit` | `admin.audit.view` | `?limit?&offset?` → `{ rows, ... }` |
| `GET /security-events` | `admin.audit.view` | `?limit≤200` → `{ rows }` |

### 4.3 Operations core

**Shipments `/shipments`** — mod `shipments`. Enum `status`:
`pending|booked|picked_up|in_transit|out_for_delivery|delivered|cancelled|exception`
(+ `failed_attempt` historis). Date filter `planned_date,created_at`.
Create: `{ origin(2..128), destination(2..128), customer_id?, origin_city?,
destination_city?, service_type?, weight_kg?, volume_m3?, declared_value?,
cod_amount?, base_fare?, fuel_surcharge?, extra_charge?, total_amount?,
customer_note?, planned_date?, courier_name?, reference? }`.

| Tambahan | Body | Respons |
|---|---|---|
| `PATCH /shipments/:id/status` | `{ status: string 1..48, note? }` (divalidasi vs `SHIPMENT_FLOW`, 400 bila ilegal) | `{ id, from, to }` + history + SSE `shipment:status` |
| `GET /shipments/:id/status-history` | — | `{ history: [{ status, note, changed_at, changed_by }] }` |

**Orders `/orders`** — mod `orders`. Enum `pending|draft|confirmed|processing|completed|cancelled`
(list filter `draft|confirmed|processing|completed|cancelled`). Date filter `order_date`.
Create: `{ order_date: string, customer_id?, shipment_id?, total_amount≥0?, notes? }`.

| Tambahan | Body | Respons |
|---|---|---|
| `PATCH /orders/:id/status` | `{ status: string }` vs `ORDER_FLOW` | `{ id, transition:{from,to} }` (+ `completed_at` bila completed) |

**Deliveries `/deliveries`** — mod **`delivery`** (singular — anomali).
Enum `scheduled|out_for_delivery|delivered|failed_attempt|returned`
(list filter sama). Create: `{ shipment_id?, vehicle_id?, driver_id?,
address?, city?, recipient_name?, scheduled_at?, notes? }`.

| Tambahan | Body | Respons |
|---|---|---|
| `PATCH /deliveries/:id/status` | `{ status: string }` vs `DELIVERY_FLOW` | `{ id, transition }` (+ `delivered_at`; bila `delivered`, shipment linked → `delivered`) |

**Exceptions `/exceptions`** — mod **`shipments`** (anomali).
Enum `open|reviewing|resolved|closed`, severity `low|medium|high`.
Create: `{ shipment_id!, exception_type: address_mismatch|damaged|not_home|delayed|wrong_item|rejected|other, severity?, description? }`.

| Tambahan | Body | Respons |
|---|---|---|
| `PATCH /exceptions/:id/resolve` | `{ status: open|reviewing|resolved|closed, note? }` vs `EXCEPTION_FLOW` | `{ id, transition }` (+ `resolved_note/by`; bila `resolved`, shipment → `out_for_delivery`, SSE `exception:status`) |

**Returns `/returns`** — mod **`orders`** (anomali).
Enum `requested|approved|picked_up|returned|rejected`.
Create: `{ reason(2..190), shipment_id?, order_id?, notes?, request_date? }`.

| Tambahan | Body | Respons |
|---|---|---|
| `PATCH /returns/:id/status` | `{ status: string }` vs `RETURN_FLOW` | `{ id, transition }` |

### 4.4 Business — `business.ts` (4 router)

| Mount | Mod | Khusus |
|---|---|---|
| `/suppliers` | `suppliers` | CRUD baku, soft. Create `{ name(2..190), contact_person?, email?, phone?, address?, category?, status active\|inactive?, notes? }`, auto `SUP-` |
| `/service-types` | **`settings`** | CRUD baku, **hard delete**. Create `{ code(1..40), name(2..128), description?, status? }` |
| `/pricing` | **`settings`** | CRUD baku, **hard delete**. Create `{ base_price≥0!, effective_from: string!, route_id?, service_type_id?, weight_min/max?, price_per_kg/m3?, min_charge?, effective_to?, status? }` |
| `/contracts` | **`customers`** | CRUD baku, soft, `createdBy`. Create `{ title(2..190), start_date: string!, customer_id?, end_date?, value?, status draft\|active\|expired\|terminated?, terms? }`, auto `CT-` |

### 4.5 Warehouse — `warehouse.ts`

| Mount | Mod | Khusus |
|---|---|---|
| `/warehouses` | `warehouse` | CRUD baku. Create `{ name(2..128), address?, city?, capacity?, manager_id?, status active\|inactive\|maintenance? }`, auto `WH-`, filter `status` |
| `/warehouse-zones` | auth-only (tanpa perm) | `GET /:warehouseId` → `{ rows }`; `POST /:warehouseId { code(1..40)!, name?, zone_type storage\|staging\|sorting\|damaged\|returns? }` → `{ id }` 201; `DELETE /:warehouseId/:zoneId` → `{ deleted: true }` (**hard**) |
| `/inventory` | `inventory` | CRUD baku. Create `{ warehouse_id!, sku(1..64)!, name!, category?, quantity≥0?, unit?, min_stock?, location? }` |
| `/inventory/:id/stock` | (ikut router inventory) | `POST { movement_type: in\|out\|transfer\|adjustment\|reserve\|release!, quantity>0!, reference?, note?, to_inventory_id? (wajib utk transfer) }` → `{ id, quantity, reserved_qty }` (409 bila kurang); transfer menambah stok target |
| `/inventory/:id/movements` | (ikut router inventory) | `GET` → `{ rows: stock_movements + user_name }` |
| `/inbound` | `warehouse` | CRUD baku, `createdBy`, auto `INB-`. Create `{ warehouse_id!, supplier_id?, expected_date?, notes? }`, filter `expected\|received\|checked\|stored` |
| `/outbound` | `warehouse` | CRUD baku, `createdBy`, auto `OB-`. Create `{ warehouse_id!, order_id?, shipment_id?, ship_date?, notes? }`, filter `preparing\|picked\|packed\|shipped` |
| `/sorting` | `warehouse` | CRUD baku, auto `ST-`. Create `{ warehouse_id!, shipment_id?, zone_from?, zone_to?, assigned_to? }`, filter `pending\|in_progress\|sorted\|failed` |

### 4.6 Fleet — `fleet.ts` (semua mod `fleet`)

| Mount | Khusus |
|---|---|
| `/vehicles` | CRUD baku. Create `{ plate_no(2..24)!, model?, type?, capacity_kg/m3?, status available\|in_use\|maintenance\|retired?, odometer? }` |
| `/drivers` | CRUD baku (join user). Create `{ user_id?, license_no?, license_expiry?, phone?, status available\|on_duty\|off_duty\|suspended? }` |
| `/routes` | CRUD baku, auto `RT-`. Create `{ origin(2..128)!, destination(2..128)!, name?, distance_km?, estimated_min?, vehicle_type?, base_price?, status active\|inactive? }` |
| `/dispatches` | CRUD baku, `createdBy`, auto `DSP-`. Create `{ route_id?, shipment_id?, vehicle_id?, driver_id?, scheduled_at?, notes? }`, filter `planned\|dispatch\|on_route\|completed\|cancelled` |
| `PATCH /dispatches/:id/status` | `{ status: planned\|dispatch\|on_route\|completed\|cancelled }` → `{ id, status }` (+ `departed_at/arrived_at`; vehicle→`in_use/available`, driver→`on_duty/available`) |
| `/maintenance` | CRUD baku (tabel `maintenance_records`). Create `{ vehicle_id!, maintenance_type(2..64)!, scheduled_date?, cost?, status scheduled\|in_progress\|completed\|cancelled?, notes?, assignee_id? }` |

### 4.7 Finance — `finance.ts` (mod `finance`, kecuali bill-items)

| Mount | Khusus |
|---|---|
| `/billing` | CRUD baku (tabel `billing_documents`), `createdBy`, auto `INV-`. Create `{ doc_type estimate\|invoice\|receipt!, issue_date: string!, customer_id?, shipment_id?, due_date?, sub_total?, discount?, tax_rate?, total?, status draft\|sent\|partial\|settled\|cancelled\|overdue?, notes? }`; filter `status,doc_type`; date filter `issue_date,due_date` |
| `PATCH /billing/:id/status` | `{ status: draft\|sent\|partial\|settled\|cancelled\|overdue }` → `{ id, status }` (`paid_at=NOW()` bila `settled/partial`) |
| `/bill-items` | auth-only (tanpa perm). `GET /:invoiceId` → `{ rows }`; `POST /:invoiceId { description(1..255)!, quantity?, unit_price? }` → `{ id }` 201; `DELETE /:invoiceId/:itemId` → `{ deleted: true }` (**hard**) |
| `/payments` | CRUD baku, auto `PAY-`. Create `{ method(2..48)!, amount>0!, invoice_id?, customer_id?, status pending\|success\|failed\|refunded\|cancelled?, reference?, notes? }` |
| `/cod` | CRUD baku (tabel `cod_settlements`), auto `COD-`. Create `{ cod_amount≥0!, shipment_id?, fee?, notes? }`, filter `pending\|collected\|transferred\|released\|disputed` |

### 4.8 Workspace — `workspace.ts` (ketiganya mod **`settings`**)

| Mount | Khusus |
|---|---|
| `/approvals` | CRUD baku, `createdByColumn: requestor_id`, auto `APR-`. Create `{ title(2..190)!, category shipment\|contract\|payment\|purchase\|leave\|expense\|other!, priority low\|medium\|high\|urgent?, description?, resource?, resource_id? }`, filter `status,category,priority` |
| `PATCH /approvals/:id/decide` | `{ decision: approved\|rejected!, note? }` → `{ id, decision }` (409 bila tak pending; notifikasi ke requestor + SSE `approval:decided`) |
| `/tasks` | CRUD baku, `createdByColumn: creator_id`, auto `TSK-`. Create `{ title(2..190)!, description?, priority low\|medium\|high?, assignee_id?, due_date?, resource?, resource_id? }`, filter `status,priority` |
| `PATCH /tasks/:id/status` | `{ status: todo\|in_progress\|done\|blocked }` → `{ id, status }` (`completed_at` bila done) |
| `/documents` | CRUD baku metadata, `createdBy`, auto `DOC-`. Create `{ title(2..190)!, doc_no?, category?, tags?, status draft\|published\|archived? }` (bytes via `/files`) |

### 4.9 Notifications — `/notifications` (auth-only, scope milik sendiri)

| METHOD PATH | Body/Query | Respons |
|---|---|---|
| `GET /` | `?limit≤200?&offset?&unread=1?` | `{ rows, limit, offset }` (hanya milik user) |
| `GET /unread-count` | — | `{ count }` |
| `POST /` | `{ user_id!, type assigned\|approval\|shipment\|alert\|system!, title(2..190)!, message≤500?, resource?, resource_id? }` | `{ id }` 201 + SSE `notification:new` ke target |
| `POST /:id/read` | — (hanya milik sendiri, 404 bila bukan) | `{ read: true }` |
| `POST /read-all` | — | `{ read: true }` |

### 4.10 Realtime (SSE) — `/realtime` (auth)

| METHOD PATH | Catatan |
|---|---|
| `GET /realtime` | **SSE stream** `text/event-stream` (`connected { user, online }` → event `shipment:status`, `exception:status`, `notification:new`, `approval:decided`, `ping`). Jangan panggil via `api.ts request()` (butuh `EventSource` + cookie). |
| `GET /realtime/ping` | JSON `{ ok: true, online: n }` (broadcast `ping`) |

### 4.11 Files — `/files` (auth-only)

| METHOD PATH | Body (zod) | Respons |
|---|---|---|
| `POST /` | `{ title(2..190)!, fileName!, mimeType?, dataBase64 (base64 ≤ ~8 MiB)!, category?, changeNote? }` | `{ id, fileName, size }` 201 (file → `backend/uploads/<yyyymm>/<hex>.bin` + baris `documents`/`document_versions`) |
| `GET /:id/versions` | — | `{ rows: [{ version, file_name, file_size, mime_type, change_note, created_at, created_by_name }] }` |
| `GET /:id/download` | — | **binary attachment** (404 bila row/file hilang) |
| `POST /:id/version` | schema sama seperti upload | `{ id, version, size }` (bump version + audit) |

### 4.12 Import / Export — `/import-export` (auth; import butuh `settings.view`)

| METHOD PATH | Catatan |
|---|---|
| `GET /export/:resource/csv` | `:resource ∈ customers\|suppliers\|shipments\|inventory\|vehicles`. Respons **`text/csv` + BOM**, header `attachment; filename="<res>-<yyyy-mm-dd>.csv"`, hanya `deleted_at IS NULL`. |
| `POST /import/:resource/csv` | `:resource ∈ customers\|inventory` (lainnya → 400). Body `{ csv: string! }` (header wajib). Respons `{ imported: n, errors: [{ row, reason }] }`. Customers: `name` wajib; inventory: `warehouse_id,sku,name` wajib (upsert per `sku` — tambah quantity). |

### 4.13 Reports — `/reports` (auth-only, read-only)

| METHOD PATH | Query | Respons |
|---|---|---|
| `GET /shipments-by-status` | — | `{ rows: [{ status, count, customers }] }` |
| `GET /shipments-timeline` | `?days=` (1..90, dflt 14) | `{ rows: [{ day, count }] }` |
| `GET /revenue` | `?year=` (dflt tahun berjalan) | `{ year, rows: [{ month, revenue, docs }], total }` (hanya `settled/partial`) |
| `GET /top-routes` | — | `{ rows: top 10 route + dispatches }` |
| `GET /inventory-summary` | — | `{ totals: { sku_count, total_qty, low_stock }, byCategory, byWarehouse }` |
| `GET /usage-overview` | — | `{ kpis: { users, customers, suppliers, vehicles, drivers, warehouses, active_shipments, pending_approvals, open_exceptions, open_tasks } }` |
| `GET /transport-efficiency` | — | `{ routes: { avg_distance_km, avg_estimated_min, routes }, dispatch: [{ status, count }] }` |

### 4.14 Monitoring — `/monitoring` (auth-only, read-only)

| METHOD PATH | Query | Respons |
|---|---|---|
| `GET /overview` | — | `{ uptimeSeconds, startedAt, pid, node, env, db: { latencyMs\|null, poolThreadId }, realtime: { online } }` |
| `GET /database` | — | `{ tables: information_schema, counts: [{ tbl, n }] }` |
| `GET /activity` | `?hours=` (1..168, dflt 24) | `{ audit: [{ hour, n }], security: [{ event_type, severity, n }] }` |
| `GET /security-events` | `?limit≤200` (dflt 50) | `{ rows }` |
| `GET /health/live` | — | `{ ok: boolean }` (ping DB) |

---

## 5. Status transitions — ringkasan

| Endpoint | Flow (`backend/src/services/workflow.ts` / router) | Terminal |
|---|---|---|
| `PATCH /shipments/:id/status` | `pending→booked→picked_up→in_transit→out_for_delivery→delivered`, cabang `cancelled/exception/failed_attempt`; `exception→out_for_delivery\|cancelled` | `delivered`, `cancelled` |
| `PATCH /orders/:id/status` | `draft→confirmed→processing→completed` (+`cancelled`) | `completed`, `cancelled` |
| `PATCH /deliveries/:id/status` | `scheduled→out_for_delivery→delivered\|failed_attempt\|returned` | `delivered`, `returned` |
| `PATCH /exceptions/:id/resolve` | `open→reviewing\|resolved\|closed` | `closed` |
| `PATCH /returns/:id/status` | `requested→approved\|rejected→picked_up→returned` | `returned`, `rejected` |
| `PATCH /approvals/:id/decide` | `pending→approved\|rejected` | keduanya |
| `PATCH /tasks/:id/status` | bebas `todo\|in_progress\|done\|blocked` | — |
| `PATCH /dispatches/:id/status` | `planned→dispatch→on_route→completed` (+`cancelled`) | `completed`, `cancelled` |
| `PATCH /billing/:id/status` | bebas `draft\|sent\|partial\|settled\|cancelled\|overdue` | — |
| `POST /inventory/:id/stock` | `in\|out\|transfer\|adjustment\|reserve\|release` (mutasi, bukan status) | — |

Transisi ilegal → `400 BAD_REQUEST` + `details { from, to, allowed }`.

---

## 6. RBAC pattern

* CRUD: `<module>.view | .create | .edit | .delete` (perhatikan **`.edit`**,
  bukan `.update` — kecuali Admin yang memakai `.update`).
* Admin: `admin.users.view|create|update|delete`,
  `admin.roles.view|update|delete`, `admin.audit.view`.
* `super_admin` bypass semua permission (server-side).
* **Anomali (by design, jangan diasumsikan dari nama mount):**
  `approvals|tasks|documents|service-types|pricing → settings.*`;
  `deliveries → delivery.*`; `exceptions → shipments.*`;
  `returns → orders.*`; `contracts → customers.*`.
* Tanpa permission (auth saja): `warehouse-zones`, `bill-items`,
  `notifications`, `realtime`, `files`, `reports`, `monitoring`,
  export CSV (import CSV: `settings.view`).

---

## 7. CSRF & rate-limit notes

* Semua `POST/PUT/PATCH/DELETE` butuh header `x-csrf-token` = token
  mentah dari login, cocok dengan cookie `ffz_csrf` (`token.signature`
  HMAC-SHA256). Hilang/salah → `403 FORBIDDEN`. `GET/HEAD/OPTIONS`
  bebas; `POST /auth/login` bebas (penerbit token).
* Auth endpoints: **20 req/menit/IP** → `429 TOO_MANY_REQUESTS`.
  Login gagal **5x** → kunci **15 mnt**.
* Frontend (`api.ts`): token disimpan di memori (`getCsrfToken/
  setCsrfToken`), dikirim otomatis; `credentials: "include"`
  membawa `ffz_session`.

---

## 8. Dev ports & env

```text
Frontend  http://localhost:5173   (Vite dev)
Backend   http://localhost:4100   (PORT, APP_URL)
MySQL     localhost:3306          (DB_HOST/DB_PORT/DB_NAME=farazz_flow)
API       http://localhost:4100/api/v1 (VITE_API_URL override)
```

Env terkait kontrak: `SESSION_TTL_HOURS=12` (remember → 168),
`LOGIN_MAX_FAILED=5`, `LOGIN_LOCK_MINUTES=15`,
`AUTH_RATE_LIMIT_MAX=20`, `AUTH_RATE_LIMIT_WINDOW_MS=60000`,
`UPLOAD_DIR`, `UPLOAD_MAX_MB=10` (files menerima ~8 MiB base64),
`CORS_ORIGINS` (kredensial `credentials:true`).
