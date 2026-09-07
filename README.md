# Farazz Flow Hub

Create a production-quality enterprise SaaS web application called:

FARAZZ FLOW
Enterprise Logistics & Supply Chain Operations Platform

IMPORTANT:
This is NOT a generic logistics landing page, NOT a simple courier tracking website, and NOT a marketplace.

Build it as a realistic internal enterprise operations platform for a large logistics, distribution, and supply-chain company.

The product must feel like a serious commercial SaaS product that could be presented to enterprise clients.

DESIGN BENCHMARKS:
- Take inspiration from the clean, modern, flexible UX principles of monday.com.
- Take inspiration from the business depth and operational integration found in enterprise ERP/WMS products such as HashMicro.
- Take inspiration from the end-to-end enterprise workflow, modular architecture, reporting, and extensibility of platforms such as Rootera.
- DO NOT copy their branding, layouts, wording, visual identity, components, or exact UI.
- Create a completely original FARAZZ FLOW identity.

CORE DESIGN PRINCIPLE:

"Powerful underneath, simple on the surface."

The application may contain complex enterprise operations, but the interface must remain intuitive for normal users.

==================================================
1. BRAND
==================================================

Product name:
FARAZZ FLOW

Tagline:
Enterprise Logistics & Supply Chain Operations

Brand personality:
- Professional
- Modern
- Trustworthy
- Intelligent
- Efficient
- Enterprise-grade
- Calm
- Clear

Avoid:
- Excessive gradients
- Excessive glassmorphism
- Neon colors
- Gaming aesthetics
- Excessive animations
- Overly decorative interfaces
- Generic AI-dashboard appearance

Use a restrained professional visual system.

Primary visual direction:
- Light interface
- Neutral background
- White surfaces
- Dark readable typography
- One controlled primary accent color
- Subtle semantic colors for status

Status colors:
- Green = healthy / delivered / completed
- Amber = warning / pending
- Red = critical / failed / exception
- Blue = information / processing
- Purple can be reserved for AI features

==================================================
2. RESPONSIVE DESIGN
==================================================

The application must be fully responsive.

Desktop:
- Persistent collapsible sidebar
- Wide data tables
- Multi-column dashboards
- Detailed operational views

Tablet:
- Adaptive sidebar
- Responsive cards
- Horizontally scrollable data tables when necessary

Mobile:
- Compact top navigation
- Bottom navigation or collapsible navigation
- Cards instead of wide tables when appropriate
- Important actions remain accessible
- Do NOT simply shrink the desktop interface
- Preserve usability and hierarchy

The website must remain lightweight and fast.

Do not add unnecessary heavy animations, large video backgrounds, or excessive visual effects.

==================================================
3. APPLICATION SHELL
==================================================

Create a professional enterprise application shell.

Sidebar:

FARAZZ FLOW
----------------

OVERVIEW
Dashboard

OPERATIONS
Shipments
Orders
Delivery
Exceptions
Returns

WAREHOUSE
Warehouses
Inbound
Sorting
Outbound
Inventory
Stock Movement

FLEET
Vehicles
Drivers
Routes
Dispatch
Maintenance

BUSINESS
Customers
Suppliers
Service Types
Pricing
Contracts

FINANCE
Billing
Invoices
Payments
COD

ANALYTICS
Operations
Warehouse
Fleet
Delivery Performance
Reports

WORKSPACE
Approvals
Tasks
Documents
Activity Log

----------------
Settings
Help
User Profile

Sidebar must be collapsible.

Include:
- Search
- Notifications
- User profile
- Breadcrumbs
- Page titles
- Contextual actions

==================================================
4. DASHBOARD
==================================================

Create a high-quality Operations Control Center.

Header:

"Good morning, Operations Team"

Subtitle:
"Here's your operational overview for today."

Top KPI cards:

Shipments
12,842
+8.4%

In Transit
4,291
Today

Delivered
7,932
96.2%

Warehouse Processing
1,284
Active

Exceptions
37
Need attention

Create:
- Shipment performance chart
- Delivery performance chart
- Warehouse capacity overview
- Exception summary
- Recent operational activity
- Upcoming dispatches
- Critical alerts

Dashboard should prioritize actionable information.

Do NOT fill the screen with random charts.

==================================================
5. SHIPMENTS
==================================================

Create a sophisticated shipment management page.

Features:
- Search tracking number
- Search customer
- Filters
- Status filters
- Origin
- Destination
- Warehouse
- Service type
- Date range

