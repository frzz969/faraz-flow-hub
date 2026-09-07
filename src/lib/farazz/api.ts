/**
 * FARAZZ FLOW — typed API client (P7).
 *
 * Talks to the Express backend at `/api/v1`. Mirrors the exact wire contract
 * verified by the smoke suite (backend/tests + smoke scripts):
 *   success envelope: { success: true,  data: ... }
 *   error envelope:   { success: false, error: { code, message, details? } }
 *
 * List payloads:     data.rows   (makeCrud) or data.history / data.kpis / …
 * Detail payloads:   data.row    (makeCrud) or data.user / data.*
 * Mutations:         data.id / data.updated / data.deleted / transition fields
 *
 * `credentials: "include"` carries the HttpOnly session cookie (dev frontend
 * and API are same-site, so SameSite=Lax cookies flow automatically).
 * Every state-changing request sends the double-submit CSRF token that the
 * backend issued at login (x-csrf-token header).
 */

const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
export const API_BASE = (viteEnv?.["VITE_API_URL"] ?? "http://localhost:4100/api/v1").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** True when the server could not be reached at all (network / CORS). */
  readonly network: boolean;

  constructor(status: number, code: string, message: string, network = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.network = network;
  }
}

export interface Envelope<T> {
  success: boolean;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

// ─── CSRF token store ────────────────────────────────────────────────────────
let csrfToken: string | null = null;
export const getCsrfToken = () => csrfToken;
export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

// ─── Low-level request ───────────────────────────────────────────────────────
export async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<Envelope<T>> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrfToken && method !== "GET") headers["x-csrf-token"] = csrfToken;

  let res: Response;
  try {
    const init: RequestInit = { method, headers, credentials: "include" };
    if (body !== undefined) init.body = JSON.stringify(body);
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Cannot reach the FARAZZ FLOW API. Is the backend running on 4100? Falling back to demo data.",
      true
    );
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = (payload as ErrorEnvelope | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `Request failed (HTTP ${res.status})`
    );
  }

  return payload as Envelope<T>;
}

// ─── Auth / session ──────────────────────────────────────────────────────────
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roleName: string;
}

export interface LoginResult {
  user: SessionUser;
  csrfToken: string;
}

export async function login(
  email: string,
  password: string,
  remember = false
): Promise<LoginResult> {
  const env = await request<LoginResult>("POST", "/auth/login", { email, password, remember });
  setCsrfToken(env.data.csrfToken);
  return env.data;
}

export async function logout(): Promise<void> {
  try {
    await request<{ loggedOut: boolean }>("POST", "/auth/logout");
  } finally {
    setCsrfToken(null);
  }
}

export async function me(): Promise<SessionUser> {
  const env = await request<{ user: SessionUser }>("GET", "/auth/me");
  return env.data.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request("POST", "/auth/change-password", { currentPassword, newPassword });
}

export async function revokeSessions(): Promise<number> {
  const env = await request<{ revoked: number }>("POST", "/auth/revoke-sessions");
  return env.data.revoked;
}

// ─── Health / monitoring ─────────────────────────────────────────────────────
export interface HealthData {
  status: string;
  service: string;
  version?: string;
  timestamp?: string;
}

export async function health(): Promise<HealthData> {
  const env = await request<HealthData>("GET", "/health");
  return env.data;
}

export async function healthDb(): Promise<{ status: string; database: string }> {
  const env = await request<{ status: string; database: string }>("GET", "/health/db");
  return env.data;
}

export interface MonitoringOverview {
  uptimeSeconds: number;
  startedAt: string;
  pid: number;
  node: string;
  env: string;
  db: { latencyMs: number | null; poolThreadId: number | null };
  realtime: { online: number };
}

export async function monitoringOverview(): Promise<MonitoringOverview> {
  const env = await request<MonitoringOverview>("GET", "/monitoring/overview");
  return env.data;
}

export interface UsageKpis {
  users: number;
  customers: number;
  suppliers: number;
  vehicles: number;
  drivers: number;
  warehouses: number;
  active_shipments: number;
  pending_approvals: number;
  open_exceptions: number;
  open_tasks: number;
}

export async function usageOverview(): Promise<UsageKpis> {
  const env = await request<{ kpis: UsageKpis }>("GET", "/reports/usage-overview");
  return env.data.kpis;
}

export async function shipmentsByStatus(): Promise<{ status: string; count: number }[]> {
  const env = await request<{ rows: { status: string; count: number }[] }>(
    "GET",
    "/reports/shipments-by-status"
  );
  return env.data.rows;
}

export async function unreadNotifications(): Promise<number> {
  const env = await request<{ count: number }>("GET", "/notifications/unread-count");
  return env.data.count;
}

// ─── Resources (makeCrud-backed) ─────────────────────────────────────────────
export const resources = {
  customers: "/customers",
  suppliers: "/suppliers",
  shipments: "/shipments",
  orders: "/orders",
  deliveries: "/deliveries",
  exceptions: "/exceptions",
  returns: "/returns",
  serviceTypes: "/service-types",
  pricing: "/pricing",
  contracts: "/contracts",
  warehouses: "/warehouses",
  warehouseZones: "/warehouse-zones",
  inventory: "/inventory",
  inbound: "/inbound",
  outbound: "/outbound",
  sorting: "/sorting",
  vehicles: "/vehicles",
  drivers: "/drivers",
  routes: "/routes",
  dispatches: "/dispatches",
  maintenance: "/maintenance",
  billing: "/billing",
  billItems: "/bill-items",
  payments: "/payments",
  cod: "/cod",
  approvals: "/approvals",
  tasks: "/tasks",
  documents: "/documents",
  notifications: "/notifications",
} as const;

