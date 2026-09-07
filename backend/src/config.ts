/**
 * Typed application configuration loaded from environment (.env).
 */
function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: int(process.env.PORT, 4100),
  appUrl: process.env.APP_URL ?? "http://localhost:4100",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: int(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "farazz_flow",
  },

  session: {
    ttlHours: int(process.env.SESSION_TTL_HOURS, 12),
    secret: process.env.SESSION_SECRET ?? "dev-insecure-session-secret-change-me",
  },
  csrfSecret: process.env.CSRF_SECRET ?? "dev-insecure-csrf-secret-change-me",

  auth: {
    maxFailed: int(process.env.LOGIN_MAX_FAILED, 5),
    lockMinutes: int(process.env.LOGIN_LOCK_MINUTES, 15),
  },

  rateLimit: {
    authMax: int(process.env.AUTH_RATE_LIMIT_MAX, 20),
    authWindowMs: int(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
  },

  upload: {
    dir: process.env.UPLOAD_DIR ?? "./uploads",
    maxMb: int(process.env.UPLOAD_MAX_MB, 10),
  },

  logging: {
    level: process.env.LOG_LEVEL ?? "info",
  },
} as const;

export type AppConfig = typeof config;

/** True when running in production mode. */
export const isProd = config.env === "production";