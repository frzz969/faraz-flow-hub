/**
 * FARAZZ FLOW — Migration runner (P1).
 * Reads database/migrations/*.sql in lexicographic order and applies only
 * the ones not yet recorded in the `schema_migrations` table.
 *
 * Usage:  npm run migrate          (apply pending)
 *         npm run migrate:down     (mark all as un-applied, for re-run)
 *         npm run migrate --reset  (drop all tables, then re-apply all)
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "..", "database", "migrations");
const FLUSH = process.argv.includes("--reset");

function config() {
  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "farazz_flow",
  };
}

async function main() {
  const cfg = config();
  // Connect without a database so we can create it if missing.
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  });

  try {
    console.log(`\nConnected to MySQL ${cfg.host}:${cfg.port} as ${cfg.user}`);
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.changeUser({ database: cfg.database });
    console.log(`Database \`${cfg.database}\` ready.`);

    if (FLUSH) {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?",
        [cfg.database]
      );
      if (rows.length > 0) {
        await conn.query("SET FOREIGN_KEY_CHECKS = 0");
        for (const row of rows) {
          await conn.query(`DROP TABLE IF EXISTS \`${row.name}\``);
        }
        await conn.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log(`Dropped ${rows.length} existing tables.`);
      }
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    VARCHAR(190) PRIMARY KEY,
        name       VARCHAR(190) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT version FROM schema_migrations"
    );
    const applied = new Set(appliedRows.map((r) => r.version));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    for (const file of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying ${file} ...`);
      await conn.query(sql);
      await conn.query("INSERT INTO schema_migrations (version, name) VALUES (?, ?)", [
        file,
        file,
      ]);
      console.log("  done.");
    }

    console.log(`\nApplied ${pending.length} migration(s).`);
    const [all] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT version FROM schema_migrations ORDER BY version"
    );
    console.log(`Total migrations on record: ${all.length}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err?.message ?? err);
  process.exit(1);
});