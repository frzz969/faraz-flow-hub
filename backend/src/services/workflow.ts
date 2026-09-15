import { execute, query } from "../repositories/db.js";
import { ApiError } from "../lib/errors.js";
import type { RowDataPacket } from "mysql2/promise";

/**
 * Workflow engine (P6): status-transition maps + history writers.
 * Central place so routers, SSE and notifications stay consistent.
 */

export const SHIPMENT_FLOW: Record<string, readonly string[]> = {
  pending: ["booked", "cancelled", "exception"],
  booked: ["picked_up", "cancelled", "exception"],
  picked_up: ["in_transit", "exception"],
  in_transit: ["out_for_delivery", "exception"],
  out_for_delivery: ["delivered", "failed_attempt", "exception"],
  delivered: [],
  cancelled: [],
  exception: ["out_for_delivery", "cancelled"],
};

export const DELIVERY_FLOW: Record<string, readonly string[]> = {
  scheduled: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "failed_attempt", "returned"],
  delivered: [],
  failed_attempt: ["out_for_delivery", "returned"],
  returned: [],
};

export const ORDER_FLOW: Record<string, readonly string[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const RETURN_FLOW: Record<string, readonly string[]> = {
  requested: ["approved", "rejected"],
  approved: ["picked_up"],
  picked_up: ["returned"],
  returned: [],
  rejected: [],
};

export const EXCEPTION_FLOW: Record<string, readonly string[]> = {
  open: ["reviewing", "resolved", "closed"],
  reviewing: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export const APPROVAL_DECIDE = ["approved", "rejected"] as const;

interface ShipmentRow extends RowDataPacket {
  id: number;
  status: string;
}

/** Validate + write a status change to shipment_status_history and audit caller handles the rest. */
export async function advanceShipmentStatus(
  shipmentId: number,
  next: string,
  note: string | null,
  changedBy: number
): Promise<{ from: string; to: string }> {
  const rows = await query<ShipmentRow>("SELECT id, status FROM shipments WHERE id = ? AND deleted_at IS NULL", [shipmentId]);
  const shipment = rows[0];
  if (!shipment) throw ApiError.notFound("Shipment not found");

  const allowed = SHIPMENT_FLOW[shipment.status] ?? [];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`Invalid transition ${shipment.status} → ${next}. Allowed: ${allowed.join(", ") || "(terminal state)"}`, {
      from: shipment.status,
      to: next,
      allowed,
    });
  }

  await execute("UPDATE shipments SET status = ?, delivered_at = IF(?, NOW(), delivered_at) WHERE id = ? AND deleted_at IS NULL", [
    next,
    next === "delivered" ? 1 : 0,
    shipmentId,
  ]);
  await execute(
    "INSERT INTO shipment_status_history (shipment_id, status, note, changed_by) VALUES (?, ?, ?, ?)",
    [shipmentId, next, note ?? null, changedBy]
  );
  return { from: shipment.status, to: next };
}

/** Validate a generic transition against a flow map and run the UPDATE. */
export async function transitionFlow(
  table: "orders" | "deliveries" | "returns" | "exceptions",
  flow: Record<string, readonly string[]>,
  id: number,
  next: string,
  changedBy: number
): Promise<{ from: string; to: string }> {
  const rows = await query<ShipmentRow>(`SELECT id, status FROM ${table} WHERE id = ?`, [id]);
  const row = rows[0];
  if (!row) throw ApiError.notFound(`${table.slice(0, -1)} not found`);
  const allowed = flow[row.status] ?? [];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`Invalid transition ${row.status} → ${next}`, { from: row.status, to: next, allowed });
  }
  await execute(`UPDATE ${table} SET status = ?, updated_at = NOW() WHERE id = ?`, [next, id]);
  return { from: row.status, to: next };
}