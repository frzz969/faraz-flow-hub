/**
 * Minimal structured logger. No external deps; plain console with levels.
 */
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const currentLevel = (): number => {
  const l = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return LEVEL_ORDER[l as Level] ?? LEVEL_ORDER.info;
};

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < currentLevel()) return;
  const line = {
    time: new Date().toISOString(),
    level,
    msg: message,
    ...(meta && Object.keys(meta).length > 0 ? meta : {}),
  };
  if (level === "error") console.error(JSON.stringify(line));
  else if (level === "warn") console.warn(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};