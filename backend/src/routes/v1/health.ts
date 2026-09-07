import { Router } from "express";
import { asyncHandler, success } from "../../lib/errors.js";
import { createRequire } from "node:module";
import { pingDb } from "../../lib/db.js";

/** Expose backend package metadata without importing package.json deeply. */
const require = createRequire(import.meta.url);
const pkg = require("../../../package.json") as { name: string; version: string };
export const packageInfo = { name: pkg.name, version: pkg.version };

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