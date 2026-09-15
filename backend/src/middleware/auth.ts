import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../repositories/db.js";
import { ApiError, asyncHandler } from "../lib/errors.js";
import { getSessionUserId, readSessionToken, noStore, type SessionMeta } from "../lib/session.js";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_code: string;
  role_name: string;
  department: string | null;
  status: "active" | "inactive";
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_code: string;
  role_name: string;
  department: string | null;
  status: "active" | "inactive";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionMeta?: SessionMeta;
    }
  }
}

/** Load the authenticated user (if any) without failing the request. */
export const attachUser = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const raw = readSessionToken(req);
    const userId = await getSessionUserId(raw);
    if (userId) {
      const rows = await query<UserRow>(
        `SELECT u.id, u.name, u.email, u.phone, u.department, u.status,
                r.code AS role_code, r.name AS role_name
         FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND u.deleted_at IS NULL`,
        [userId]
      );
      const row = rows[0];
      if (row && row.status === "active") {
        req.user = {
          id: Number(row.id),
          name: row.name,
          email: row.email,
          phone: row.phone,
          role_code: row.role_code,
          role_name: row.role_name,
          department: row.department,
          status: row.status,
        };
        const meta: SessionMeta = {};
        if (req.ip) meta.ip = req.ip;
        const ua = req.headers["user-agent"];
        if (ua) meta.userAgent = ua;
        req.sessionMeta = meta;
      }
    }
    next();
  }
);

/** Require an authenticated active user. */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    next();
  }
);

/** Update the user's last_active_at (best-effort, throttled by call sites). */
export async function touchUserActivity(userId: number): Promise<void> {
  await execute("UPDATE users SET last_active_at = NOW() WHERE id = ?", [userId]);
}

export function authedResponseStore(res: Response): void {
  noStore(res);
}