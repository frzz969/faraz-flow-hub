import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../repositories/db.js";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { auditLog } from "../services/audit.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

/**
 * CSV import/export (P11). Deliberately dependency-free:
 * a small quote-aware parser + writer.
 */

export const importExportRouter = Router();
importExportRouter.use(attachUser, requireAuth);

const EXPORTABLE: Record<string, { select: string; from: string; cols: string[] }> = {
  customers: {
    select: "code, name, type, contact_person, email, phone, address, city, status, notes",
    from: "customers",
    cols: ["code", "name", "type", "contact_person", "email", "phone", "address", "city", "status", "notes"],
  },
  suppliers: {
    select: "code, name, contact_person, email, phone, address, category, status, notes",
    from: "suppliers",
    cols: ["code", "name", "contact_person", "email", "phone", "address", "category", "status", "notes"],
  },
  shipments: {
    select: "shipment_no, customer_id, origin, destination, service_type, status, weight_kg, volume_m3, total_amount, planned_date, courier_name",
    from: "shipments",
    cols: ["shipment_no", "customer_id", "origin", "destination", "service_type", "status", "weight_kg", "volume_m3", "total_amount", "planned_date", "courier_name"],
  },
  inventory: {
    select: "warehouse_id, sku, name, category, quantity, reserved_qty, unit, min_stock, location",
    from: "inventory",
    cols: ["warehouse_id", "sku", "name", "category", "quantity", "reserved_qty", "unit", "min_stock", "location"],
  },
  vehicles: {
    select: "plate_no, model, type, capacity_kg, capacity_m3, status, odometer",
    from: "vehicles",
    cols: ["plate_no", "model", "type", "capacity_kg", "capacity_m3", "status", "odometer"],
  },
};

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Quote-aware CSV row parser (RFC-4180 subset). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

importExportRouter.get(
  "/export/:resource/csv",
  asyncHandler(async (req, res) => {
    const resource = String(req.params.resource);
    const spec = (EXPORTABLE as Record<string, { select: string; from: string; cols: string[] } | undefined>)[resource];
    if (!spec) throw ApiError.notFound("Unknown export resource");
    const rows = await query<RowDataPacket>(`SELECT ${spec.select} FROM ${spec.from} WHERE deleted_at IS NULL`, []);
    const lines = [
      spec.cols.map(csvEscape).join(","),
      ...rows.map((r) => spec.cols.map((c) => csvEscape((r as Record<string, unknown>)[c])).join(",")),
    ];
    const buf = Buffer.from("\uFEFF" + lines.join("\n"), "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${resource}-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(buf);
  })
);

const importSchema = z.object({ csv: z.string().min(1) });

const IMPORTABLE = new Set(["customers", "inventory"]);

importExportRouter.post(
  "/import/:resource/csv",
  requirePermission("settings.view"),
  asyncHandler(async (req, res) => {
    const resource = String(req.params.resource);
    if (!IMPORTABLE.has(resource)) throw ApiError.badRequest("Import supported for: customers, inventory");

    const parsedBody = importSchema.safeParse(req.body);
    if (!parsedBody.success) throw ApiError.badRequest("Invalid CSV payload", parsedBody.error.flatten());
    const rows = parseCsv(parsedBody.data.csv);
    if (rows.length < 2) throw ApiError.badRequest("CSV must include a header row");

    const header = rows[0]!.map((h) => h.trim().toLowerCase());
    const errors: { row: number; reason: string }[] = [];
    let imported = 0;

    if (resource === "customers") {
      const idx = (name: string) => header.indexOf(name);
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]!;
        const get = (name: string): string | null => {
          const j = idx(name);
          if (j < 0) return null;
          const v = r[j];
          return v === undefined ? null : v.trim();
        };
        const name = get("name");
        if (!name) {
          errors.push({ row: i + 1, reason: "name required" });
          continue;
        }
        try {
          await execute(
            `INSERT INTO customers (code, name, type, contact_person, email, phone, address, city, status, notes)
             VALUES (?, ?, COALESCE(?, 'both'), ?, ?, ?, ?, ?, COALESCE(?, 'active'), ?)`,
            [
              get("code") || `CUS-${Date.now()}-${i}`,
              name,
              get("type"),
              get("contact_person"),
              get("email"),
              get("phone"),
              get("address"),
              get("city"),
              get("status"),
              get("notes"),
            ]
          );
          imported++;
        } catch (e) {
          errors.push({ row: i + 1, reason: e instanceof Error ? e.message : String(e) });
        }
      }
    } else {
      const idx = (name: string) => header.indexOf(name);
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]!;
        const get = (name: string): string | null => {
          const j = idx(name);
          if (j < 0) return null;
          const v = r[j];
          return v === undefined ? null : v.trim();
        };
        const warehouseId = Number(get("warehouse_id"));
        const sku = get("sku");
        const name = get("name");
        if (!warehouseId || !sku || !name) {
          errors.push({ row: i + 1, reason: "warehouse_id, sku, name required" });
          continue;
        }
        try {
          await execute(
            `INSERT INTO inventory (warehouse_id, sku, name, category, quantity, unit, min_stock, location)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category),
               quantity = quantity + VALUES(quantity), unit = VALUES(unit), min_stock = VALUES(min_stock), location = VALUES(location)`,
            [
              warehouseId,
              sku,
              name,
              get("category"),
              Number(get("quantity")) || 0,
              get("unit"),
              Number(get("min_stock")) || null,
              get("location"),
            ]
          );
          imported++;
        } catch (e) {
          errors.push({ row: i + 1, reason: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    await auditLog({
      user: { id: req.user!.id },
      action: "CREATE",
      resource: `import:${resource}`,
      after: { imported, errorCount: errors.length },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    success(res, { imported, errors }, errors.length ? 200 : 200);
  })
);