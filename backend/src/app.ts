import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { errorMiddleware, notFoundHandler } from "./lib/errors.js";
import { startHeartbeat } from "./lib/realtime.js";
import { healthRouter } from "./routes/v1/health.js";
import { authPublicRouter, authRouter } from "./routes/v1/auth.js";
import { adminRouter } from "./routes/v1/admin.js";
import { csrfProtect } from "./middleware/csrf.js";

// P5: Operations core
import { customersRouter } from "./routes/v1/customers.js";
import { shipmentsRouter } from "./routes/v1/shipments.js";
import { ordersRouter } from "./routes/v1/orders.js";
import { deliveriesRouter } from "./routes/v1/deliveries.js";
import { exceptionsRouter } from "./routes/v1/exceptions.js";
import { returnsRouter } from "./routes/v1/returns.js";
import { suppliersRouter, serviceTypesRouter, pricingRouter, contractsRouter } from "./routes/v1/business.js";

// Warehouse
import { warehousesRouter, zonesRouter, inventoryRouter, inboundRouter, outboundRouter, sortingRouter } from "./routes/v1/warehouse.js";

// Fleet
import { vehiclesRouter, driversRouter, routesRouter, dispatchesRouter, maintenanceRouter } from "./routes/v1/fleet.js";

// Finance
import { billingRouter, billItemsRouter, paymentsRouter, codRouter } from "./routes/v1/finance.js";

// P6/P9/P8: Workspace, notifications, realtime
import { approvalsRouter, tasksRouter, documentsRouter } from "./routes/v1/workspace.js";
import { notificationsRouter } from "./routes/v1/notifications.js";
import { realtimeRouter } from "./routes/v1/realtime.js";

// P10-P13
import { filesRouter } from "./routes/v1/files.js";
import { importExportRouter } from "./routes/v1/import-export.js";
import { reportsRouter } from "./routes/v1/reports.js";
import { monitoringRouter } from "./routes/v1/monitoring.js";

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

  // Globally accept large JSON (file uploads via base64). Local dev: fine.
  app.use(express.json({ limit: `${Math.max(config.upload.maxMb + 2, 12)}mb` }));
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
  app.use("/api/v1/admin", adminRouter);

  // ── P5 core ──────────────────────────────────────────────────────────────
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/shipments", shipmentsRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/deliveries", deliveriesRouter);
  app.use("/api/v1/exceptions", exceptionsRouter);
  app.use("/api/v1/returns", returnsRouter);
  app.use("/api/v1/suppliers", suppliersRouter);
  app.use("/api/v1/service-types", serviceTypesRouter);
  app.use("/api/v1/pricing", pricingRouter);
  app.use("/api/v1/contracts", contractsRouter);

  // ── Warehouse ────────────────────────────────────────────────────────────
  app.use("/api/v1/warehouses", warehousesRouter);
  app.use("/api/v1/warehouse-zones", zonesRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/inbound", inboundRouter);
  app.use("/api/v1/outbound", outboundRouter);
  app.use("/api/v1/sorting", sortingRouter);

  // ── Fleet ────────────────────────────────────────────────────────────────
  app.use("/api/v1/vehicles", vehiclesRouter);
  app.use("/api/v1/drivers", driversRouter);
  app.use("/api/v1/routes", routesRouter);
  app.use("/api/v1/dispatches", dispatchesRouter);
  app.use("/api/v1/maintenance", maintenanceRouter);

  // ── Finance ──────────────────────────────────────────────────────────────
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/bill-items", billItemsRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/cod", codRouter);

  // ── Workspace / communications ───────────────────────────────────────────
  app.use("/api/v1/approvals", approvalsRouter);
  app.use("/api/v1/tasks", tasksRouter);
  app.use("/api/v1/documents", documentsRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/realtime", realtimeRouter);

  // ── Files / import-export / reports / monitoring ─────────────────────────
  app.use("/api/v1/files", filesRouter);
  app.use("/api/v1/import-export", importExportRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/monitoring", monitoringRouter);

  app.get("/", (_req, res) => {
    res.json({
      name: "FARAZZ FLOW API",
      version: "1.0.0",
      status: "ok",
      docs: `${config.appUrl}/api/v1`,
    });
  });

  // SSE heartbeat keeps realtime streams alive.
  startHeartbeat();

  app.use("/", notFoundHandler);
  app.use(errorMiddleware);

  return app;
}