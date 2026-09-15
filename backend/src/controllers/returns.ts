import { Router } from "express";
import { z } from "zod";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { transitionFlow, RETURN_FLOW } from "../services/workflow.js";
import { auditLog } from "../services/audit.js";
import { makeCrud } from "../services/crud.js";

const returnCreate = z.object({
  shipment_id: z.number().int().positive().optional().nullable(),
  order_id: z.number().int().positive().optional().nullable(),
  reason: z.string().min(2).max(190),
  notes: z.string().optional().nullable(),
  request_date: z.string().optional(),
});

export const returnsRouter = makeCrud({
  table: "returns",
  resource: "return",
  module: "orders",
  selectClause: "r.*, s.shipment_no, o.order_no, u.name AS created_by_name",
  fromClause:
    "FROM returns r LEFT JOIN shipments s ON s.id = r.shipment_id LEFT JOIN orders o ON o.id = r.order_id LEFT JOIN users u ON u.id = r.created_by",
  pkQualified: "r.id",
  search: ["r.return_no", "s.shipment_no", "o.order_no", "r.reason"],
  enumFilters: { status: ["requested", "approved", "picked_up", "returned", "rejected"] },
  createSchema: returnCreate,
  createdBy: true,
  autoCode: { column: "return_no", prefix: "RTN" },
  orderBy: "r.created_at DESC",
});

const statusSchema = z.object({ status: z.string().min(1).max(48) });

returnsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());
    const transition = await transitionFlow("returns", RETURN_FLOW, id, parsed.data.status, req.user!.id);
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "return",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, transition });
  })
);