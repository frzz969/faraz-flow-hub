import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/security.js";
import { auditLog, securityEvent, listAuditLogs, listSecurityEvents } from "../../services/audit.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";

/**
 * /api/v1/admin/* — control-plane endpoints.
 * Every route requires an authenticated user with the matching admin.* code
 * (super_admin bypasses via requirePermission).
 */
export const adminRouter = Router();

adminRouter.use(attachUser, requireAuth);

// ─── Permissions catalog ─────────────────────────────────────────────────
interface PermRow extends RowDataPacket {
  id: number;
  code: string;
  module: string;
  action: string;
  name: string;
}

adminRouter.get(
  "/permissions",
  requirePermission("admin.roles.view"),
  asyncHandler(async (_req, res) => {
    const rows = await query<PermRow>("SELECT id, code, module, action, name FROM permissions ORDER BY module, action");
    const grouped = new Map<string, PermRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.module) ?? [];
      list.push(row);
      grouped.set(row.module, list);
    }
    success(res, {
      modules: [...grouped.entries()].map(([module, permissions]) => ({ module, permissions })),
    });
  })
);

// ─── Users ───────────────────────────────────────────────────────────────
interface UserAdminRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_code: string;
  role_name: string;
  department: string | null;
  status: "active" | "inactive";
  last_login_at: string | null;
  last_active_at: string | null;
  created_at: string;
}

adminRouter.get(
  "/users",
  requirePermission("admin.users.view"),
  asyncHandler(async (_req, res) => {
    const rows = await query<UserAdminRow>(
      `SELECT u.id, u.name, u.email, u.phone, u.department, u.status,
              u.last_login_at, u.last_active_at, u.created_at,
              r.code AS role_code, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );
    success(res, { users: rows });
  })
);

const createUserSchema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email().max(190),
  phone: z.string().max(32).optional().nullable(),
  department: z.string().max(64).optional().nullable(),
  roleCode: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
  status: z.enum(["active", "inactive"]).optional(),
});

adminRouter.post(
  "/users",
  requirePermission("admin.users.create"),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid user payload", parsed.error.flatten());
    const { name, email, phone, department, roleCode, password, status } = parsed.data;

    const roles = await query<RoleIdRow>("SELECT id, code FROM roles WHERE code = ?", [roleCode]);
    const role = roles[0];
    if (!role) throw ApiError.badRequest("Unknown role code");

    const existing = await query<{ id: number } & RowDataPacket>("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing[0]) throw ApiError.conflict("Email already registered");

    const result = await execute(
      `INSERT INTO users (name, email, phone, department, role_id, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email.toLowerCase(),
        phone ?? null,
        department ?? null,
        Number(role.id),
        hashPassword(password),
        status ?? "active",
      ]
    );

    await auditLog({
      user: { id: req.user!.id },
      action: "CREATE",
      resource: "user",
      resourceId: result.insertId,
      after: { name, email: email.toLowerCase(), roleCode },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    success(res, { id: result.insertId }, 201);
  })
);

interface RoleIdRow extends RowDataPacket {
  id: number;
  code: string;
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(128),
  phone: z.string().max(32).optional().nullable(),
  department: z.string().max(64).optional().nullable(),
});

adminRouter.put(
  "/users/:id",
  requirePermission("admin.users.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid user id");

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid user payload", parsed.error.flatten());
    const { name, phone, department } = parsed.data;

    const result = await execute(
      "UPDATE users SET name = ?, phone = ?, department = ? WHERE id = ? AND deleted_at IS NULL",
      [name, phone ?? null, department ?? null, id]
    );
    if (result.affectedRows === 0) throw ApiError.notFound("User not found");

    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "user",
      resourceId: id,
      after: { name, phone: phone ?? null, department: department ?? null },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { updated: true });
  })
);

const setStatusSchema = z.object({ status: z.enum(["active", "inactive"]) });