Table columns:

Tracking ID
Customer
Origin
Destination
Service
Weight
Current Location
Status
ETA
Last Updated

Example data:

NX-928173
PT Maju Bersama
Jakarta
Surakarta
Express
12.4 kg
Semarang Hub
In Transit
11 Aug 2026

Use realistic dummy data.

Statuses:
Created
Picked Up
At Origin Hub
Sorting
Dispatched
In Transit
At Destination Hub
Out for Delivery
Delivered
Delayed
Exception
Returned

==================================================
6. SHIPMENT DETAIL
==================================================

Clicking a shipment should open a detailed enterprise view.

Example:

NX-928173

PT Maju Bersama

Jakarta → Surakarta

12.4 kg
Express
ETA: 11 Aug 2026

Show:

Shipment summary
Customer information
Package information
Current location
Service type
Assigned route
Assigned vehicle
Assigned driver
Billing information

Most importantly, create a visual tracking timeline:

Shipment Created
Picked Up
Arrived at Jakarta Hub
Departed Jakarta Hub
Arrived at Semarang Hub
Out for Delivery
Delivered

Each event should show:
- timestamp
- location
- status
- responsible operation when appropriate

==================================================
7. WAREHOUSE
==================================================

Create a multi-warehouse management module.

Example warehouses:

Jakarta Central Hub
Semarang Hub
Surakarta Hub
Surabaya Hub
Bandung Hub
Makassar Hub

Each warehouse should display:

Total packages
Inbound
Sorting
Outbound
Capacity
Delayed packages
Current operational status

Warehouse detail page:

- Overview
- Inbound
- Sorting
- Inventory
- Outbound
- Capacity
- Activity

Show warehouse capacity visually but minimally.

Example:

Jakarta Central Hub
87% capacity

Inbound: 2,421
Sorting: 4,823
Outbound: 3,912
Waiting: 1,686

==================================================
8. INVENTORY
==================================================

Inventory is for goods and operational stock, not employee records.

Create:

Products
Categories
Brands
Units
Warehouse locations
Stock
Reserved stock
Incoming stock
Damaged stock
Stock movements

Product example:

SKU:
LP-AS-001

ASUS Vivobook 15

Category:
Laptop

Total Stock:
100

Available:
62

Reserved:
15

Processing:
8

In Transit:
5

Damaged:
3

Returned:
2

Minimum Stock:
10

Show stock history and movement.

Stock movement example:

+50 Received
-10 Shipment
-2 Damaged
+1 Adjustment

Every stock change must be traceable.

==================================================
9. INBOUND
==================================================

Create inbound receiving workflow:

Expected
Arrived
Scanning
Inspection
Received
Put Away

Show:
- Supplier
- Purchase/reference number
- Warehouse
- Quantity
- Expected arrival
- Actual arrival
- Inspection status

==================================================
10. SORTING
==================================================

Create a sorting operation interface.

Show:
- Package
- Current hub
- Sorting zone
- Destination
- Next hub
- Priority
- Status

Workflow:

Inbound
→ Scanning
→ Sorting
→ Destination Assignment
→ Dispatch

==================================================
11. OUTBOUND
==================================================

Create outbound management.

Workflow:

Order Ready
→ Picking
→ Packing
→ Loaded
→ Dispatched

Show:
- Shipment count
- Packages
- Destination
- Vehicle
- Driver
- Dispatch time
- Status

==================================================
12. DELIVERY
==================================================

Create delivery management.

Show:

Delivery Orders
Assigned
Out for Delivery
Delivered
Failed Delivery
Returned

Create delivery detail page with:

Customer
Address
Driver
Vehicle
Route
Packages
Attempt history
Proof of delivery
Signature/photo placeholder
Delivery status

==================================================
13. EXCEPTIONS
==================================================

Create a dedicated Exception Center.

This is an important enterprise feature.

Categories:

Delayed
Failed Delivery
Damaged
Wrong Address
Lost / Investigation
Capacity Issue
Vehicle Issue

Top summary:

12 Delayed
7 Failed Delivery
5 Address Issues
4 Damaged
2 Investigation

Create exception detail page.

Example:

NX-928175

Delivery Delayed

Expected:
10 Aug 2026 14:00

Current:
10 Aug 2026 18:32

Reason:
Vehicle breakdown

Recommended action:
Transfer to replacement vehicle

