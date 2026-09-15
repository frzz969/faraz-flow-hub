import { Router } from "express";
import { z } from "zod";
import { query, execute } from "../repositories/db.js";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { auditLog } from "../services/audit.js";
import { makeCrud } from "../services/crud.js";

// ─── Vehicles ─────────────────────────────────────────────────────────────
const vehicleCreate = z.object({
  plate_no: z.string().min(2).max(24),
  model: z.string().max(96).optional().nullable(),
  type: z.string().max(48).optional().nullable(),
  capacity_kg: z.number().min(0).optional().nullable(),
  capacity_m3: z.number().min(0).optional().nullable(),
  status: z.enum(["available", "in_use", "maintenance", "retired"]).optional(),
  odometer: z.number().min(0).optional().nullable(),
});

export const vehiclesRouter = makeCrud({
  table: "vehicles",
  resource: "vehicle",
  module: "fleet",
  search: ["plate_no", "model", "type"],
  enumFilters: { status: ["available", "in_use", "maintenance", "retired"] },
  createSchema: vehicleCreate,
  orderBy: "created_at DESC",
});

// ─── Drivers ──────────────────────────────────────────────────────────────
const driverCreate = z.object({
  user_id: z.number().int().positive().optional().nullable(),
  license_no: z.string().max(48).optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  status: z.enum(["available", "on_duty", "off_duty", "suspended"]).optional(),
});

export const driversRouter = makeCrud({
  table: "drivers",
  resource: "driver",
  module: "fleet",
  selectClause: "d.*, u.name AS name, u.email",
  fromClause: "FROM drivers d LEFT JOIN users u ON u.id = d.user_id",
  pkQualified: "d.id",
  search: ["u.name", "d.license_no", "d.phone"],
  enumFilters: { status: ["available", "on_duty", "off_duty", "suspended"] },
  createSchema: driverCreate,
  orderBy: "d.created_at DESC",
});

// ─── Routes ───────────────────────────────────────────────────────────────
const routeCreate = z.object({
  name: z.string().max(128).optional().nullable(),
  origin: z.string().min(2).max(128),
  destination: z.string().min(2).max(128),
  distance_km: z.number().min(0).optional().nullable(),
  estimated_min: z.number().int().min(0).optional().nullable(),
  vehicle_type: z.string().max(48).optional().nullable(),
  base_price: z.number().min(0).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const routesRouter = makeCrud({
  table: "routes",
  resource: "route",
  module: "fleet",
  search: ["route_code", "name", "origin", "destination"],
  enumFilters: { status: ["active", "inactive"] },
  createSchema: routeCreate,
  autoCode: { column: "route_code", prefix: "RT" },
  orderBy: "created_at DESC",
});

// ─── Dispatches ───────────────────────────────────────────────────────────
const dispatchCreate = z.object({
  route_id: z.number().int().positive().optional().nullable(),
  shipment_id: z.number().int().positive().optional().nullable(),
  vehicle_id: z.number().int().positive().optional().nullable(),
  driver_id: z.number().int().positive().optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const dispatchesRouter = makeCrud({
  table: "dispatches",
  resource: "dispatch",
  module: "fleet",
  selectClause:
    "dp.*, r.name AS route_name, r.route_code, s.shipment_no, v.plate_no, u.name AS driver_name",
  fromClause:
    "FROM dispatches dp LEFT JOIN routes r ON r.id = dp.route_id LEFT JOIN shipments s ON s.id = dp.shipment_id LEFT JOIN vehicles v ON v.id = dp.vehicle_id LEFT JOIN drivers dr ON dr.id = dp.driver_id LEFT JOIN users u ON u.id = dr.user_id",
  pkQualified: "dp.id",
  search: ["dp.dispatch_no", "s.shipment_no", "v.plate_no"],
  enumFilters: { status: ["planned", "dispatch", "on_route", "completed", "cancelled"] },
  createSchema: dispatchCreate,
  createdBy: true,
  autoCode: { column: "dispatch_no", prefix: "DSP" },
  orderBy: "dp.created_at DESC",
});

const dispatchStatusSchema = z.object({ status: z.enum(["planned", "dispatch", "on_route", "completed", "cancelled"]) });

dispatchesRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = dispatchStatusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid dispatch status", parsed.error.flatten());

    const rows = await query<{ status: string; vehicle_id: number | null; driver_id: number | null } & import("mysql2/promise").RowDataPacket>(
      "SELECT status, vehicle_id, driver_id FROM dispatches WHERE id = ?",
      [id]
    );
    const dispatch = rows[0];
    if (!dispatch) throw ApiError.notFound("Dispatch not found");

    const sets: string[] = ["status = ?"];
    if (parsed.data.status === "dispatch" && dispatch.status === "planned") sets.push("departed_at = NOW()");
    if (parsed.data.status === "completed") sets.push("arrived_at = NOW()");
    sets.push("updated_at = NOW()");

    await execute(`UPDATE dispatches SET ${sets.join(", ")} WHERE id = ?`, [parsed.data.status, id]);

    // Vehicle & driver availability bookkeeping.
    if (parsed.data.status === "completed" && dispatch.vehicle_id) {
      await execute("UPDATE vehicles SET status = 'available' WHERE id = ?", [dispatch.vehicle_id]);
    }
    if (parsed.data.status === "dispatch" && dispatch.vehicle_id) {
      await execute("UPDATE vehicles SET status = 'in_use' WHERE id = ?", [dispatch.vehicle_id]);
    }
    if (parsed.data.status === "dispatch" && dispatch.driver_id) {
      await execute("UPDATE drivers SET status = 'on_duty' WHERE id = ?", [dispatch.driver_id]);
    }
    if (parsed.data.status === "completed" && dispatch.driver_id) {
      await execute("UPDATE drivers SET status = 'available' WHERE id = ?", [dispatch.driver_id]);
    }

    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "dispatch",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, status: parsed.data.status });
  })
);

// ─── Maintenance records ──────────────────────────────────────────────────
const maintCreate = z.object({
  vehicle_id: z.number().int().positive(),
  maintenance_type: z.string().min(2).max(64),
  scheduled_date: z.string().optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
  assignee_id: z.number().int().positive().optional().nullable(),
});

export const maintenanceRouter = makeCrud({
  table: "maintenance_records",
  resource: "maintenance record",
  module: "fleet",
  selectClause: "m.*, v.plate_no, v.model, u.name AS assignee_name",
  fromClause:
    "FROM maintenance_records m LEFT JOIN vehicles v ON v.id = m.vehicle_id LEFT JOIN users u ON u.id = m.assignee_id",
  pkQualified: "m.id",
  search: ["m.maintenance_type", "v.plate_no"],
  enumFilters: { status: ["scheduled", "in_progress", "completed", "cancelled"] },
  createSchema: maintCreate,
  orderBy: "m.created_at DESC",
});