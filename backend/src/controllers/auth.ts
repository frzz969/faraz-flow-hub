import { Router } from "express";
import { z } from "zod";
import { query, execute } from "../repositories/db.js";
import { asyncHandler, success, ApiError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/security.js";
import {
  createSession,
  revokeSession,
  revokeOtherSessions,
  readSessionToken,
  sessionCookieValue,
  clearSessionCookie,
  touchSession,
  getSessionUserId,
} from "../lib/session.js";
import { auditLog, recordLoginAttempt, securityEvent } from "../services/audit.js";
import { attachUser, requireAuth, touchUserActivity } from "../middleware/auth.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { authRateLimiter } from "../middleware/rate-limit.js";
import { config } from "../config/config.js";
import type { RowDataPacket } from "mysql2/promise";

/**
 * Login is csrf-exempt: it is the endpoint that issues the CSRF cookie.
 * Everything else in authRouter is mounted behind csrfProtect (see app.ts).
 */
export const authPublicRouter = Router();
export const authRouter = Router();

// ─── Login ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional(),
});

interface LoginRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role_code: string;
  role_name: string;
  status: "active" | "inactive";
  password_hash: string;
  failed_login_attempts: number;
  locked_until: string | null;
}

// Constant-time fake hash used when the email is unknown.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

authPublicRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest("Invalid login payload", parsed.error.flatten());
    }
    const { email, password, remember } = parsed.data;
    const ip = req.ip;
    const ua = req.headers["user-agent"];

    const rows = await query<LoginRow>(
      `SELECT u.id, u.name, u.email, u.status, u.password_hash, u.failed_login_attempts,
              u.locked_until, r.code AS role_code, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase()]
    );
    const user = rows[0];

    if (!user) {
      verifyPassword(password, DUMMY_HASH);
      await recordLoginAttempt({
        email: email.toLowerCase(),
        status: "failed",
        reason: "unknown_user",
        userId: null,
        ip: ip ?? null,
        userAgent: ua ?? null,
      });
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Locked?
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      await recordLoginAttempt({
        email: email.toLowerCase(),
        status: "locked",
        reason: "account_locked",
        userId: Number(user.id),
        ip: ip ?? null,
        userAgent: ua ?? null,
      });
      throw ApiError.unauthorized("Account is temporarily locked. Try again later.");
    }

    if (!verifyPassword(password, user.password_hash)) {
      const attempts = Number(user.failed_login_attempts) + 1;
      const maxFailed = config.auth.maxFailed;
      if (attempts >= maxFailed) {
        await execute(
          "UPDATE users SET failed_login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
          [attempts, config.auth.lockMinutes, user.id]
        );
        await securityEvent({
          eventType: "ACCOUNT_LOCKOUT",
          userId: Number(user.id),
          resource: "user",
          resourceId: Number(user.id),
          ip: ip ?? null,
          userAgent: ua ?? null,
          severity: "warning",
          details: { email, attempts },
        });
      } else {
        await execute("UPDATE users SET failed_login_attempts = ? WHERE id = ?", [attempts, user.id]);
      }
      await recordLoginAttempt({
        email: email.toLowerCase(),
        status: "failed",
        reason: "bad_password",
        userId: Number(user.id),
        ip: ip ?? null,
        userAgent: ua ?? null,
      });
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (user.status !== "active") {
      await recordLoginAttempt({
        email: email.toLowerCase(),
        status: "failed",
        reason: "inactive_account",
        userId: Number(user.id),
        ip: ip ?? null,
        userAgent: ua ?? null,
      });
      throw ApiError.forbidden("Account is not active");
    }

    // OK: reset counters, create session, set cookies.
    await execute(
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?",
      [user.id]
    );
    const ttlHours = remember === true ? 168 : config.session.ttlHours;
    const raw = await createSession(Number(user.id), {
      ip: ip ?? null,
      userAgent: ua ?? null,
    });

    res.append("Set-Cookie", sessionCookieValue(raw, ttlHours));
    const csrfToken = issueCsrfToken(res);

    await recordLoginAttempt({
      email: email.toLowerCase(),
      status: "success",
      userId: Number(user.id),
      ip: ip ?? null,
      userAgent: ua ?? null,
    });
    await auditLog({
      user: { id: Number(user.id) },
      action: "LOGIN",
      resource: "user",
      resourceId: Number(user.id),
      ip: ip ?? null,
      userAgent: ua ?? null,
    });

    success(
      res,
      {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role_code,
          roleName: user.role_name,
        },
        csrfToken,
      },
      200
    );
  })
);

// ─── Logout ───────────────────────────────────────────────────────────────
authRouter.post(
  "/logout",
  attachUser,
  asyncHandler(async (req, res) => {
    const raw = readSessionToken(req);
    const uid = await getSessionUserId(raw);
    if (uid) {
      await auditLog({
        user: { id: uid },
        action: "LOGOUT",
        resource: "user",
        resourceId: uid,
        ip: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
    }
    await revokeSession(raw);
    res.append("Set-Cookie", clearSessionCookie());
    success(res, { loggedOut: true });
  })
);

// ─── Current user ─────────────────────────────────────────────────────────
authRouter.get(
  "/me",
  attachUser,
  requireAuth,
  asyncHandler(async (req, res) => {
    await touchSession(readSessionToken(req));
    await touchUserActivity(req.user!.id);
    success(res, { user: req.user });
  })
);

// ─── Change password ──────────────────────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain letters")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

interface PwRow extends RowDataPacket {
  password_hash: string;
}

authRouter.post(
  "/change-password",
  attachUser,
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest("Invalid password payload", parsed.error.flatten());
    }
    const { currentPassword, newPassword } = parsed.data;

    const rows = await query<PwRow>("SELECT password_hash FROM users WHERE id = ?", [req.user!.id]);
    const row = rows[0];
    if (!row || !verifyPassword(currentPassword, row.password_hash)) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashPassword(newPassword),
      req.user!.id,
    ]);
    await auditLog({
      user: { id: req.user!.id },
      action: "PASSWORD_CHANGE",
      resource: "user",
      resourceId: req.user!.id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    await securityEvent({
      eventType: "PASSWORD_CHANGE",
      userId: req.user!.id,
      resource: "user",
      resourceId: req.user!.id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      severity: "info",
    });

    // Sessions stay valid; password change does not force logout by design.
    success(res, { changed: true });
  })
);

// ─── Revoke all other sessions ────────────────────────────────────────────
authRouter.post(
  "/revoke-sessions",
  attachUser,
  requireAuth,
  asyncHandler(async (req, res) => {
    const raw = readSessionToken(req);
    const count = await revokeOtherSessions(req.user!.id, raw);
    await securityEvent({
      eventType: "SESSIONS_REVOKED",
      userId: req.user!.id,
      resource: "user",
      resourceId: req.user!.id,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      severity: "info",
      details: { count },
    });
    success(res, { revoked: count });
  })
);