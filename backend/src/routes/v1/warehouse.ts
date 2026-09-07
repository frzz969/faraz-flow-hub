import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { auditLog } from "../../services/audit.js";
import { makeCrud } from "../../lib/crud.js";

// ─── Warehouses ──────────────────────────────────────────────────────────
const warehouseCreate = z.object({
  name: z.string().min(2).max(128),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(96).optional().nullable(),
  capacity: z.number().min(0).optional().nullable(),
  manager_id: z.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

export const warehousesRouter = makeCrud({
  table: "warehouses",
  resource: "warehouse",
  module: "warehouse",
  selectClause: "w.*, u.name AS manager_name",
  fromClause: "FROM warehouses w LEFT JOIN users u ON u.id = w.manager_id",
  pkQualified: "w.id",
  search: ["w.code", "w.name", "w.city"],
  enumFilters: { status: ["active", "inactive", "maintenance"] },
  createSchema: warehouseCreate,
  autoCode: { column: "code", prefix: "WH" },
  orderBy: "w.created_at DESC",
});

// ─── Zones (sub-resource of warehouse) ───────────────────────────────────
const zoneCreate = z.object({
  code: z.string().min(1).max(40),
  name: z.string().max(96).optional().nullable(),
  zone_type: z.enum(["storage", "staging", "sorting", "damaged", "returns"]).optional(),
});

export const zonesRouter = Router();
zonesRouter.use(attachUser, requireAuth);

zonesRouter.get(
  "/:warehouseId",
  asyncHandler(async (req, res) => {
    const rows = await query<RowDataPacket>("SELECT * FROM warehouse_zones WHERE warehouse_id = ? ORDER BY code", [Number(req.params.warehouseId)]);
    success(res, { rows });
  })
);

zonesRouter.post(
  "/:warehouseId",
  asyncHandler(async (req, res) => {
    const parsed = zoneCreate.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid zone payload", parsed.error.flatten());
    const result = await execute(
      "INSERT INTO warehouse_zones (warehouse_id, code, name, zone_type) VALUES (?, ?, ?, ?)",
      [Number(req.params.warehouseId), parsed.data.code, parsed.data.name ?? null, parsed.data.zone_type ?? "storage"]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "CREATE",
      resource: "zone",
      resourceId: result.insertId,
      after: parsed.data,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id: result.insertId }, 201);
  })
);

zonesRouter.delete(
  "/:warehouseId/:zoneId",
  asyncHandler(async (req, res) => {
    await execute("DELETE FROM warehouse_zones WHERE id = ? AND warehouse_id = ?", [Number(req.params.zoneId), Number(req.params.warehouseId)]);
    success(res, { deleted: true });
  })
);

// ─── Inventory ────────────────────────────────────────────────────────────
const inventoryCreate = z.object({
  warehouse_id: z.number().int().positive(),
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(190),
  category: z.string().max(64).optional().nullable(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(24).optional().nullable(),
  min_stock: z.number().min(0).optional().nullable(),
  location: z.string().max(64).optional().nullable(),
});

export const inventoryRouter = makeCrud({
  table: "inventory",
  resource: "inventory item",
  module: "inventory",
  selectClause: "i.*, w.code AS warehouse_code, w.name AS warehouse_name",
  fromClause: "FROM inventory i LEFT JOIN warehouses w ON w.id = i.warehouse_id",
  pkQualified: "i.id",
  search: ["i.sku", "i.name", "i.category", "i.location", "w.name"],
  enumFilters: {},
  createSchema: inventoryCreate,
  orderBy: "i.name ASC",
});

// stock adjustment with movement history
const stockSchema = z.object({
  movement_type: z.enum(["in", "out", "transfer", "adjustment", "reserve", "release"]),
  quantity: z.number().min(0.001),
  reference: z.string().max(64).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  to_inventory_id: z.number().int().positive().optional().nullable(),
});

inventoryRouter.post(
  "/:id/stock",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = stockSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid stock payload", parsed.error.flatten());

    const rows = await query<RowDataPacket>("SELECT id, quantity, reserved_qty, warehouse_id FROM inventory WHERE id = ?", [id]);
    const item = rows[0];
    if (!item) throw ApiError.notFound("Inventory item not found");

    const qty = parsed.data.quantity;
    let newQty = Number(item.quantity);
    let newReserved = Number(item.reserved_qty);
    const negative = parsed.data.movement_type === "out" || parsed.data.movement_type === "reserve";

    if (parsed.data.movement_type === "transfer") {
      if (!parsed.data.to_inventory_id) throw ApiError.badRequest("to_inventory_id required for transfer");
      await execute(
        "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
        [qty, parsed.data.to_inventory_id]
      );
      newQty -= qty;
    } else if (negative) {
      newQty -= qty;
      if (newQty < 0) throw ApiError.conflict("Insufficient stock");
      if (parsed.data.movement_type === "reserve") {
        newReserved += qty;
        newQty = Number(item.quantity);
      }
    } else {
      newQty += qty;
      if (parsed.data.movement_type === "release") {
        newReserved = Math.max(0, newReserved - qty);
        newQty = Number(item.quantity);
      }
    }

    await execute("UPDATE inventory SET quantity = ?, reserved_qty = ? WHERE id = ?", [newQty, newReserved, id]);
    const result = await execute(
      "INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference, note, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, parsed.data.movement_type, qty, parsed.data.reference ?? null, parsed.data.note ?? null, req.user!.id]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "inventory",
      resourceId: id,
      after: { movement_type: parsed.data.movement_type, quantity: qty, newQty, newReserved },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id: result.insertId, quantity: newQty, reserved_qty: newReserved });
  })
);

