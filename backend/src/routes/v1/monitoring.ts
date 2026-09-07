import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { query, pingDb } from "../../lib/db.js";
import { asyncHandler, success } from "../../lib/errors.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { config } from "../../config.js";
import { pool } from "../../lib/pool.js";
import { onlineCount } from "../../lib/realtime.js";

/**
 * Operations monitoring (P13).
 */
export const monitoringRouter = Router();
monitoringRouter.use(attachUser, requireAuth);

monitoringRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    let dbLatencyMs: number | null = null;
    try {
      const start = performance.now();
      await pingDb();
      dbLatencyMs = Math.round(performance.now() - start);
    } catch {
      dbLatencyMs = null;
    }
    success(res, {
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      pid: process.pid,
      node: process.version,
      env: config.env,
      db: { latencyMs: dbLatencyMs, poolThreadId: (pool as unknown as { threadId?: number }).threadId ?? null },
      realtime: { online: onlineCount() },
    });
  })
);

monitoringRouter.get(
  "/database",
  asyncHandler(async (_req, res) => {
    const tables = await query<RowDataPacket>(
      `SELECT TABLE_NAME AS name, TABLE_ROWS AS rows_estimate, DATA_LENGTH + INDEX_LENGTH AS bytes
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY name`
    );
    const counts = await query<RowDataPacket>(
      `SELECT 'users' AS tbl, COUNT(*) AS n FROM users
       UNION ALL SELECT 'customers', COUNT(*) FROM customers
       UNION ALL SELECT 'shipments', COUNT(*) FROM shipments
       UNION ALL SELECT 'orders', COUNT(*) FROM orders
       UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
       UNION ALL SELECT 'billing_documents', COUNT(*) FROM billing_documents`
    );
    success(res, { tables, counts });
  })
);

monitoringRouter.get(
  "/activity",
  asyncHandler(async (_req, res) => {
    const hours = Math.min(Math.max(Number(_req.query.hours) || 24, 1), 168);
    const audit = await query<RowDataPacket>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00') AS hour, COUNT(*) AS n FROM audit_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) GROUP BY hour ORDER BY hour DESC LIMIT 72`,
      [hours]
    );
    const security = await query<RowDataPacket>(
      `SELECT event_type, severity, COUNT(*) AS n FROM security_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) GROUP BY event_type, severity ORDER BY n DESC LIMIT 20`,
      [hours]
    );
    success(res, { audit, security });
  })
);

monitoringRouter.get(
  "/security-events",
  asyncHandler(async (_req, res) => {
    const limit = Math.min(Number(_req.query.limit) || 50, 200);
    const rows = await query<RowDataPacket>(
      `SELECT se.*, u.name AS user_name FROM security_events se
       LEFT JOIN users u ON u.id = se.user_id
       ORDER BY se.created_at DESC LIMIT ?`,
      [limit]
    );
    success(res, { rows });
  })
);

monitoringRouter.get(
  "/health/live",
  asyncHandler(async (_req, res) => {
    const ok = await (async () => {
      try {
        await pingDb();
        return true;
      } catch {
        return false;
      }
    })();
    success(res, { ok });
  })
);