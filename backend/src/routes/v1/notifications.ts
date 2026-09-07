import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { attachUser, requireAuth, type AuthUser } from "../../middleware/auth.js";
import { publish } from "../../lib/realtime.js";
import { auditLog } from "../../services/audit.js";

/**
 * Personal notifications (P9).
 * Table `notifications` ships with the workspace migration.
 */
export const notificationsRouter = Router();

notificationsRouter.use(attachUser, requireAuth);

const notifCreate = z.object({
  user_id: z.number().int().positive(),
  type: z.enum(["assigned", "approval", "shipment", "alert", "system"]),
  title: z.string().min(2).max(190),
  message: z.string().max(500).optional().nullable(),
  resource: z.string().max(64).optional().nullable(),
  resource_id: z.string().max(128).optional().nullable(),
});

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const unreadOnly = req.query.unread === "1";
    const rows = await query<RowDataPacket>(
      `SELECT id, type, title, message, resource, resource_id, read_at, created_at
       FROM notifications
       WHERE user_id = ? ${unreadOnly ? "AND read_at IS NULL" : ""}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user!.id, limit, offset]
    );
    success(res, { rows, limit, offset });
  })
);

notificationsRouter.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const rows = await query<{ n: number } & RowDataPacket>(
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL",
      [req.user!.id]
    );
    success(res, { count: rows[0]?.n ?? 0 });
  })
);

// Admin convenience: push a system notification to a user.
notificationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = notifCreate.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid notification payload", parsed.error.flatten());
    const result = await execute(
      "INSERT INTO notifications (user_id, type, title, message, resource, resource_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        parsed.data.user_id,
        parsed.data.type,
        parsed.data.title,
        parsed.data.message ?? null,
        parsed.data.resource ?? null,
        parsed.data.resource_id ?? null,
      ]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "CREATE",
      resource: "notification",
      resourceId: result.insertId,
      after: parsed.data,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    publish(parsed.data.user_id, "notification:new", { id: result.insertId, ...parsed.data });
    success(res, { id: result.insertId }, 201);
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await execute(
      "UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?",
      [id, req.user!.id]
    );
    if (result.affectedRows === 0) throw ApiError.notFound("Notification not found");
    success(res, { read: true });
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await execute("UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL", [req.user!.id]);
    success(res, { read: true });
  })
);