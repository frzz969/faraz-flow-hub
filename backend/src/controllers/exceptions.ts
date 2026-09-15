import { Router } from "express";
import { z } from "zod";
import { execute } from "../repositories/db.js";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { transitionFlow, EXCEPTION_FLOW, advanceShipmentStatus } from "../services/workflow.js";
import { auditLog } from "../services/audit.js";
import { publish } from "../lib/realtime.js";
import { makeCrud } from "../services/crud.js";

const exceptionCreate = z.object({
  shipment_id: z.number().int().positive(),
  exception_type: z.enum(["address_mismatch", "damaged", "not_home", "delayed", "wrong_item", "rejected", "other"]),
  severity: z.enum(["low", "medium", "high"]).optional(),
  description: z.string().optional().nullable(),
});

export const exceptionsRouter = makeCrud({
  table: "exceptions",
  resource: "exception",
  module: "shipments",
  selectClause: "e.*, s.shipment_no, u.name AS reported_by_name",
  fromClause: "FROM exceptions e LEFT JOIN shipments s ON s.id = e.shipment_id LEFT JOIN users u ON u.id = e.reported_by",
  pkQualified: "e.id",
  search: ["e.exception_type", "s.shipment_no", "e.description"],
  enumFilters: { status: ["open", "reviewing", "resolved", "closed"], severity: ["low", "medium", "high"] },
  createSchema: exceptionCreate,
  orderBy: "e.created_at DESC",
});

// Exception router exposes CRUD + status transitions.
// Creating an exception flips the shipment to exception state (see workflow.ts).

const resolveSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "closed"]),
  note: z.string().max(255).optional().nullable(),
});

exceptionsRouter.patch(
  "/:id/resolve",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = resolveSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid payload", parsed.error.flatten());
    const transition = await transitionFlow("exceptions", EXCEPTION_FLOW, id, parsed.data.status, req.user!.id);
    if (parsed.data.note) {
      await execute("UPDATE exceptions SET resolved_note = ?, resolved_by = ? WHERE id = ?", [parsed.data.note, req.user!.id, id]);
    }
    // exception → resolved: nudge shipment back to out_for_delivery
    if (parsed.data.status === "resolved") {
      const rows = await import("../repositories/db.js").then((m) => m.query<{ shipment_id: number | null } & import("mysql2/promise").RowDataPacket>("SELECT shipment_id FROM exceptions WHERE id = ?", [id]));
      const shipmentId = rows[0]?.shipment_id;
      if (shipmentId) {
        try {
          await advanceShipmentStatus(shipmentId, "out_for_delivery", `Exception resolved (${id})`, req.user!.id);
        } catch {
          /* shipment may already be elsewhere */
        }
      }
    }
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "exception",
      resourceId: id,
      after: { status: parsed.data.status, note: parsed.data.note ?? null },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    publish(req.user!.id, "exception:status", { id, status: parsed.data.status });
    success(res, { id, transition });
  })
);