adminRouter.put(
  "/users/:id/status",
  requirePermission("admin.users.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = setStatusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid status payload", parsed.error.flatten());

    const users = await query<RoleIdRow & RowDataPacket>("SELECT id, role_id FROM users WHERE id = ? AND deleted_at IS NULL", [id]);
    const target = users[0];
    if (!target) throw ApiError.notFound("User not found");

    // Protect the last active super admin from self-deactivation.
    if (parsed.data.status === "inactive" && id === req.user!.id) {
      throw ApiError.forbidden("You cannot deactivate your own account");
    }
    if (parsed.data.status === "inactive") {
      const role = await query<{ code: string } & RowDataPacket>("SELECT code FROM roles WHERE id = ?", [Number(target.role_id)]);
      if (role[0]?.code === "super_admin") {
        const sa = await query<{ n: number } & RowDataPacket>(
          "SELECT COUNT(*) n FROM users WHERE role_id = ? AND status = 'active' AND deleted_at IS NULL",
          [Number(target.role_id)]
        );
        if ((sa[0]?.n ?? 0) <= 1) throw ApiError.forbidden("Cannot deactivate the last active Super Admin");
      }
    }

    await execute("UPDATE users SET status = ? WHERE id = ?", [parsed.data.status, id]);
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "user",
      resourceId: id,
      after: { status: parsed.data.status },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { updated: true });
  })
);

const setRoleSchema = z.object({ roleCode: z.string().min(1).max(64) });

adminRouter.put(
  "/users/:id/role",
  requirePermission("admin.users.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid user id");
    const parsed = setRoleSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid role payload", parsed.error.flatten());

    const roles = await query<RoleIdRow>("SELECT id, code FROM roles WHERE code = ?", [parsed.data.roleCode]);
    const role = roles[0];
    if (!role) throw ApiError.badRequest("Unknown role code");

    const users = await query<{ id: number; role_id: number } & RowDataPacket>(
      "SELECT id, role_id FROM users WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    const target = users[0];
    if (!target) throw ApiError.notFound("User not found");

    // Cannot demote a Super Admin if they're the last active one.
    const currentRole = await query<RoleIdRow>("SELECT id, code FROM roles WHERE id = ?", [Number(target.role_id)]);
    if (currentRole[0]?.code === "super_admin" && parsed.data.roleCode !== "super_admin") {
      const sa = await query<{ n: number } & RowDataPacket>(
        "SELECT COUNT(*) n FROM users WHERE role_id = ? AND status = 'active' AND deleted_at IS NULL",
        [Number(target.role_id)]
      );
      if ((sa[0]?.n ?? 0) <= 1) throw ApiError.forbidden("Cannot demote the last active Super Admin");
    }

    await execute("UPDATE users SET role_id = ? WHERE id = ?", [Number(role.id), id]);
    await auditLog({
      user: { id: req.user!.id },
      action: "ROLE_CHANGE",
      resource: "user",
      resourceId: id,
      before: { roleCode: currentRole[0]?.code },
      after: { roleCode: parsed.data.roleCode },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    await securityEvent({
      eventType: "ROLE_CHANGE",
      userId: req.user!.id,
      resource: "user",
      resourceId: id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      severity: "info",
      details: { before: currentRole[0]?.code, after: parsed.data.roleCode },
    });
    success(res, { updated: true });
  })
);

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128).optional(),
});

