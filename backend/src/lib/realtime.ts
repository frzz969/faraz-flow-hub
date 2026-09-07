import type { Response } from "express";
import { logger } from "./logger.js";

/**
 * Minimal SSE hub.
 * publish(userId, event, payload) → every open stream for that user
 * (or all streams when userId is null) receives the event.
 */

interface Stream {
  userId: number;
  res: Response;
}

const streams = new Map<number, Set<Response>>();

/** Attach a client stream to the hub (called by the SSE route). */
export function subscribe(userId: number, res: Response): void {
  let set = streams.get(userId);
  if (!set) {
    set = new Set();
    streams.set(userId, set);
  }
  set.add(res);
  res.on("close", () => {
    set!.delete(res);
    if (set!.size === 0) streams.delete(userId);
  });
}

/** Force-close a stream (used on heartbeat write failure). */
export function unsubscribe(res: Response): void {
  for (const set of streams.values()) {
    if (set.delete(res)) {
      if (set.size === 0) streams.delete([...streams.entries()].find(([, s]) => s === set)?.[0] ?? -1);
      break;
    }
  }
}

export function publish(userId: number | null, event: string, payload: Record<string, unknown>): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  if (userId === null) {
    for (const set of streams.values()) {
      for (const res of [...set]) {
        try {
          res.write(message);
        } catch {
          unsubscribe(res);
        }
      }
    }
    return;
  }
  const set = streams.get(userId);
  if (!set) return;
  for (const res of [...set]) {
    try {
      res.write(message);
    } catch {
      unsubscribe(res);
    }
  }
}

export function onlineCount(): number {
  let n = 0;
  for (const set of streams.values()) n += set.size;
  return n;
}

/** Heartbeat: `event: ping` every interval to keep connections alive. */
export function startHeartbeat(intervalMs = 25000): NodeJS.Timeout {
  const handle = setInterval(() => {
    for (const set of streams.values()) {
      for (const res of [...set]) {
        try {
          res.write("event: ping\ndata: {}\n\n");
        } catch (err) {
          logger.warn("SSE heartbeat write failed", { message: err instanceof Error ? err.message : String(err) });
          unsubscribe(res);
        }
      }
    }
  }, intervalMs);
  return handle;
}