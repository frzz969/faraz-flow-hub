import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "../repositories/db.js";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { transitionFlow, ORDER_FLOW } from "../services/workflow.js";
import { auditLog } from "../services/audit.js";
import { makeCrud } from "../services/crud.js";

const orderCreate = z.object({
  customer_id: z.number().int().positive().optional().nullable(),
  shipment_id: z.number().int().positive().optional().nullable(),
  order_date: z.string(),
  total_amount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const ordersRouter = makeCrud({
  table: "orders",
  resource: "order",
  module: "orders",
  selectClause: "o.*, c.name AS customer_name, s.shipment_no",
  fromClause: "FROM orders o LEFT JOIN customers c ON c.id = o.customer_id LEFT JOIN shipments s ON s.id = o.shipment_id",
  pkQualified: "o.id",
  search: ["o.order_no", "c.name", "o.notes"],
  enumFilters: { status: ["draft", "confirmed", "processing", "completed", "cancelled"] },
  dateFilters: ["order_date"],
  createSchema: orderCreate,
  createdBy: true,
  autoCode: { column: "order_no", prefix: "ORD" },
  orderBy: "o.created_at DESC",
});

const statusSchema = z.object({
  status: z.string().min(1).max(48),
});

ordersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());
    const transition = await transitionFlow("orders", ORDER_FLOW, id, parsed.data.status, req.user!.id);
    await execute("UPDATE orders SET completed_at = IF(?, NOW(), NULL) WHERE id = ?", [parsed.data.status === "completed" ? 1 : 0, id]);
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "order",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, transition });
  })
);