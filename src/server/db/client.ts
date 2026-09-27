import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { readDbConfig } from "./config";

// Lazy singleton: the build must succeed without DB env vars,
// and dev hot-reload must not open a new pool per reload.
const globalForDb = globalThis as unknown as { vwPool?: mysql.Pool; vwDb?: MySql2Database };

export function getPool(): mysql.Pool {
  if (!globalForDb.vwPool) {
    const cfg = readDbConfig(process.env);
    globalForDb.vwPool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 5000,
    });
  }
  return globalForDb.vwPool;
}

export function getDb(): MySql2Database {
  globalForDb.vwDb ??= drizzle(getPool());
  return globalForDb.vwDb;
}