Show:
- timeline
- owner
- severity
- related shipment
- related vehicle
- notes
- resolution

==================================================
14. RETURNS
==================================================

Create return management.

Workflow:

Requested
Approved
Received
Inspection
Refund / Replacement
Completed

Show:
- shipment
- customer
- reason
- condition
- resolution
- status

==================================================
15. FLEET
==================================================

Create fleet management.

Modules:

Vehicles
Drivers
Routes
Dispatch
Maintenance
Fuel

Vehicle example:

TRK-0281

Mitsubishi Fuso

Plate:
AD 1234 XX

Driver:
Budi Santoso

Route:
Semarang → Surakarta

Status:
On Route

Fuel:
68%

Next Maintenance:
1,240 km

==================================================
16. ROUTES
==================================================

Create route management.

Example:

Jakarta
→ Cirebon
→ Semarang
→ Surakarta
→ Yogyakarta

Show:
Distance
Estimated duration
Actual duration
On-time rate
Vehicles
Active shipments

Do NOT make a heavy interactive map in the first version.

Use a lightweight route visualization.

==================================================
17. CUSTOMERS
==================================================

Create B2B customer management.

Customer example:

PT Maju Bersama

Customer ID:
CUS-000281

Contact:
Andi Prasetyo

Position:
Purchasing

Phone:
08xxxxxxxxxx

WhatsApp:
08xxxxxxxxxx

Email:
logistics@example.com

Billing Address

Shipping Locations:
- Jakarta Warehouse
- Surakarta Warehouse
- Surabaya Warehouse

Show:
Total Shipments
Active Shipments
Monthly Spending
Delivery Performance
Recent Orders

==================================================
18. SUPPLIERS
==================================================

Create supplier records.

Fields:

Company Name
Supplier ID
Contact Person
Position
Phone
WhatsApp
Email
Address
City
Tax ID placeholder
Bank information placeholder
Services
Status

Show supplier performance:

Delivery reliability
Response time
Total transactions
Active contracts

==================================================
19. ORDERS
==================================================

Create order management.

Order workflow:

Created
Confirmed
Processing
Ready
Dispatched
Completed
Cancelled

Order detail:

Customer
Items
Packages
Origin
Destination
Service
Pricing
Shipment
Payment status

==================================================
20. BILLING
==================================================

Create enterprise billing interface.

Include:

Quotes
Billing records
Invoices
Payments
COD

Invoice example:

INV-00891

Customer:
PT Maju Bersama

Base service
Weight charge
Distance charge
Insurance
Additional service
Tax
Total

Status:
Paid
Partially Paid
Unpaid
Overdue

==================================================
21. ANALYTICS
==================================================

Create professional enterprise analytics.

Sections:

Operations
Warehouse
Fleet
Delivery Performance
Financial

KPIs:

On-time delivery
Average transit time
Failed delivery rate
Warehouse processing time
Cost per shipment
Vehicle utilization
Hub performance

Allow filters:

Date
Warehouse
Hub
Customer
Service
Route

Provide drill-down style interactions.

Reports should feel useful for management, not decorative.

==================================================
22. WORKSPACE
==================================================

Create:

Approvals
Tasks
Documents
Activity Log

Approval example:

Purchase / operational request

Status:
Pending Manager
Pending Finance
Approved
Rejected

Create a clear approval timeline.

Activity Log example:

10:42
Andi updated Shipment NX-928173

10:39
Budi assigned vehicle TRK-0281

10:31
System detected delivery delay

==================================================
23. ROLE & PERMISSION UI
==================================================

Prepare the interface for role-based access control.

Roles:

Super Admin
Operations Manager
Warehouse Manager
Fleet Manager
Finance
Customer Service
Dispatcher
Warehouse Staff
Driver

Do not implement complex backend authorization yet, but design the UI architecture so it can be implemented later.

==================================================
24. AI PLACEHOLDER
==================================================

Do NOT integrate Claude yet.

Create only a subtle UI entry point:

"Ask FARAZZ"

Use a small AI button in appropriate locations.

Example prompts:

"Why did delivery performance decrease this week?"

"Which shipments need attention?"

"Which hub is currently overloaded?"

"Which routes have the highest delay rate?"

The AI layer will be integrated later.

Do not build a fake chatbot as the main feature.

==================================================
25. DESIGN SYSTEM
==================================================

Create reusable components:

