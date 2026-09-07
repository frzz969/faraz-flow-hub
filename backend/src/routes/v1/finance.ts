import { Router } from "express";
import { z } from "zod";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { auditLog } from "../../services/audit.js";
import { makeCrud } from "../../lib/crud.js";

// ─── Billing documents ────────────────────────────────────────────────────
const billCreate = z.object({
  doc_type: z.enum(["estimate", "invoice", "receipt"]),
  customer_id: z.number().int().positive().optional().nullable(),
  shipment_id: z.number().int().positive().optional().nullable(),
  issue_date: z.string(),
  due_date: z.string().optional().nullable(),
  sub_total: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  tax_rate: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  status: z.enum(["draft", "sent", "partial", "settled", "cancelled", "overdue"]).optional(),
  notes: z.string().optional().nullable(),
});

export const billingRouter = makeCrud({
  table: "billing_documents",
  resource: "billing document",
  module: "finance",
  selectClause: "bd.*, c.name AS customer_name, c.code AS customer_code, s.shipment_no",
  fromClause:
    "FROM billing_documents bd LEFT JOIN customers c ON c.id = bd.customer_id LEFT JOIN shipments s ON s.id = bd.shipment_id",
  pkQualified: "bd.id",
  search: ["bd.doc_no", "c.name", "s.shipment_no"],
  enumFilters: { status: ["draft", "sent", "partial", "settled", "cancelled", "overdue"], doc_type: ["estimate", "invoice", "receipt"] },
  dateFilters: ["issue_date", "due_date"],
  createSchema: billCreate,
  createdBy: true,
  autoCode: { column: "doc_no", prefix: "INV" },
  orderBy: "bd.created_at DESC",
});

// Invoice items
const itemSchema = z.object({
  description: z.string().min(1).max(255),
  quantity: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
});

export const billItemsRouter = Router();
billItemsRouter.use(attachUser, requireAuth);

billItemsRouter.get("/:invoiceId", asyncHandler(async (req, res) => {
  const rows = await query<import("mysql2/promise").RowDataPacket>(
    "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id",
    [Number(req.params.invoiceId)]
  );
  success(res, { rows });
}));

billItemsRouter.post("/:invoiceId", asyncHandler(async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid item payload", parsed.error.flatten());
  const result = await execute(
    "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)",
    [
      Number(req.params.invoiceId),
      parsed.data.description,
      parsed.data.quantity ?? 1,
      parsed.data.unit_price ?? 0,
      (parsed.data.quantity ?? 1) * (parsed.data.unit_price ?? 0),
    ]
  );
  success(res, { id: result.insertId }, 201);
}));

billItemsRouter.delete("/:invoiceId/:itemId", asyncHandler(async (req, res) => {
  await execute("DELETE FROM invoice_items WHERE id = ? AND invoice_id = ?", [
    Number(req.params.itemId),
    Number(req.params.invoiceId),
  ]);
  success(res, { deleted: true });
}));

const billStatusSchema = z.object({ status: z.enum(["draft", "sent", "partial", "settled", "cancelled", "overdue"]) });

billingRouter.patch("/:id/status", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const parsed = billStatusSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());
  const paidAt = parsed.data.status === "settled" || parsed.data.status === "partial" ? "NOW()" : "paid_at";
  await execute(`UPDATE billing_documents SET status = ?, paid_at = ${paidAt} WHERE id = ?`, [parsed.data.status, id]);
  await auditLog({
    user: { id: req.user!.id },
    action: "UPDATE",
    resource: "billing document",
    resourceId: id,
    after: { status: parsed.data.status },
    ip: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  });
  success(res, { id, status: parsed.data.status });
}));

// ─── Payments ─────────────────────────────────────────────────────────────
const paymentCreate = z.object({
  invoice_id: z.number().int().positive().optional().nullable(),
  customer_id: z.number().int().positive().optional().nullable(),
  method: z.string().min(2).max(48),
  amount: z.number().min(0.01),
  status: z.enum(["pending", "success", "failed", "refunded", "cancelled"]).optional(),
  reference: z.string().max(64).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const paymentsRouter = makeCrud({
  table: "payments",
  resource: "payment",
  module: "finance",
  selectClause: "p.*, c.name AS customer_name, bd.doc_no AS invoice_no",
  fromClause:
    "FROM payments p LEFT JOIN customers c ON c.id = p.customer_id LEFT JOIN billing_documents bd ON bd.id = p.invoice_id",
  pkQualified: "p.id",
  search: ["p.payment_no", "p.reference", "c.name", "p.method"],
  enumFilters: { status: ["pending", "success", "failed", "refunded", "cancelled"] },
  createSchema: paymentCreate,
  autoCode: { column: "payment_no", prefix: "PAY" },
  orderBy: "p.created_at DESC",
});

// ─── COD settlements ──────────────────────────────────────────────────────
const codCreate = z.object({
  shipment_id: z.number().int().positive().optional().nullable(),
  cod_amount: z.number().min(0),
  fee: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const codRouter = makeCrud({
  table: "cod_settlements",
  resource: "COD settlement",
  module: "finance",
  selectClause: "c.*, s.shipment_no",
  fromClause: "FROM cod_settlements c LEFT JOIN shipments s ON s.id = c.shipment_id",
  pkQualified: "c.id",
  search: ["c.settlement_no", "s.shipment_no"],
  enumFilters: { status: ["pending", "collected", "transferred", "released", "disputed"] },
  createSchema: codCreate,
  autoCode: { column: "settlement_no", prefix: "COD" },
  orderBy: "c.created_at DESC",
});