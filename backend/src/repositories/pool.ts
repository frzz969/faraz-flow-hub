import mysql from "mysql2/promise";
import { config } from "../config/config.js";

/**
 * Shared connection pool for the whole API.
 * `dateStrings: true` keeps DATETIME values as 'YYYY-MM-DD HH:MM:SS' strings
 * (safe for JSON serialization and avoids timezone shifts).
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
  decimalNumbers: true,
});