Buttons
Inputs
Search
Filters
Tabs
Tables
Cards
Status badges
Dropdowns
Modals
Drawers
Timeline
Charts
Pagination
Breadcrumbs
Empty states
Loading states
Error states
Toast notifications
Confirmation dialogs

Tables must support:
- sorting
- filtering
- pagination
- row actions
- responsive behavior

Use consistent spacing, typography, radius, shadows, and hierarchy.

==================================================
26. UX QUALITY
==================================================

The application must feel designed by a professional enterprise product team.

Prioritize:

Clarity
Speed
Consistency
Discoverability
Accessibility
Data density without clutter
Fast navigation
Clear status
Clear next action

Every page should answer:

1. Where am I?
2. What data am I seeing?
3. What is the current status?
4. What action can I take?
5. What needs attention?

==================================================
27. PERFORMANCE
==================================================

Keep the frontend lightweight.

Avoid:
- heavy animation libraries
- unnecessary 3D
- video backgrounds
- excessive gradients
- huge image assets
- unnecessary dependencies

Use:
- reusable components
- lazy loading where appropriate
- efficient rendering
- responsive layouts
- clean component architecture

==================================================
28. SAMPLE DATA
==================================================

Use realistic Indonesian enterprise logistics dummy data.

Examples:

Customers:
PT Maju Bersama
PT Nusantara Retail
PT Sumber Elektronik
PT Global Distribusi

Warehouses:
Jakarta Central Hub
Semarang Hub
Surakarta Hub
Surabaya Hub
Bandung Hub

Routes:
Jakarta → Cirebon → Semarang
Semarang → Surakarta
Jakarta → Bandung
Surabaya → Malang

Products/packages:
Laptop
Monitor
Network Equipment
Consumer Electronics
Industrial Components
General Cargo

Use realistic but fictional data.

Do not use real people's private information.

==================================================
29. IMPORTANT IMPLEMENTATION RULE
==================================================

For this first version, focus on FRONTEND UI/UX and realistic dummy data.

Do NOT attempt to build:
- real payment processing
- real GPS tracking
- real courier integrations
- real maps API
- real AI API
- real authentication backend
- real database
- real external integrations

The goal of this version is to create a polished enterprise frontend prototype that can later be migrated into a real application.

==================================================
30. FINAL QUALITY BAR
==================================================

The result must NOT look like:
- a school project
- a generic admin dashboard template
- a simple CRUD application
- a generic AI dashboard
- a courier landing page

It should look like:

A serious, modern, scalable enterprise SaaS product designed for a large logistics and supply-chain organization.

Make the product visually impressive through:
- excellent hierarchy
- thoughtful spacing
- clean typography
- meaningful data visualization
- strong navigation
- realistic workflows
- consistent components
- professional responsive behavior

The product should feel original and commercially credible.

Build the application with a coherent design system from the beginning. 
==================================================
31. ADMIN & MANAGEMENT CONSOLE
==================================================

Create a dedicated Admin / Management Console for the company.

IMPORTANT:

The company must be able to manage the contents and configuration of FARAZZ FLOW through the application itself.

This means the system must NOT depend on developers to manually edit frontend code whenever the company wants to add, edit, deactivate, or manage operational data.

Create an administration area accessible from the main application.

ADMIN SECTIONS:

Company Settings
Users
Roles & Permissions
Products
Categories
Warehouses
Warehouse Zones
Customers
Customer Locations
Suppliers
Service Types
Pricing Rules
Vehicles
Drivers
Routes
Notification Settings
Workflow Settings
System Settings

==================================================
32. CRUD MANAGEMENT
==================================================

All major master-data modules should support:

Create
Read
Update
Deactivate
Search
Filter
Sort
Pagination

Use clear action buttons such as:

+ Add New
Edit
View
Deactivate
Delete where appropriate

Prefer "Deactivate" instead of permanent deletion for important business records.

Show confirmation dialogs for destructive actions.

==================================================
33. DYNAMIC DATA
==================================================

The frontend must be designed around dynamic data.

Do NOT hard-code business records into UI components.

For example, if an administrator adds:

"Bandung Central Hub"

through the Admin Console, it should automatically appear wherever warehouses are displayed.

If an administrator adds:

"Express Same Day"

as a service type, it should become available in relevant shipment/order forms.

If an administrator adds a customer, that customer should become selectable in shipment and order workflows.

The UI structure remains consistent while the underlying business data changes dynamically.

