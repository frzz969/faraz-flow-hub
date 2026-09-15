import { makeCrud } from "../services/crud.js";
import { z } from "zod";

const customerCreate = z.object({
  name: z.string().min(2).max(190),
  type: z.enum(["shipper", "consignee", "both"]).optional(),
  contact_person: z.string().max(128).optional().nullable(),
  email: z.string().email().max(190).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(96).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().optional().nullable(),
});

export const customersRouter = makeCrud({
  table: "customers",
  resource: "customer",
  module: "customers",
  search: ["code", "name", "city", "email"],
  enumFilters: { status: ["active", "inactive"], type: ["shipper", "consignee", "both"] },
  createSchema: customerCreate,
  autoCode: { column: "code", prefix: "CUS" },
  softDelete: true,
});