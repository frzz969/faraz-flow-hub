import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query, execute } from "./db.js";
import { asyncHandler, success, ApiError } from "./errors.js";
import { requireAuth, attachUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { auditLog } from "../services/audit.js";
import { pool } from "./pool.js";

/**
 * Generic CRUD router factory.
 *
 * Produces a consistent REST surface for a table:
 *   GET    /        list (search / enum filters / date ranges / pagination)
 *   GET    /:id     detail
 *   POST   /        create (validated, optional auto code, audit)
 *   PUT    /:id     patch (validated, audit)
 *   DELETE /:id     remove (soft or hard, audit)
 *
 * Permissions follow the module matrix: `<module>.view|create|update|delete`.
 * strict-mode typing: all optional/Nullable SQL columns accept null (not undefined).
 */

export interface CrudColumnFilter {
  column: string;
  values: string[];
}

export interface CrudConfig<T extends z.ZodTypeAny> {
  table: string;
  resource: string;
  module: string;
  /** SELECT clause (with aliases). Defaults to `<table>.*`. */
  selectClause?: string;
  /** FROM clause incl. joins. Defaults to `FROM <table>`. */
  fromClause?: string;
  /** Table alias used in fromClause (defaults to the alias in fromClause, else table). */
  alias?: string;
  /** Qualified pk for WHERE, e.g. `customers.id`. Default `${table}.id`. */
  pkQualified?: string;
  pk?: string;
  search?: string[];
  enumFilters?: Record<string, readonly string[]>;
  dateFilters?: string[];
  selectOnly?: boolean;
  softDelete?: boolean;
  createSchema: T;
  updateSchema?: z.ZodTypeAny;
  autoCode?: { column: string; prefix: string };
  createdBy?: boolean;
  /** Column to stamp with the current user id (default "created_by"). */
  createdByColumn?: string;
  /** Run before delete; throw ApiError to block. */
  guardBeforeDelete?: (req: Parameters<Parameters<typeof asyncHandler>[0]>[0], id: number) => Promise<void>;
  orderBy?: string;
}

const CODE_MAX_ATTEMPTS = 25;

function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}

async function nextCode(table: string, prefix: string): Promise<string> {
  const d = new Date();
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  const rows = await query<{ n: number } & RowDataPacket>(
    `SELECT COUNT(*) AS n FROM ${table} WHERE created_at >= ?`,
    [`${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} 00:00:00`]
  );
  return `${prefix}-${datePart}-${pad((rows[0]?.n ?? 0) + 1, 3)}`;
}

/**
 * Infer the table alias used in a FROM clause, if any.
 * "FROM shipments s LEFT JOIN ..." -> "s"; "FROM customers" -> "customers".
 */
