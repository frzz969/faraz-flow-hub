import { Router } from "express";
import { asyncHandler, success } from "../../lib/errors.js";
import { pingDb } from "../../lib/db.js";
import { packageInfo } from "../../lib/version.js";

export const healthRouter = Router();

/** Liveness: server process is up. */
healthRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    success(res, {
      status: "ok",
      service: "farazz-flow-api",
      version: packageInfo.version,
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
    });
  })
);

/** Readiness: database reachable. */
healthRouter.get(
  "/health/db",
  asyncHandler(async (_req, res) => {
    try {
      await pingDb();
      success(res, { status: "ok", database: "connected" });
    } catch (err) {
      res.status(503).json({
        success: false,
        error: {
          code: "DB_UNAVAILABLE",
          message: "Database is not reachable",
          ...(process.env.NODE_ENV !== "production"
            ? { details: err instanceof Error ? err.message : String(err) }
            : {}),
        },
      });
    }
  })
);