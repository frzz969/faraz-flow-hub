import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { advanceShipmentStatus } from "../../lib/workflow.js";
import { publish } from "../../lib/realtime.js";
import { auditLog } from "../../services/audit.js";
import { makeCrud } from "../../lib/crud.js";

const shipmentCreate = z.object({
  customer_id: z.number().int().positive().optional().nullable(),
  origin: z.string().min(2).max(128),
  destination: z.string().min(2).max(128),
  origin_city: z.string().max(96).optional().nullable(),
  destination_city: z.string().max(96).optional().nullable(),
  service_type: z.string().max(48).optional().nullable(),
  weight_kg: z.number().min(0).optional().nullable(),
  volume_m3: z.number().min(0).optional().nullable(),
  declared_value: z.number().min(0).optional().nullable(),
  cod_amount: z.number().min(0).optional().nullable(),
  base_fare: z.number().min(0).optional().nullable(),
  fuel_surcharge: z.number().min(0).optional().nullable(),
  extra_charge: z.number().min(0).optional().nullable(),
  total_amount: z.number().min(0).optional().nullable(),
  customer_note: z.string().optional().nullable(),
  planned_date: z.string().optional().nullable(),
  courier_name: z.string().max(128).optional().nullable(),
  reference: z.string().max(64).optional().nullable(),
});

export const shipmentsRouter = makeCrud({
  table: "shipments",
  resource: "shipment",
  module: "shipments",
  selectClause: "s.*, c.name AS customer_name, c.code AS customer_code",
  fromClause: "FROM shipments s LEFT JOIN customers c ON c.id = s.customer_id",
  pkQualified: "s.id",
  search: ["s.shipment_no", "s.origin", "s.destination", "s.courier_name", "s.reference", "c.name"],
  enumFilters: { status: ["pending", "booked", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "exception"] },
  dateFilters: ["planned_date", "created_at"],
  createSchema: shipmentCreate,
  createdBy: true,
  autoCode: { column: "shipment_no", prefix: "SHP" },
  orderBy: "s.created_at DESC",
});

// ─── Status advance + history ────────────────────────────────────────────
const statusSchema = z.object({
  status: z.string().min(1).max(48),
  note: z.string().max(255).optional().nullable(),
});

shipmentsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());

    const transition = await advanceShipmentStatus(id, parsed.data.status, parsed.data.note ?? null, req.user!.id);
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "shipment",
      resourceId: id,
      before: { status: transition.from },
      after: { status: transition.to },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    publish(req.user!.id, "shipment:status", { id, from: transition.from, to: transition.to });
    success(res, { id, from: transition.from, to: transition.to });
  })
);

shipmentsRouter.get(
  "/:id/status-history",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const rows = await query<RowDataPacket>(
      `SELECT sh.status, sh.note, sh.changed_at, u.name AS changed_by
       FROM shipment_status_history sh
       LEFT JOIN users u ON u.id = sh.changed_by
       WHERE sh.shipment_id = ? ORDER BY sh.changed_at DESC`,
      [id]
    );
    success(res, { history: rows });
  })
);