inventoryRouter.get(
  "/:id/movements",
  asyncHandler(async (req, res) => {
    const rows = await query<RowDataPacket>(
      `SELECT sm.*, u.name AS user_name FROM stock_movements sm LEFT JOIN users u ON u.id = sm.user_id
       WHERE sm.inventory_id = ? ORDER BY sm.created_at DESC`,
      [Number(req.params.id)]
    );
    success(res, { rows });
  })
);

// ─── Inbound / Outbound / Sorting (compact) ──────────────────────────────
const inboundCreate = z.object({
  warehouse_id: z.number().int().positive(),
  supplier_id: z.number().int().positive().optional().nullable(),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const inboundRouter = makeCrud({
  table: "inbound_orders",
  resource: "inbound order",
  module: "warehouse",
  selectClause: "ib.*, w.name AS warehouse_name, s.name AS supplier_name, u.name AS created_by_name",
  fromClause:
    "FROM inbound_orders ib LEFT JOIN warehouses w ON w.id = ib.warehouse_id LEFT JOIN suppliers s ON s.id = ib.supplier_id LEFT JOIN users u ON u.id = ib.created_by",
  pkQualified: "ib.id",
  search: ["ib.inbound_no"],
  enumFilters: { status: ["expected", "received", "checked", "stored"] },
  createSchema: inboundCreate,
  createdBy: true,
  autoCode: { column: "inbound_no", prefix: "INB" },
  orderBy: "ib.created_at DESC",
});

const outboundCreate = z.object({
  warehouse_id: z.number().int().positive(),
  order_id: z.number().int().positive().optional().nullable(),
  shipment_id: z.number().int().positive().optional().nullable(),
  ship_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const outboundRouter = makeCrud({
  table: "outbound_orders",
  resource: "outbound order",
  module: "warehouse",
  selectClause: "ob.*, w.name AS warehouse_name, o.order_no, s.shipment_no, u.name AS created_by_name",
  fromClause:
    "FROM outbound_orders ob LEFT JOIN warehouses w ON w.id = ob.warehouse_id LEFT JOIN orders o ON o.id = ob.order_id LEFT JOIN shipments s ON s.id = ob.shipment_id LEFT JOIN users u ON u.id = ob.created_by",
  pkQualified: "ob.id",
  search: ["ob.outbound_no"],
  enumFilters: { status: ["preparing", "picked", "packed", "shipped"] },
  createSchema: outboundCreate,
  createdBy: true,
  autoCode: { column: "outbound_no", prefix: "OB" },
  orderBy: "ob.created_at DESC",
});

const sortCreate = z.object({
  warehouse_id: z.number().int().positive(),
  shipment_id: z.number().int().positive().optional().nullable(),
  zone_from: z.string().max(40).optional().nullable(),
  zone_to: z.string().max(40).optional().nullable(),
  assigned_to: z.number().int().positive().optional().nullable(),
});

export const sortingRouter = makeCrud({
  table: "sorting_tasks",
  resource: "sorting task",
  module: "warehouse",
  selectClause: "st.*, w.name AS warehouse_name, s.shipment_no, u.name AS assigned_to_name",
  fromClause:
    "FROM sorting_tasks st LEFT JOIN warehouses w ON w.id = st.warehouse_id LEFT JOIN shipments s ON s.id = st.shipment_id LEFT JOIN users u ON u.id = st.assigned_to",
  pkQualified: "st.id",
  search: ["st.task_no"],
  enumFilters: { status: ["pending", "in_progress", "sorted", "failed"] },
  createSchema: sortCreate,
  autoCode: { column: "task_no", prefix: "ST" },
  orderBy: "st.created_at DESC",
});