export type ResourceKey = keyof typeof resources;

export type ListParams = Record<string, string | number | boolean | null | undefined>;

export interface Page<T> {
  rows: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface Model {
  id: number;
  [k: string]: unknown;
}

function qs(params?: ListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function list<T extends Model>(res: ResourceKey, params?: ListParams): Promise<Page<T>> {
  const env = await request<Page<T>>("GET", `${resources[res]}${qs(params)}`);
  return env.data;
}

export async function get<T extends Model>(res: ResourceKey, id: number | string): Promise<T> {
  const env = await request<{ row: T } | T>("GET", `${resources[res]}/${id}`);
  const data = env.data as { row?: T } & Partial<T>;
  return (data.row ?? data) as T;
}

export async function create<T extends Model>(
  res: ResourceKey,
  body: Record<string, unknown>
): Promise<T> {
  const env = await request<{ id: number } & Partial<T>>("POST", resources[res], body);
  return { ...(body as T), id: env.data.id };
}

export async function update<T extends Model>(
  res: ResourceKey,
  id: number | string,
  patch: Record<string, unknown>
): Promise<T> {
  const env = await request<{ updated: true } & Partial<T>>("PUT", `${resources[res]}/${id}`, patch);
  return { ...(patch as T), ...env.data } as T;
}

export async function remove(res: ResourceKey, id: number | string): Promise<void> {
  await request<{ deleted: true }>("DELETE", `${resources[res]}/${id}`);
}

// ─── Workflow helpers (verified states from the smoke suite) ─────────────────
export const SHIPMENT_STATUSES = [
  "booked",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DISPATCH_STATUSES = ["scheduled", "dispatch", "on_route", "completed", "cancelled"] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export async function advanceShipment(
  id: number,
  status: ShipmentStatus
): Promise<{ id: number; from: string; to: string }> {
  const env = await request<{ id: number; from: string; to: string }>(
    "PATCH",
    `/shipments/${id}/status`,
    { status }
  );
  return env.data;
}

export async function shipmentHistory(id: number): Promise<{ id: number; status: string; changed_at: string; changed_by: string }[]> {
  const env = await request<{ history: { id: number; status: string; changed_at: string; changed_by: string }[] }>(
    "GET",
    `/shipments/${id}/status-history`
  );
  return env.data.history;
}

export async function setOrderStatus(id: number, status: OrderStatus): Promise<{ id: number; transition: unknown }> {
  const env = await request<{ id: number; transition: unknown }>("PATCH", `/orders/${id}/status`, { status });
  return env.data;
}

export async function setDeliveryStatus(
  id: number,
  status: "scheduled" | "out_for_delivery" | "delivered" | "failed"
): Promise<{ id: number; transition: unknown }> {
  const env = await request<{ id: number; transition: unknown }>("PATCH", `/deliveries/${id}/status`, { status });
  return env.data;
}

export async function resolveException(
  id: number,
  body: { status: "resolved"; note?: string }
): Promise<{ id: number; transition: unknown }> {
  const env = await request<{ id: number; transition: unknown }>("PATCH", `/exceptions/${id}/resolve`, body);
  return env.data;
}

export async function decideApproval(
  id: number,
  decision: "approved" | "rejected",
  note?: string
): Promise<{ id: number; decision: string }> {
  const env = await request<{ id: number; decision: string }>("PATCH", `/approvals/${id}/decide`, {
    decision,
    ...(note ? { note } : {}),
  });
  return env.data;
}

export async function setTaskStatus(
  id: number,
  status: "todo" | "in_progress" | "done"
): Promise<{ id: number; status: string }> {
  const env = await request<{ id: number; status: string }>("PATCH", `/tasks/${id}/status`, { status });
  return env.data;
}

export async function setDispatchStatus(
  id: number,
  status: DispatchStatus
): Promise<{ id: number; status: string }> {
  const env = await request<{ id: number; status: string }>("PATCH", `/dispatches/${id}/status`, { status });
  return env.data;
}

export async function setBillingStatus(
  id: number,
  status: "draft" | "sent" | "partial" | "settled" | "cancelled"
): Promise<{ id: number; status: string }> {
  const env = await request<{ id: number; status: string }>("PATCH", `/billing/${id}/status`, { status });
  return env.data;
}

// ─── Files / import-export ───────────────────────────────────────────────────
export interface UploadedFile {
  id: number;
  fileName: string;
  size: number;
}

export async function uploadFile(input: {
  title: string;
  fileName: string;
  mimeType: string;
  dataBase64: string;
}): Promise<UploadedFile> {
  const env = await request<UploadedFile>("POST", "/files", input);
  return env.data;
}

export const downloadFileUrl = (id: number | string) => `${API_BASE}/files/${id}/download`;

export async function fileVersions(id: number | string): Promise<{ rows: unknown[] }> {
  const env = await request<{ rows: unknown[] }>("GET", `/files/${id}/versions`);
  return env.data;
}

export async function importCustomersCsv(
  csv: string
): Promise<{ imported: number; errors: unknown[] }> {
  const env = await request<{ imported: number; errors: unknown[] }>(
    "POST",
    "/import-export/import/customers/csv",
    { csv }
  );
  return env.data;
}

// ─── Convenience all-in-one: try health silently (used by BackendProvider) ───
let healthCache: HealthData | null = null;
export async function pingBackend(timeoutMs = 2500): Promise<HealthData | null> {
  if (healthCache) return healthCache;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    healthCache = (await res.json()) as HealthData;
    return healthCache;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}