/**
 * FARAZZ FLOW — Database backup via mysqldump.
 *
 * Usage: npm run backup
 *   - dumps the configured database into backups/YYYY-MM-DD_HHmmss.sql.gz
 *   - keeps the newest BACKUP_KEEP (default 15) files, prunes the rest
 *   - resolves mysqldump automatically: DB_* env vars from .env, binary path
 *     guessed for Laragon installs (FALLBACK_MYSQLDUMP override also supported)
 */
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream, readdirSync, unlinkSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { createGzip } from "node:zlib";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const backupsDir = join(root, "backups");

const dbName = process.env.DB_NAME ?? "farazz_flow";
const dbHost = process.env.DB_HOST ?? "127.0.0.1";
const dbPort = process.env.DB_PORT ?? "3306";
const dbUser = process.env.DB_USER ?? "root";
const dbPassword = process.env.DB_PASSWORD ?? "";

/** Resolve the mysqldump client binary. */
function resolveMysqldump(): string {
  if (process.env.FALLBACK_MYSQLDUMP) return process.env.FALLBACK_MYSQLDUMP;
  const explicitPaths = [
    "C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump.exe",
    "C:\\laragon\\bin\\mysql\\mysql-8.4-winx64\\bin\\mysqldump.exe",
    "C:\\laragon\\bin\\mysql\\mysql-8.0-winx64\\bin\\mysqldump.exe",
    "C:\\laragon\\bin\\mysql\\mysql-5.7-winx64\\bin\\mysqldump.exe",
  ];
  for (const p of explicitPaths) {
    try {
      if (existsSync(p)) return p;
    } catch {
      /* ignore invalid path */
    }
  }
  return "mysqldump"; // assume it is on PATH
}

const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 15));

if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
const filename = `${dbName}_${stamp}.sql.gz`;
const target = join(backupsDir, filename);

console.log(`[backup] dumping ${dbName} -> ${target}`);

const dump = spawn(
  resolveMysqldump(),
  ["-h", dbHost, "-P", String(dbPort), "-u", dbUser, "--single-transaction", "--routines", "--triggers", "--default-character-set=utf8mb4", dbName],
  {
    stdio: ["ignore", "pipe", "inherit"],
    windowsHide: true,
    // Pass the password via env instead of the command line so it never
    // appears in the process list.
    env: { ...process.env, MYSQL_PWD: dbPassword },
  }
);

dump.on("error", (err) => {
  console.error(`[backup] failed to spawn mysqldump: ${err.message}`);
  process.exit(1);
});

const sink = createWriteStream(target);
dump.stdout.pipe(createGzip()).pipe(sink);

sink.on("finish", () => {
  const sizeMb = (statSync(target).size / (1024 * 1024)).toFixed(2);
  console.log(`[backup] done: ${filename} (${sizeMb} MB)`);

  // Prune old backups, keep newest N.
  const entries = readdirSync(backupsDir)
    .filter((f) => f.endsWith(".sql.gz"))
    .map((f) => ({ f, t: statSync(join(backupsDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const old of entries.slice(keep)) {
    unlinkSync(join(backupsDir, old.f));
    console.log(`[backup] pruned ${old.f}`);
  }
});

sink.on("error", (err) => {
  console.error(`[backup] write failed: ${err.message}`);
  process.exit(1);
});

dump.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
});