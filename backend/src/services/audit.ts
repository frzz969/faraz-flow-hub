import type { NextFunction, Request, Response } from "express";
import { execute, query } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type { AuthUser } from "../middleware/auth.js";

/**
 * Audit & security-event helpers.
 * `audit_logs`   — structured before/after diffs for authorized reviewers.
 * `security_events` — authentication & authorization anomalies.
 * `activity_logs`   — human-readable timeline (mirrors frontend activity stream).
 */

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "ROLE_CHANGE";

export async function auditLog(params: {
  user: { id: number } | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string | number;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, \`before\`, \`after\`, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.user?.id ?? null,
        params.action,
        params.resource ?? null,
        params.resourceId !== undefined ? String(params.resourceId) : null,
        params.before !== undefined ? JSON.stringify(params.before) : null,
        params.after !== undefined ? JSON.stringify(params.after) : null,
        params.ip ?? null,
        (params.userAgent ?? "").slice(0, 255) || null,
      ]
    );
  } catch (err) {
    logger.warn("auditLog failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

export async function securityEvent(params: {
  eventType: string;
  userId?: number | null;
  resource?: string;
  resourceId?: string | number;
  ip?: string | null;
  userAgent?: string | null;
  severity?: "info" | "warning" | "critical";
  details?: unknown;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO security_events (event_type, user_id, resource, resource_id, ip_address, user_agent, severity, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.eventType,
        params.userId ?? null,
        params.resource ?? null,
        params.resourceId !== undefined ? String(params.resourceId) : null,
        params.ip ?? null,
        (params.userAgent ?? "").slice(0, 255) || null,
        params.severity ?? "warning",
        params.details !== undefined ? JSON.stringify(params.details) : null,
      ]
    );
  } catch (err) {
    logger.warn("securityEvent failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

/** Record a login attempt for history + lockout bookkeeping. */
export async function recordLoginAttempt(params: {
  email: string;
  status: "success" | "failed" | "locked";
  reason?: string;
  userId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO login_history (user_id, email, status, reason, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.userId ?? null,
        params.email,
        params.status,
        params.reason ?? null,
        params.ip ?? null,
        (params.userAgent ?? "").slice(0, 255) || null,
      ]
    );
  } catch (err) {
    logger.warn("recordLoginAttempt failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

/** Simple activity timeline row. */
export async function activityLog(params: {
  user?: AuthUser | null;
  action: string;
  module?: string;
  record?: string;
  before?: string;
  after?: string;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO activity_logs (user_id, user_name, action, module, record, before_value, after_value)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.user?.id ?? null,
        params.user?.name ?? "System",
        params.action,
        params.module ?? null,
        params.record ?? null,
        params.before ?? null,
        params.after ?? null,
      ]
    );
  } catch (err) {
    logger.warn("activityLog failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

/** Read the last N security events (for admin audit screen). */
export async function listSecurityEvents(limit = 100) {
  const rows = await query<RowWithMeta>(`
    SELECT se.*, u.name AS user_name
    FROM security_events se
    LEFT JOIN users u ON u.id = se.user_id
    ORDER BY se.created_at DESC
    LIMIT ?
  `, [limit]);
  return rows.map(formatRow);
}

/** Read the last N audit rows. */
export async function listAuditLogs(limit = 100) {
  const rows = await query<RowWithMeta>(`
    SELECT al.*, u.name AS user_name
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [limit]);
  return rows.map(formatRow);
}

import type { RowDataPacket } from "mysql2/promise";

interface RowWithMeta extends RowDataPacket {
  [key: string]: unknown;
}

function formatRow(row: RowWithMeta): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) {
      try {
        out[k] = JSON.parse(v);
        continue;
      } catch {
        /* keep raw */
      }
    }
    out[k] = v;
  }
  return out;
}

export { ApiError as AuditApiError };