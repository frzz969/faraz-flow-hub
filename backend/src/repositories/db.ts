import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "./pool.js";
import { logger } from "../lib/logger.js";

type SqlValue = string | number | boolean | null | Buffer | Date;

/** Run a SELECT-style query and return the rows. */
export async function query<T extends RowDataPacket>(sql: string, params?: SqlValue[]): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params as never);
  return rows;
}

/** Execute a write statement (INSERT/UPDATE/DELETE) and return the result header. */
export async function execute(sql: string, params?: SqlValue[]): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params as never);
  return result;
}

/** Ping the database; throws on failure. */
export async function pingDb(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
  } finally {
    conn.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info("DB pool closed");
}