import { Router } from "express";
import { z } from "zod";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { auditLog } from "../../services/audit.js";
import { publish } from "../../lib/realtime.js";
import { makeCrud } from "../../lib/crud.js";

// ─── Approvals ────────────────────────────────────────────────────────────
const approvalCreate = z.object({
  title: z.string().min(2).max(190),
  category: z.enum(["shipment", "contract", "payment", "purchase", "leave", "expense", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  description: z.string().optional().nullable(),
  resource: z.string().max(64).optional().nullable(),
  resource_id: z.string().max(128).optional().nullable(),
});

export const approvalsRouter = makeCrud({
  table: "approvals",
  resource: "approval",
  module: "settings",
  selectClause: "a.*, requestor.name AS requestor_name, approver.name AS approver_name",
  fromClause:
    "FROM approvals a LEFT JOIN users requestor ON requestor.id = a.requestor_id LEFT JOIN users approver ON approver.id = a.approver_id",
  pkQualified: "a.id",
  search: ["a.approval_no", "a.title", "a.category"],
  enumFilters: { status: ["pending", "approved", "rejected", "cancelled"], category: ["shipment", "contract", "payment", "purchase", "leave", "expense", "other"], priority: ["low", "medium", "high", "urgent"] },
  createSchema: approvalCreate,
  createdBy: true,
  createdByColumn: "requestor_id",
  autoCode: { column: "approval_no", prefix: "APR" },
  orderBy: "a.created_at DESC",
});

const decideSchema = z.object({ decision: z.enum(["approved", "rejected"]), note: z.string().max(255).optional().nullable() });

approvalsRouter.patch(
  "/:id/decide",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = decideSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid decision payload", parsed.error.flatten());

    const rows = await query<{ id: number; status: string; requestor_id: number | null; title: string } & import("mysql2/promise").RowDataPacket>(
      "SELECT id, status, requestor_id, title FROM approvals WHERE id = ?",
      [id]
    );
    const approval = rows[0];
    if (!approval) throw ApiError.notFound("Approval not found");
    if (approval.status !== "pending") throw ApiError.conflict(`Approval already ${approval.status}`);

    await execute(
      "UPDATE approvals SET status = ?, approver_id = ?, decided_at = NOW(), decision_note = ? WHERE id = ?",
      [parsed.data.decision, req.user!.id, parsed.data.note ?? null, id]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: parsed.data.decision === "approved" ? "APPROVE" : "REJECT",
      resource: "approval",
      resourceId: id,
      after: { decision: parsed.data.decision, note: parsed.data.note ?? null },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    if (approval.requestor_id) {
      await execute(
        "INSERT INTO notifications (user_id, type, title, message, resource, resource_id) VALUES (?, 'approval', ?, ?, 'approval', ?)",
        [approval.requestor_id, `Approval ${parsed.data.decision}`, approval.title.slice(0, 190), String(id)]
      );
      publish(approval.requestor_id, "approval:decided", { id, decision: parsed.data.decision, title: approval.title });
    }
    success(res, { id, decision: parsed.data.decision });
  })
);

// ─── Tasks ────────────────────────────────────────────────────────────────
const taskCreate = z.object({
  title: z.string().min(2).max(190),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignee_id: z.number().int().positive().optional().nullable(),
  due_date: z.string().optional().nullable(),
  resource: z.string().max(64).optional().nullable(),
  resource_id: z.string().max(128).optional().nullable(),
});

export const tasksRouter = makeCrud({
  table: "tasks",
  resource: "task",
  module: "settings",
  selectClause: "t.*, assignee.name AS assignee_name, creator.name AS creator_name",
  fromClause:
    "FROM tasks t LEFT JOIN users assignee ON assignee.id = t.assignee_id LEFT JOIN users creator ON creator.id = t.creator_id",
  pkQualified: "t.id",
  search: ["t.task_no", "t.title", "assignee.name"],
  enumFilters: { status: ["todo", "in_progress", "done", "blocked"], priority: ["low", "medium", "high"] },
  createSchema: taskCreate,
  createdBy: true,
  createdByColumn: "creator_id",
  autoCode: { column: "task_no", prefix: "TSK" },
  orderBy: "t.created_at DESC",
});

const taskStatusSchema = z.object({ status: z.enum(["todo", "in_progress", "done", "blocked"]) });

tasksRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = taskStatusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid task status", parsed.error.flatten());
    await execute(
      "UPDATE tasks SET status = ?, completed_at = IF(?, NOW(), NULL) WHERE id = ?",
      [parsed.data.status, parsed.data.status === "done" ? 1 : 0, id]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "task",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, status: parsed.data.status });
  })
);

// ─── Documents (metadata; file bytes handled by /files) ───────────────────
const docCreate = z.object({
  doc_no: z.string().optional().nullable(),
  title: z.string().min(2).max(190),
  category: z.string().max(48).optional().nullable(),
  tags: z.string().max(255).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const documentsRouter = makeCrud({
  table: "documents",
  resource: "document",
  module: "settings",
  search: ["doc_no", "title", "category", "tags"],
  enumFilters: { status: ["draft", "published", "archived"], category: ["contract", "invoice", "permit", "report", "policy", "other"] },
  createSchema: docCreate,
  createdBy: true,
  autoCode: { column: "doc_no", prefix: "DOC" },
  orderBy: "created_at DESC",
});