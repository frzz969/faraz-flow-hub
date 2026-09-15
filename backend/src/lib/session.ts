import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config/config.js";
import { query, execute } from "../repositories/db.js";
import { logger } from "./logger.js";

export const SESSION_COOKIE = "ffz_session";

interface SessionRow extends RowDataPacket {
  id: number;
  user_id: number;
  expires_at: string;
}

// ─── Token storage ─────────────────────────────────────────────────────────
// The DB stores only the SHA-256 of the session token; the raw token goes to
// the browser cookie. This makes a DB leak useless for hijacking.
function digest(raw: string): Buffer {
  return createHash("sha256").update(raw).digest();
}

export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
} {
  return { httpOnly: true, sameSite: "lax", secure: config.env === "production", path: "/" };
}

/** Compute the Set-Cookie header value for a session's raw token. */
export function sessionCookieValue(rawToken: string, ttlHours = config.session.ttlHours): string {
  const options = sessionCookieOptions();
  const parts = [`${SESSION_COOKIE}=${rawToken}`, `Path=${options.path}`, "HttpOnly", "SameSite=Lax"];
  if (options.secure) parts.push("Secure");
  parts.push(`Max-Age=${ttlHours * 3600}`);
  return parts.join("; ");
}

/** Clear the session cookie. */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Create a session for a user. Returns the raw token to set as a cookie.
 * Also removes expired sessions for that user first (garbage collection).
 */
export async function createSession(
  userId: number,
  meta: SessionMeta
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = digest(raw).toString("hex");
  const expires = new Date(Date.now() + config.session.ttlHours * 3600 * 1000);

  await execute("DELETE FROM sessions WHERE user_id = ? AND expires_at < NOW()", [userId]);
  await execute(
    `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, meta.ip ?? null, (meta.userAgent ?? "").slice(0, 255) || null, expires]
  );

  return raw;
}

/** Load a session by raw cookie token; returns user_id when valid & unexpired. */
export async function getSessionUserId(raw: string | undefined): Promise<number | null> {
  if (!raw) return null;
  const tokenHash = digest(raw).toString("hex");
  const rows = await query<SessionRow>(
    `SELECT id, user_id, expires_at FROM sessions
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  return Number(row.user_id);
}

/** Revoke a session (logout). Idempotent; unknown tokens are not an error. */
export async function revokeSession(raw: string | undefined): Promise<void> {
  if (!raw) return;
  const tokenHash = digest(raw).toString("hex");
  await execute("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
}

/** Revoke every session belonging to a user except the current one. */
export async function revokeOtherSessions(
  userId: number,
  currentRaw: string | undefined
): Promise<number> {
  const currentHash = currentRaw ? digest(currentRaw).toString("hex") : null;
  if (currentHash) {
    const r = await execute(
      "UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND token_hash <> ?",
      [userId, currentHash]
    );
    return r.affectedRows;
  }
  const r = await execute("UPDATE sessions SET revoked_at = NOW() WHERE user_id = ?", [userId]);
  return r.affectedRows;
}

/** Touch last_seen_at so session lists show real activity. Best-effort. */
export async function touchSession(raw: string | undefined): Promise<void> {
  if (!raw) return;
  try {
    const tokenHash = digest(raw).toString("hex");
    await execute("UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = ?", [tokenHash]);
  } catch (err) {
    logger.warn("touchSession failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

/** Read a session token from the signed session cookie. */
export function readSessionToken(req: Request): string | undefined {
  const value = req.cookies?.[SESSION_COOKIE] as string | undefined;
  return value || undefined;
}

/** Prevent caching for authenticated responses. */
export function noStore(res: Response): void {
  res.setHeader("Cache-Control", "no-store");
}

export type SessionMeta = { ip?: string | null; userAgent?: string | null };