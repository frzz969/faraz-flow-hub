import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { query } from "../../lib/db.js";
import { asyncHandler, success } from "../../lib/errors.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";

/**
 * Reporting & dashboard KPIs (P12). Pure read-only aggregation views.
 */
export const reportsRouter = Router();
reportsRouter.use(attachUser, requireAuth);

reportsRouter.get(
  "/shipments-by-status",
  asyncHandler(async (_req, res) => {
    const rows = await query<RowDataPacket>(
      `SELECT status, COUNT(*) AS count, COUNT(DISTINCT customer_id) AS customers FROM shipments
       WHERE deleted_at IS NULL GROUP BY status ORDER BY count DESC`
    );
    success(res, { rows });
  })
);

reportsRouter.get(
  "/shipments-timeline",
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
    const rows = await query<RowDataPacket>(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM shipments
       WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY day ASC`,
      [days]
    );
    success(res, { rows });
  })
);

reportsRouter.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const rows = await query<RowDataPacket>(
      `SELECT MONTH(paid_at) AS month, SUM(total) AS revenue, COUNT(*) AS docs
       FROM billing_documents
       WHERE status IN ('settled','partial') AND YEAR(paid_at) = ?
       GROUP BY MONTH(paid_at) ORDER BY month`,
      [year]
    );
    const total = rows.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
    success(res, { year, rows, total });
  })
);

reportsRouter.get(
  "/top-routes",
  asyncHandler(async (_req, res) => {
    const rows = await query<RowDataPacket>(
      `SELECT r.route_code, r.name, r.origin, r.destination, COUNT(dp.id) AS dispatches
       FROM dispatches dp JOIN routes r ON r.id = dp.route_id
       GROUP BY r.id ORDER BY dispatches DESC LIMIT 10`
    );
    success(res, { rows });
  })
);

reportsRouter.get(
  "/inventory-summary",
  asyncHandler(async (_req, res) => {
    const totals = await query<RowDataPacket>(
      `SELECT COUNT(*) AS sku_count, SUM(quantity) AS total_qty,
              SUM(CASE WHEN quantity <= COALESCE(min_stock,0) THEN 1 ELSE 0 END) AS low_stock
       FROM inventory`
    );
    const byCategory = await query<RowDataPacket>(
      `SELECT COALESCE(category,'unsorted') AS category, COUNT(*) AS count, SUM(quantity) AS qty FROM inventory GROUP BY category`
    );
    const byWarehouse = await query<RowDataPacket>(
      `SELECT w.name, SUM(i.quantity) AS qty, COUNT(i.id) AS skus
       FROM inventory i JOIN warehouses w ON w.id = i.warehouse_id GROUP BY w.id`
    );
    success(res, { totals: totals[0], byCategory, byWarehouse });
  })
);

reportsRouter.get(
  "/usage-overview",
  asyncHandler(async (_req, res) => {
    const kpis = await query<RowDataPacket>(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users,
         (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) AS customers,
         (SELECT COUNT(*) FROM suppliers WHERE deleted_at IS NULL) AS suppliers,
         (SELECT COUNT(*) FROM vehicles WHERE deleted_at IS NULL) AS vehicles,
         (SELECT COUNT(*) FROM drivers WHERE deleted_at IS NULL) AS drivers,
         (SELECT COUNT(*) FROM warehouses WHERE deleted_at IS NULL) AS warehouses,
         (SELECT COUNT(*) FROM shipments WHERE deleted_at IS NULL AND status NOT IN ('delivered','cancelled')) AS active_shipments,
         (SELECT COUNT(*) FROM approvals WHERE status = 'pending') AS pending_approvals,
         (SELECT COUNT(*) FROM exceptions WHERE status IN ('open','reviewing')) AS open_exceptions,
         (SELECT COUNT(*) FROM tasks WHERE status IN ('todo','in_progress')) AS open_tasks`
    );
    success(res, { kpis: kpis[0] });
  })
);

reportsRouter.get(
  "/transport-efficiency",
  asyncHandler(async (_req, res) => {
    const rows = await query<RowDataPacket>(
      `SELECT ROUND(AVG(distance_km),2) AS avg_distance_km,
              ROUND(AVG(estimated_min),1) AS avg_estimated_min,
              COUNT(*) AS routes
       FROM routes WHERE status = 'active'`
    );
    const dispatch = await query<RowDataPacket>(
      `SELECT status, COUNT(*) AS count FROM dispatches GROUP BY status`
    );
    success(res, { routes: rows[0], dispatch });
  })
);