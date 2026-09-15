# FARAZZ FLOW

![TypeScript](https://img.shields.io/badge/TypeScript-fullstack-blue)
![React](https://img.shields.io/badge/TanStack_Start-React-61dafb)
![MySQL 8](https://img.shields.io/badge/MySQL-8-orange)
![Bilingual](https://img.shields.io/badge/bahasa-EN_%2F_ID-green)

**Enterprise Logistics & Supply Chain Operations Platform**

A full-stack operations platform for a large logistics, distribution, and supply-chain company. It behaves like an internal enterprise SaaS: operations, warehouse, fleet, finance, analytics, and an admin console that manages the system from within the app itself — not a landing page, not a simple tracker UI.

## Daftar isi

- [Highlights](#highlights)
- [Modules](#modules)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo accounts](#demo-accounts)
- [API](#api)
- [Repository Layout](#repository-layout)
- [Verification](#verification)
- [License](#license)

## Highlights

- **Live-first, resilient**: the UI auto-detects the backend API and falls back to a built-in demo dataset when it is unreachable.
- **RBAC everywhere**: roles + permission matrix enforced on the API; Users, Roles & Permissions managed through the Admin Console.
- **Realistic workflows**: shipment, order, delivery, exception, return, dispatch, approval, billing status state machines with transition validation.
- **Bilingual UI** (English / Bahasa Indonesia) with a centralized translation layer.

## Modules

| Area | Pages |
| --- | --- |
| Operations | Dashboard, Shipments, Orders, Delivery, Exceptions, Returns |
| Warehouse | Warehouses, Inbound, Sorting, Outbound, Inventory, Stock Movement |
| Fleet | Vehicles, Drivers, Routes, Dispatch, Maintenance |
| Business | Customers, Suppliers, Service Types, Pricing, Contracts |
| Finance | Billing, Invoices, Payments, COD |
| Analytics | Operations, Warehouse, Fleet, Delivery Performance, Reports |
| Workspace | Approvals, Tasks, Documents, Activity Log |
| Admin Console | Company, Users, Roles & Permissions, Audit, Security Events |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | TanStack Start (React), TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Node.js, Express, TypeScript (`tsx` dev runner) |
| Database | MySQL 8 (`mysql2`), SQL migrations |
| Auth / Security | scrypt password hashing, HttpOnly session cookies, CSRF double-submit, rate limiting, RBAC middlewares, audit + security-event logging |

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- MySQL 8 (Laragon works fine locally)

### 1. Database & backend (port `4100`)

```sh
cd backend
npm i
npm run migrate   # runs pending migrations in database/migrations/
npm run seed      # seeds roles, demo users, and lookup data
npm run dev       # tsx watch → http://localhost:4100
```

Copy `backend/.env.example` to `backend/.env` (or use the root `.env`) and adjust:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=farazz_flow
DB_USER=root
DB_PASSWORD=
PORT=4100
ENV=development
```

> The DB name used by migrations is configurable via `DB_NAME`. Snapshot migrations
> are idempotent — safe to run repeatedly.

### 2. Frontend (Vite dev)

```sh
npm i
npm run dev       # starts the TanStack Start app
```

Open the printed URL (default `http://localhost:5173`). Point the UI at a custom
API with `VITE_API_URL` (default `http://localhost:4100/api/v1`). When the API is
reachable the shell shows a **Live API** pill and login uses real backend accounts;
otherwise it falls back to built-in demo mode.

## Demo accounts

All passwords: `Admin123!`

| Role | Email |
| --- | --- |
| Super Admin | `faraz@farazzflow.example.com` |
| Operations Manager | `test.ops@farazzflow.example.com` |
| Warehouse Manager | `test.warehouse@farazzflow.example.com` |
| Fleet Manager | `test.fleet@farazzflow.example.com` |
| Finance | `test.finance@farazzflow.example.com` |
| Dispatcher | `test.dispatcher@farazzflow.example.com` |
| Customer Service | `test.cs@farazzflow.example.com` |
| Driver | `test.driver@farazzflow.example.com` |

## API

V1 rest API mounted under `/api/v1`: auth, health, customers, suppliers, shipments
(+ status transitions & history), orders, deliveries, exceptions, returns,
service-types, pricing, contracts, warehouses, warehouse-zones, inventory,
inbound, outbound, sorting, vehicles, drivers, routes, dispatches, maintenance,
billing (+ bill-items), payments, cod, approvals, tasks, documents, notifications,
files, import-export (CSV), reports, monitoring, and admin (users/roles/audit/security-events).

Consistent response envelope:

```json
{ "success": true, "data": { "rows": [], "total": 0 } }
```

Errors:

```json
{ "success": false, "error": { "code": "RESOURCE_NOT_FOUND", "message": "...", "details": {} } }
```

## Repository Layout

```
backend/            Express API, services, middleware, migrations runner, tests, smoke script
database/migrations 9 snapshot SQL migrations (auth → soft deletes)
docs/SPEC.md       Original product build brief
src/               Frontend (routes, components, lib, API client, i18n)
```

## Verification

```sh
cd backend
npm test              # unit tests (node:test)
npm run backup        # mysqldump → gzip into backend/backups/ (keeps last 15)
```

Full HTTP smoke suite (84 checks covering every router CRUD, lifecycle status
transitions, and RBAC denials): `backend/scripts/smoke.ps1`.

## License

No license file yet — drop a `LICENSE` when you decide on one.
