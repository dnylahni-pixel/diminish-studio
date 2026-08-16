import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as runpodSchema from "./schema/integrations/runpod";

const DB_PATH = process.env.LOCAL_DB_PATH ?? "./data/runpod.db";

const globalForDb = globalThis as typeof globalThis & {
  __runpodSqliteConn?: Database.Database;
};

function createLocalConnection() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export const sqliteConn =
  globalForDb.__runpodSqliteConn ?? createLocalConnection();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__runpodSqliteConn = sqliteConn;
}

export const localDb = drizzle(sqliteConn, {
  schema: { ...runpodSchema },
});
