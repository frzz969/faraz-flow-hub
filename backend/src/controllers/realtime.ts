import { Router } from "express";
import { asyncHandler, success } from "../lib/errors.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { subscribe, publish, onlineCount } from "../lib/realtime.js";

/**
 * Server-Sent Events endpoint (P8).
 * GET /api/v1/realtime — authenticated stream of live events.
 * Heartbeat started once in app.ts via startHeartbeat().
 */
export const realtimeRouter = Router();

realtimeRouter.use(attachUser, requireAuth);

realtimeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ user: req.user!.id, online: onlineCount() })}\n\n`);

    subscribe(req.user!.id, res);
    // Server will detect socket close and clean up.
    req.on("close", () => {});
    // Keep the handler alive: heartbeat interval writes ping events.
  })
);

realtimeRouter.get(
  "/ping",
  asyncHandler(async (_req, res) => {
    publish(null, "ping", { at: Date.now() });
    success(res, { ok: true, online: onlineCount() });
  })
);