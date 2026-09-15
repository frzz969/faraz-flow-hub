import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { query } from "../repositories/db.js";
import { ApiError } from "../lib/errors.js";

/**
 * Server-side RBAC. Permission codes look like 'shipments.view',
 * 'admin.users.update', etc. and live in the `permissions` table.
 * A role maps to permissions through `role_permissions`.
 *
 * super_admin is granted implicit access to every permission code
 * (matching the frontend matrix where Super Admin gets all levels).
 */

interface PermissionRow extends RowDataPacket {
  code: string;
}

/** All permission codes currently assigned to a user (front-end enforced too). */
export async function permissionsForUser(userId: number): Promise<Set<string>> {
  const rows = await query<PermissionRow>(
    `SELECT DISTINCT p.code
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u ON u.role_id = rp.role_id
     WHERE u.id = ?`,
    [userId]
  );
  return new Set(rows.map((r) => r.code));
}

/** Middleware: require an authenticated user with the given permission code. */
export function requirePermission(code: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) throw ApiError.unauthorized();

      if (user.role_code === "super_admin") {
        next();
        return;
      }

      const perms = await permissionsForUser(user.id);
      if (!perms.has(code)) {
        throw ApiError.forbidden(`Missing permission: ${code}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** True when the current user may access `code`; never throws for auth state. */
export async function can(user: { id: number; role_code: string }, code: string): Promise<boolean> {
  if (user.role_code === "super_admin") return true;
  const perms = await permissionsForUser(user.id);
  return perms.has(code);
}