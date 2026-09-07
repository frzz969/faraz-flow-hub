import type { NextFunction, Request, Response } from "express";
import { createHmac, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { ApiError } from "../lib/errors.js";

/**
 * Double-submit CSRF protection for same-site cookie sessions.
 *
 * - On login we set a readable `ffz_csrf` cookie whose value is a random token
 *   wrapped with an HMAC signature:  `token.signature`
 * - The same token is returned in the login/me response body so the SPA can
 *   store it and echo it in the `x-csrf-token` header on state-changing calls.
 * - csrfProtect compares the header against the signed cookie payload.
 *   Safe methods (GET/HEAD/OPTIONS) are exempt.
 */

export const CSRF_COOKIE = "ffz_csrf";

function sign(raw: string): string {
  return createHmac("sha256", config.csrfSecret).update(raw).digest("base64url");
}

/** Issue a new csrf token: set cookie + return the raw token for the client. */
export function issueCsrfToken(res: Response): string {
  const token = randomBytes(24).toString("base64url");
  const signed = `${token}.${sign(token)}`;
  res.append("Set-Cookie", `${CSRF_COOKIE}=${signed}; Path=/; SameSite=Lax; ${config.env === "production" ? "Secure; " : ""}`);
  return token;
}

/** Validate the `x-csrf-token` header against the signed cookie. */
export const csrfProtect = (req: Request, _res: Response, next: NextFunction): void => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const header = req.headers["x-csrf-token"];
  const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (typeof header !== "string" || header.length === 0 || !cookie) {
    throw ApiError.forbidden("Missing CSRF token");
  }
  const dot = cookie.lastIndexOf(".");
  if (dot <= 0) {
    throw ApiError.forbidden("Invalid CSRF token");
  }
  const payload = cookie.slice(0, dot);
  const signature = cookie.slice(dot + 1);
  const expected = sign(payload);
  if (expected !== signature) {
    throw ApiError.forbidden("Invalid CSRF token");
  }
  if (payload !== header) {
    throw ApiError.forbidden("CSRF token mismatch");
  }

  // Belt-and-braces origin check in production.
  if (config.env === "production") {
    const origin = req.headers.origin ?? req.headers.referer;
    if (origin) {
      try {
        const host = new URL(origin).host;
        const allowed = config.corsOrigins.map((o) => new URL(o).host);
        if (host !== req.headers.host && !allowed.includes(host)) {
          throw ApiError.forbidden("Cross-site request rejected");
        }
      } catch {
        throw ApiError.forbidden("Invalid Origin header");
      }
    }
  }

  next();
};