adminRouter.post(
  "/users/:id/reset-password",
  requirePermission("admin.users.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid user id");
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid password payload", parsed.error.flatten());

    const users = await query<{ id: number } & RowDataPacket>("SELECT id FROM users WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!users[0]) throw ApiError.notFound("User not found");

    const generated = parsed.data.newPassword ?? cryptoRandom();
    await execute("UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?", [
      hashPassword(parsed.data.newPassword ?? generated),
      id,
    ]);
    await auditLog({
      user: { id: req.user!.id },
      action: "PASSWORD_CHANGE",
      resource: "user",
      resourceId: id,
      after: { resetByAdmin: true },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    await securityEvent({
      eventType: "PASSWORD_RESET_BY_ADMIN",
      userId: req.user!.id,
      resource: "user",
      resourceId: id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      severity: "warning",
    });
    success(res, { reset: true, ...(parsed.data.newPassword ? {} : { generatedPassword: generated }) });
  })
);

adminRouter.delete(
  "/users/:id",
  requirePermission("admin.users.delete"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid user id");
    if (id === req.user!.id) throw ApiError.forbidden("You cannot delete your own account");

    const users = await query<{ id: number; role_id: number } & RowDataPacket>(
      "SELECT id, role_id FROM users WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    const target = users[0];
    if (!target) throw ApiError.notFound("User not found");

    const role = await query<RoleIdRow>("SELECT code FROM roles WHERE id = ?", [Number(target.role_id)]);
    if (role[0]?.code === "super_admin") {
      const sa = await query<{ n: number } & RowDataPacket>(
        "SELECT COUNT(*) n FROM users WHERE role_id = ? AND status = 'active' AND deleted_at IS NULL",
        [Number(target.role_id)]
      );
      if ((sa[0]?.n ?? 0) <= 1) throw ApiError.forbidden("Cannot delete the last active Super Admin");
    }

    await execute("UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    await execute("UPDATE sessions SET revoked_at = NOW() WHERE user_id = ?", [id]);
    await auditLog({
      user: { id: req.user!.id },
      action: "DELETE",
      resource: "user",
      resourceId: id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { deleted: true });
  })
);

// ─── Roles ────────────────────────────────────────────────────────────────
interface RoleRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_system: number;
  permission_count: number;
  user_count: number;
}

adminRouter.get(
  "/roles",
  requirePermission("admin.roles.view"),
  asyncHandler(async (_req, res) => {
    const rows = await query<RoleRow>(
      `SELECT r.id, r.code, r.name, r.description, r.is_system,
              COUNT(DISTINCT rp.permission_id) AS permission_count,
              (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id AND u.deleted_at IS NULL) AS user_count
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name`
    );
    success(res, { roles: rows });
  })
);

adminRouter.get(
  "/roles/:id",
  requirePermission("admin.roles.view"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid role id");
    const roles = await query<RoleRow & RowDataPacket>("SELECT id, code, name, description, is_system FROM roles WHERE id = ?", [id]);
    const role = roles[0];
    if (!role) throw ApiError.notFound("Role not found");
    const perms = await query<PermRow>(
      `SELECT p.code, p.module, p.action, p.name
       FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ? ORDER BY p.module, p.action`,
      [id]
    );
    success(res, { role: { ...role, is_system: Boolean(role.is_system), permissions: perms } });
  })
);

const createRoleSchema = z.object({
  code: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, "code must be lowercase alphanumeric + underscore"),
  name: z.string().min(2).max(128),
  description: z.string().max(255).optional().nullable(),
  permissions: z.array(z.string().min(1)).optional(),
});

adminRouter.post(
  "/roles",
  requirePermission("admin.roles.update"),
  asyncHandler(async (req, res) => {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid role payload", parsed.error.flatten());
    const { code, name, description, permissions } = parsed.data;

    const existing = await query<{ id: number } & RowDataPacket>("SELECT id FROM roles WHERE code = ?", [code]);
    if (existing[0]) throw ApiError.conflict("Role code already exists");

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute<ResultSetHeader>(
        "INSERT INTO roles (code, name, description, is_system) VALUES (?, ?, ?, 0)",
        [code, name, description ?? null]
      );
      const roleId = result.insertId;
      if (permissions && permissions.length > 0) {
        await insertRolePermissions(conn, roleId, permissions);
      }
      await conn.commit();
      await auditLog({
        user: { id: req.user!.id },
        action: "CREATE",
        resource: "role",
        resourceId: roleId,
        after: { code, name, permissions: permissions ?? [] },
        ip: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      success(res, { id: roleId }, 201);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  })
);

const updateRoleSchema = z.object({
  name: z.string().min(2).max(128).optional(),
  description: z.string().max(255).optional().nullable(),
});

adminRouter.put(
  "/roles/:id",
  requirePermission("admin.roles.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid role id");
    const roles = await query<RoleRow & RowDataPacket>("SELECT * FROM roles WHERE id = ?", [id]);
    const role = roles[0];
    if (!role) throw ApiError.notFound("Role not found");

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid role payload", parsed.error.flatten());

    await execute("UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?", [
      parsed.data.name ?? null,
      parsed.data.description ?? null,
      id,
    ]);
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "role",
      resourceId: id,
      before: { name: role.name, description: role.description },
      after: { name: parsed.data.name ?? role.name, description: parsed.data.description ?? role.description },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { updated: true });
  })
);