export function inferAlias(table: string, fromClause: string): string {
  const m = fromClause.match(/^FROM\s+`?[^`\s]+`?(?:\s+(\w+))?/);
  return m?.[1] ?? table;
}

export function makeCrud<T extends z.ZodTypeAny>(cfg: CrudConfig<T>) {
  const {
    table,
    resource,
    module,
    pk = "id",
    pkQualified = `${table}.${pk}`,
    search = [],
    softDelete = true,
    orderBy = `created_at DESC`,
  } = cfg;

  const selectClause = cfg.selectClause ?? `${table}.*`;
  const fromClause = cfg.fromClause ?? `FROM ${table}`;

  // When the FROM clause aliases the table (e.g. "FROM shipments s ..."),
  // all column qualification must use the alias, not the bare table name.
  const alias = cfg.alias ?? inferAlias(table, fromClause);

  const deletedFilter = softDelete ? ` AND ${alias}.deleted_at IS NULL` : "";
  const createdByColumn = cfg.createdByColumn ?? "created_by";
  const qualify = (col: string) => (col.includes(".") ? col : `${alias}.${col}`);

  const router = Router();
  router.use(attachUser, requireAuth);

  // ── List ────────────────────────────────────────────────────────────────
  router.get(
    "/",
    requirePermission(`${module}.view`),
    asyncHandler(async (req, res) => {
      const where: string[] = [];
      const params: (string | number)[] = [];

      for (const [col, values] of Object.entries(cfg.enumFilters ?? {})) {
        const v = req.query[col];
        if (typeof v === "string" && values.includes(v)) {
          where.push(`${alias}.${col} = ?`);
          params.push(v);
        }
      }

      for (const col of cfg.dateFilters ?? []) {
        const from = req.query[`from_${col}`];
        const to = req.query[`to_${col}`];
        if (typeof from === "string" && from.length > 0) {
          where.push(`${alias}.${col} >= ?`);
          params.push(`${from} 00:00:00`);
        }
        if (typeof to === "string" && to.length > 0) {
          where.push(`${alias}.${col} <= ?`);
          params.push(`${to} 23:59:59`);
        }
      }

      const q = req.query.q;
      if (typeof q === "string" && q.trim().length > 0 && search.length > 0) {
        const like = `%${q.trim()}%`;
        where.push(`(${search.map((c) => `${qualify(c)} LIKE ?`).join(" OR ")})`);
        for (let i = 0; i < search.length; i++) params.push(like);
      }

      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      // deleted_at filter belongs inside the WHERE clause, not after FROM.
      const whereParts = [...where];
      if (softDelete) whereParts.push(`${alias}.deleted_at IS NULL`);
      const whereSql = whereParts.length > 0 ? ` WHERE ${whereParts.join(" AND ")}` : "";
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${selectClause} ${fromClause}${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countRows] = await pool.query<({ n: number } & RowDataPacket)[]>(
        `SELECT COUNT(*) AS n ${fromClause}${whereSql}`,
        params
      );

      success(res, { rows, total: countRows[0]?.n ?? 0, limit, offset });
    })
  );

  // ── Detail ──────────────────────────────────────────────────────────────
  router.get(
    "/:id",
    requirePermission(`${module}.view`),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${selectClause} ${fromClause} WHERE ${pkQualified} = ?${deletedFilter}`,
        [id]
      );
      const row = rows[0];
      if (!row) throw ApiError.notFound(`${resource} not found`);
      success(res, { row });
    })
  );

  // ── Create ──────────────────────────────────────────────────────────────
  router.post(
    "/",
    requirePermission(`${module}.create`),
    asyncHandler(async (req, res) => {
      const parsed = cfg.createSchema.safeParse(req.body);
      if (!parsed.success) throw ApiError.badRequest(`Invalid ${resource} payload`, parsed.error.flatten());
      const data = parsed.data as Record<string, unknown>;

      const values: Record<string, unknown> = { ...data };
      if (cfg.createdBy) values[createdByColumn] = req.user!.id;

      if (cfg.autoCode && !values[cfg.autoCode.column]) {
        for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt++) {
          const code = await nextCode(table, cfg.autoCode.prefix);
          values[cfg.autoCode.column] = code;
          try {
            const result = await insertWith(values, table);
            await auditLog({
              user: { id: req.user!.id },
              action: "CREATE",
              resource,
              resourceId: result.insertId,
              after: values,
              ip: req.ip ?? null,
              userAgent: req.headers["user-agent"] ?? null,
            });
            success(res, { id: result.insertId, [cfg.autoCode.column]: code }, 201);
            return;
          } catch (err) {
            if (isDupEntry(err)) continue;
            throw err;
          }
        }
        throw ApiError.internal(`Unable to allocate unique ${cfg.autoCode.column}`);
      }

      const result = await insertWith(values, table);
      await auditLog({
        user: { id: req.user!.id },
        action: "CREATE",
        resource,
        resourceId: result.insertId,
        after: values,
        ip: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      success(res, { id: result.insertId }, 201);
    })
  );

  // ── Update ──────────────────────────────────────────────────────────────
  router.put(
    "/:id",
    requirePermission(`${module}.edit`),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const [existingRows] = await pool.query<RowDataPacket[]>(
        `SELECT ${selectClause} ${fromClause} WHERE ${pkQualified} = ?${deletedFilter}`,
        [id]
      );
      const existing = existingRows[0];
      if (!existing) throw ApiError.notFound(`${resource} not found`);

      const schema = cfg.updateSchema ?? (cfg.createSchema as unknown as z.ZodObject<{ [k: string]: z.ZodTypeAny }>).partial();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) throw ApiError.badRequest(`Invalid ${resource} payload`, parsed.error.flatten());
      const patch = parsed.data as Record<string, unknown>;

      if (Object.keys(patch).length === 0) {
        success(res, { updated: true });
        return;
      }
      const sets: string[] = [];
      const params: unknown[] = [];
      for (const [k, v] of Object.entries(patch)) {
        if (k === pk) continue;
        sets.push(`${k} = ?`);
        params.push(v ?? null);
      }
      if (sets.length === 0) {
        success(res, { updated: true });
        return;
      }
      params.push(id);
      await execute(`UPDATE ${table} SET ${sets.join(", ")} WHERE ${pk} = ?`, params as never);
      await auditLog({
        user: { id: req.user!.id },
        action: "UPDATE",
        resource,
        resourceId: id,
        before: existing,
        after: patch,
        ip: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      success(res, { updated: true });
    })
  );

  // ── Delete ──────────────────────────────────────────────────────────────
  router.delete(
    "/:id",
    requirePermission(`${module}.delete`),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${pkQualified} AS _id ${fromClause} WHERE ${pkQualified} = ?${deletedFilter}`,
        [id]
      );
      if (!rows[0]) throw ApiError.notFound(`${resource} not found`);
      if (cfg.guardBeforeDelete) await cfg.guardBeforeDelete(req, id);

      if (softDelete) {
        await execute(`UPDATE ${table} SET deleted_at = NOW() WHERE ${pk} = ?`, [id]);
      } else {
        await execute(`DELETE FROM ${table} WHERE ${pk} = ?`, [id]);
      }
      await auditLog({
        user: { id: req.user!.id },
        action: "DELETE",
        resource,
        resourceId: id,
        before: rows[0],
        ip: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      success(res, { deleted: true });
    })
  );

  return router;
}

function isDupEntry(err: unknown): boolean {
  return err instanceof Error && (err as { code?: string }).code === "ER_DUP_ENTRY";
}

async function insertWith(values: Record<string, unknown>, table: string): Promise<ResultSetHeader> {
  const cols = Object.keys(values);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    cols.map((c) => values[c] ?? null) as never
  );
  return result;
}

/** Common zod uuid-ish optional int helper. */
export const optionalInt = z.number().int().positive().optional().nullable();
export const optionalStr = z.string().max(255).optional().nullable();
export { z };