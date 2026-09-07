import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

/**
 * API error with an HTTP status and a stable machine-readable code.
 * The error envelope shape is:
 *   { success: false, error: { code, message, details? } }
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have permission to perform this action") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message = "Resource conflict") {
    return new ApiError(409, "CONFLICT", message);
  }
  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, "TOO_MANY_REQUESTS", message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

export function success<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

/** Wrap an async route handler so rejections reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Express error middleware — always returns the standard envelope. */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
    return;
  }
  logger.error("Unhandled error", { message: err instanceof Error ? err.message : String(err) });
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      ...(isDev ? { details: { message: err instanceof Error ? err.message : String(err) } } : {}),
    },
  });
}

/** 404 for unknown API routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}