import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { errorMiddleware, notFoundHandler } from "./lib/errors.js";
import { healthRouter } from "./routes/v1/health.js";
import { authPublicRouter, authRouter } from "./routes/v1/auth.js";
import { csrfProtect } from "./middleware/csrf.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // CORS for the frontend dev server
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (curl, tests) and configured origins.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        if (config.env !== "production") return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
        ms: Date.now() - start,
        ip: req.ip,
      });
    });
    next();
  });

  // API v1 routes
  app.use("/api/v1", healthRouter);
  // Login issues the CSRF cookie, so it must run before the CSRF gate.
  app.use("/api/v1/auth", authPublicRouter);
  // CSRF guard for all remaining state-changing requests (double-submit).
  app.use("/api/v1", csrfProtect);
  app.use("/api/v1/auth", authRouter);
  // Future: shipmentsRouter, ordersRouter, etc. mounted here.

  app.get("/", (_req, res) => {
    res.json({
      name: "FARAZZ FLOW API",
      version: "1.0.0",
      status: "ok",
      docs: `${config.appUrl}/api/v1`,
    });
  });

  app.use("/", notFoundHandler);
  app.use(errorMiddleware);

  return app;
}