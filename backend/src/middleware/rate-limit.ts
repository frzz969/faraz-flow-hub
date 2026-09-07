import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { config } from "../config.js";

/**
 * Per-IP rate limiter for authentication endpoints (brute-force guard).
 * In production you may swap this for a shared store (Redis) across nodes.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  limit: config.rateLimit.authMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." },
  },
  handler: (req: Request, res: Response, next: NextFunction) => {
    res
      .status(429)
      .json({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        },
      });
    void next;
  },
});