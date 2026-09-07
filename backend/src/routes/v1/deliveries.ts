import { Router } from "express";
import { z } from "zod";
import { execute, query } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { transitionFlow, DELIVERY_FLOW } from "../../lib/workflow.js";
import { auditLog } from "../../services/audit.js";
import { makeCrud } from "../../lib/crud.js";
import type { RowDataPacket } from "mysql2/promise";

const deliveryCreate = z.object({
  shipment_id: z.number().int().positive().optional().nullable(),
  vehicle_id: z.number().int().positive().optional().nullable(),
  driver_id: z.number().int().positive().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(96).optional().nullable(),
  recipient_name: z.string().max(128).optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const deliveriesRouter = makeCrud({
  table: "deliveries",
  resource: "delivery",
  module: "delivery",
  selectClause: "d.*, s.shipment_no, v.plate_no, u.name AS driver_name",
  fromClause:
    "FROM deliveries d LEFT JOIN shipments s ON s.id = d.shipment_id LEFT JOIN vehicles v ON v.id = d.vehicle_id LEFT JOIN drivers dr ON dr.id = d.driver_id LEFT JOIN users u ON u.id = dr.user_id",
  pkQualified: "d.id",
  search: ["d.delivery_no", "s.shipment_no", "v.plate_no", "d.address", "d.recipient_name"],
  enumFilters: { status: ["scheduled", "out_for_delivery", "delivered", "failed_attempt", "returned"] },
  createSchema: deliveryCreate,
  autoCode: { column: "delivery_no", prefix: "DLV" },
  orderBy: "d.created_at DESC",
});

const statusSchema = z.object({ status: z.string().min(1).max(48) });

deliveriesRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());
    const transition = await transitionFlow("deliveries", DELIVERY_FLOW, id, parsed.data.status, req.user!.id);
    await execute("UPDATE deliveries SET delivered_at = IF(?, NOW(), NULL) WHERE id = ?", [parsed.data.status === "delivered" ? 1 : 0, id]);

    // Mirror into the linked shipment where sensible.
    if (parsed.data.status === "delivered") {
      const rows = await query<RowDataPacket>("SELECT shipment_id FROM deliveries WHERE id = ?", [id]);
      const shipmentId = rows[0]?.shipment_id;
      if (shipmentId) {
        try {
          await execute("UPDATE shipments SET status = 'delivered', delivered_at = NOW() WHERE id = ? AND status NOT IN ('cancelled','delivered')", [shipmentId]);
        } catch {
          /* non-fatal */
        }
      }
    }
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "delivery",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, transition });
  })
);