==================================================
34. ADMIN DASHBOARD
==================================================

Create an Admin Dashboard showing:

Total Users
Active Users
Warehouses
Customers
Suppliers
Vehicles
Services
Recent Changes

Also show:

Recent administrative activity
Pending approvals
System alerts
Configuration changes

==================================================
35. USER MANAGEMENT
==================================================

Create a professional user management interface.

Fields:

Name
Email
Phone
Role
Department
Status
Last Active
Created Date

Actions:

View
Edit
Deactivate
Reset Access

==================================================
36. ROLE & PERMISSION MANAGEMENT
==================================================

Create a permission matrix.

Example roles:

Super Admin
Operations Manager
Warehouse Manager
Fleet Manager
Finance
Customer Service
Dispatcher
Warehouse Staff
Driver

Permissions should be organized by module:

Dashboard
Shipments
Orders
Warehouse
Inventory
Fleet
Delivery
Customers
Suppliers
Finance
Analytics
Settings

Permission levels:

View
Create
Edit
Approve
Delete / Deactivate

Example:

Warehouse Manager
✓ View Warehouse
✓ Create Inventory Movement
✓ Edit Inventory
✓ Approve Stock Adjustment
✕ Finance
✕ System Settings

Design this as a clear permission matrix.

==================================================
37. MASTER DATA MANAGEMENT
==================================================

Create dedicated management pages for:

Products
Categories
Warehouses
Customers
Suppliers
Vehicles
Drivers
Routes
Service Types
Pricing

Each management page should have:

Page title
Description
Search
Filters
Add button
Data table
Pagination
Row actions

Example:

WAREHOUSES

[ Search warehouses... ] [Status] [Region]

[ + Add Warehouse ]

Warehouse
Code
Location
Capacity
Utilization
Status
Actions

==================================================
38. COMPANY CONFIGURATION
==================================================

Create company settings.

Fields:

Company Name
Company Logo
Company ID
Address
Phone
Email
Website
Tax information placeholder
Default currency
Timezone
Date format

Allow the company branding to be configured without changing application code.

==================================================
39. CONFIGURABLE WORKFLOWS
==================================================

Prepare the UI architecture for configurable business workflows.

For example:

Shipment workflow:

Created
→ Picked Up
→ Sorting
→ Dispatched
→ In Transit
→ Out for Delivery
→ Delivered

Administrators should eventually be able to configure workflow rules and statuses.

Do not build a complex workflow builder yet.

Create a clean configuration interface placeholder that can be expanded later.

==================================================
40. AUDIT LOG
==================================================

Every important administrative change should be designed to be auditable.

Example:

10 Aug 2026 · 14:32
Admin updated warehouse capacity

10 Aug 2026 · 14:18
Operations Manager added shipment service

10 Aug 2026 · 13:52
Warehouse Manager adjusted inventory

Show:

User
Action
Module
Record
Timestamp
Previous value
New value

This will later connect to a real backend audit log.

==================================================
41. DATA ARCHITECTURE
==================================================

The frontend should be structured so that all business data can later be connected to a real backend API and database.

Use reusable data-driven components.

Avoid hard-coded values wherever they represent business entities.

Use realistic mock data for this prototype, but structure components as if the data will come from APIs.

The eventual architecture should support:

Frontend
→ API
→ Business Logic
→ Database

Do not attempt to implement the production backend in this first frontend prototype.

==================================================
42. IMPORTANT UX RULE
==================================================

The Admin Console must feel like part of the same FARAZZ FLOW product.

Do NOT make it look like a separate generic admin template.

Use the same:

Typography
Spacing
Colors
Components
Navigation
Status system
Interaction patterns

The company should feel like it owns and controls the platform through this console.

==================================================
43. FINAL PRODUCT BEHAVIOR
==================================================

The final prototype should demonstrate this relationship:

ADMIN
↓
Creates / edits business data
↓
Mock database state changes
↓
Operational modules consume the data
↓
Dashboard reflects updated information

Example:

Admin creates a new warehouse:

"Bandung Central Hub"

↓

Warehouse list updates

↓

Shipment forms can select Bandung Central Hub

↓

Dashboard warehouse count increases

↓

Analytics can include Bandung Central Hub

The prototype should demonstrate this dynamic relationship wherever practical.

Do not create disconnected pages.

The entire application should feel like ONE coherent enterprise system.
==================================================
44. MULTILINGUAL
================

Add a built-in language switcher for:

🇮🇩 Bahasa Indonesia
🇬🇧 English

The selected language must update the entire UI, including:

* Navigation
* Dashboard
* Buttons
* Forms
* Tables
* Status labels
* Notifications
* Settings
* Error and confirmation messages

Use a centralized translation structure so additional languages can be added later.

The selected language should persist while navigating.

Do not translate business data such as company names, customer names, SKU, tracking IDs, addresses, or invoice numbers.

Prepare the UI for future languages such as Japanese, Chinese, Korean, Arabic, and Spanish.

Keep the design responsive when translated text becomes longer or shorter.

==================================================

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0dbb977f-ca97-423b-a3b4-58611c4b70b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

---

## FARAZZ FLOW API (backend)

A production-grade Express API lives in `backend/` and backs the frontend when
reachable (the UI auto-detects it and falls back to local seed data otherwise).

### Stack

- **Node.js + Express + TypeScript** (`tsx` for dev)
- **MySQL 8** (`mysql2`), schema migration runner in `database/migrations/`
- **RBAC** — roles + permission matrix, enforced per route
- **Auth** — scrypt password hashing, SHA-256 session digests, HttpOnly + SameSite=Lax cookies
- **CSRF** — double-submit, HMAC-signed `x-csrf-token` header required on all state-changing calls
- **Rate limiting**, account lockout, helmet + CORS, audit logs + security events

### Getting started

```sh
cd backend
npm i
npm run migrate       # runs pending migrations in database/migrations/
npm run seed          # seeds roles, demo users, and lookups
npm run dev           # tsx watch on http://localhost:4100
```

Copy `backend/.env.example` to `backend/.env` (or keep the root `.env`) and set:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=farazz_flow
DB_USER=root
DB_PASSWORD=
PORT=4100
ENV=development
```

### Demo accounts (all passwords `Admin123!`)

| Role              | Email                                   |
| ----------------- | --------------------------------------- |
| Super Admin       | faraz@farazzflow.example.com            |
| Operations        | test.ops@farazzflow.example.com         |
| Warehouse         | test.warehouse@farazzflow.example.com   |
| Fleet             | test.fleet@farazzflow.example.com       |
| Finance           | test.finance@farazzflow.example.com     |
| Dispatcher        | test.dispatcher@farazzflow.example.com  |
| Customer Service  | test.cs@farazzflow.example.com          |
| Driver            | test.driver@farazzflow.example.com      |

### API surface

Mounted under `/api/v1`:

- `auth` — login, logout, me, change-password, revoke-sessions
- `health`, `health/db`
- Operations: `customers`, `suppliers`, `shipments` (incl. `status`, `status-history`),
  `orders`, `deliveries`, `exceptions` (incl. `resolve`), `returns`, `service-types`,
  `pricing`, `contracts`
- Warehouse: `warehouses`, `warehouse-zones`, `inventory`, `inbound`, `outbound`, `sorting`
- Fleet: `vehicles`, `drivers`, `routes`, `dispatches`, `maintenance`
- Finance: `billing` (incl. `bill-items`), `payments`, `cod`
- Workspace: `approvals` (incl. `decide`), `tasks`, `documents`, `notifications`, `realtime` (SSE)
- Admin: `admin/users`, `admin/roles`, `admin/audit`, `admin/security-events`
- Extras: `files` (base64 upload + download + versions), `import-export` (CSV import),
  `reports` (8 aggregations), `monitoring` (overview/database/activity/health)

Response envelope (same everywhere):

```json
{ "success": true, "data": { "rows": [], "total": 0 } }
```

Errors: `{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }`

### Verification

```sh
cd backend
npm test          # unit tests (node:test — 10/10)
npm run backup    # mysqldump → gzip into backend/backups/ (default keep 15)
```

The full HTTP smoke suite (`84` checks: every router CRUD, shipment/order/delivery/
dispatch/finance lifecycles, RBAC denials) lives at `backend/scripts/smoke.ps1`
(Windows) or can be replayed from the repo root.

### Frontend integration

`src/lib/farazz/api.ts` is the typed client (session + CSRF handling, CRUD,
workflow helpers). `src/lib/farazz/session.tsx` probes `/health` and exposes a
**Live API / Demo mode** indicator in the shell; log in with a real backend
account to use live data, or keep using the built-in demo directory.
Configure the API base with `VITE_API_URL` (default `http://localhost:4100/api/v1`).