const setPermissionsSchema = z.object({
  permissions: z.array(z.string().min(1)).max(300),
});

adminRouter.put(
  "/roles/:id/permissions",
  requirePermission("admin.roles.update"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid role id");
    const roles = await query<RoleRow & RowDataPacket>("SELECT code FROM roles WHERE id = ?", [id]);
    const role = roles[0];
    if (!role) throw ApiError.notFound("Role not found");

    const parsed = setPermissionsSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid permissions payload", parsed.error.flatten());

    // Validate every code exists before mutating.
    const codes = parsed.data.permissions;
    if (codes.length > 0) {
      const found = await query<{ code: string } & RowDataPacket>(
        `SELECT code FROM permissions WHERE code IN (${codes.map(() => "?").join(",")})`,
        codes
      );
      if (found.length !== codes.length) {
        const missing = codes.filter((c) => !found.some((f) => f.code === c));
        throw ApiError.badRequest("Unknown permission code", { missing });
      }
    }

    await execute("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    if (codes.length > 0) {
      const rows = await query<{ id: number; code: string } & RowDataPacket>(
        `SELECT id, code FROM permissions WHERE code IN (${codes.map(() => "?").join(",")})`,
        codes
      );
      for (const p of rows) {
        await execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [id, Number(p.id)]);
      }
    }

    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "role",
      resourceId: id,
      before: { permissions: codes },
      after: { permissions: codes },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    await securityEvent({
      eventType: "PERMISSION_CHANGE",
      userId: req.user!.id,
      resource: "role",
      resourceId: id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      severity: "warning",
      details: { role: role.code, permissions: codes },
    });
    success(res, { updated: true, permissionCount: codes.length });
  })
);

adminRouter.delete(
  "/roles/:id",
  requirePermission("admin.roles.delete"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw ApiError.badRequest("Invalid role id");
    const roles = await query<RoleRow & RowDataPacket>("SELECT * FROM roles WHERE id = ?", [id]);
    const role = roles[0];
    if (!role) throw ApiError.notFound("Role not found");
    if (role.is_system) throw ApiError.forbidden("System roles cannot be deleted");
    if (!role.is_system) {
      const used = await query<{ n: number } & RowDataPacket>(
        "SELECT COUNT(*) n FROM users WHERE role_id = ? AND deleted_at IS NULL",
        [id]
      );
      if ((used[0]?.n ?? 0) > 0) throw ApiError.conflict("Role is assigned to users and cannot be deleted");
    }

    await execute("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    await execute("DELETE FROM roles WHERE id = ?", [id]);
    await auditLog({
      user: { id: req.user!.id },
      action: "DELETE",
      resource: "role",
      resourceId: id,
      before: { code: role.code, name: role.name },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { deleted: true });
  })
);

// ─── Audit & security events ─────────────────────────────────────────────
adminRouter.get(
  "/audit",
  requirePermission("admin.audit.view"),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await listAuditLogs(limit);
    success(res, { logs: rows });
  })
);

adminRouter.get(
  "/security-events",
  requirePermission("admin.audit.view"),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await listSecurityEvents(limit);
    success(res, { events: rows });
  })
);

// ─── helpers ─────────────────────────────────────────────────────────────
import { pool } from "../../lib/pool.js";
import type { ResultSetHeader, PoolConnection } from "mysql2/promise";
import { randomBytes } from "node:crypto";

function cryptoRandom(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

async function insertRolePermissions(conn: PoolConnection, roleId: number, codes: string[]): Promise<void> {
  const [rows] = await conn.query<PermRow[]>(
    `SELECT id, code FROM permissions WHERE code IN (${codes.map(() => "?").join(",")})`,
    codes
  );
  for (const p of rows) {
    await conn.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, Number(p.id)]);
  }
}