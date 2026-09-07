import { makeCrud } from "../../lib/crud.js";
import { z } from "zod";

// ─── Suppliers ────────────────────────────────────────────────────────────
const supplierCreate = z.object({
  name: z.string().min(2).max(190),
  contact_person: z.string().max(128).optional().nullable(),
  email: z.string().email().max(190).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  category: z.string().max(64).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().optional().nullable(),
});

export const suppliersRouter = makeCrud({
  table: "suppliers",
  resource: "supplier",
  module: "suppliers",
  search: ["code", "name", "city", "email", "category"],
  enumFilters: { status: ["active", "inactive"] },
  createSchema: supplierCreate,
  autoCode: { column: "code", prefix: "SUP" },
  softDelete: true,
});

// ─── Service types ────────────────────────────────────────────────────────
const serviceCreate = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(2).max(128),
  description: z.string().max(255).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const serviceTypesRouter = makeCrud({
  table: "service_types",
  resource: "service type",
  module: "settings",
  search: ["code", "name"],
  enumFilters: { status: ["active", "inactive"] },
  createSchema: serviceCreate,
  softDelete: false,
  orderBy: "code ASC",
});

// ─── Pricing rules ────────────────────────────────────────────────────────
const pricingCreate = z.object({
  route_id: z.number().int().positive().optional().nullable(),
  service_type_id: z.number().int().positive().optional().nullable(),
  weight_min_kg: z.number().min(0).optional().nullable(),
  weight_max_kg: z.number().min(0).optional().nullable(),
  base_price: z.number().min(0),
  price_per_kg: z.number().min(0).optional().nullable(),
  price_per_m3: z.number().min(0).optional().nullable(),
  min_charge: z.number().min(0).optional().nullable(),
  effective_from: z.string(),
  effective_to: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const pricingRouter = makeCrud({
  table: "pricing_rules",
  resource: "pricing rule",
  module: "settings",
  selectClause: "pr.*, r.route_code, r.name AS route_name, st.name AS service_name",
  fromClause:
    "FROM pricing_rules pr LEFT JOIN routes r ON r.id = pr.route_id LEFT JOIN service_types st ON st.id = pr.service_type_id",
  pkQualified: "pr.id",
  enumFilters: { status: ["active", "inactive"] },
  createSchema: pricingCreate,
  softDelete: false,
  orderBy: "pr.effective_from DESC",
});

// ─── Contracts ────────────────────────────────────────────────────────────
const contractCreate = z.object({
  customer_id: z.number().int().positive().optional().nullable(),
  title: z.string().min(2).max(190),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  value: z.number().min(0).optional().nullable(),
  status: z.enum(["draft", "active", "expired", "terminated"]).optional(),
  terms: z.string().optional().nullable(),
});

export const contractsRouter = makeCrud({
  table: "contracts",
  resource: "contract",
  module: "customers",
  selectClause: "ct.*, c.name AS customer_name",
  fromClause: "FROM contracts ct LEFT JOIN customers c ON c.id = ct.customer_id",
  pkQualified: "ct.id",
  search: ["ct.contract_no", "ct.title", "c.name"],
  enumFilters: { status: ["draft", "active", "expired", "terminated"] },
  createSchema: contractCreate,
  createdBy: true,
  autoCode: { column: "contract_no", prefix: "CT" },
  orderBy: "ct.created_at DESC",
});