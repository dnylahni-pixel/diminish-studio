import { pool } from "./index";

const migrations: string[] = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "storage_used_bytes" bigint DEFAULT 0 NOT NULL`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "storage_quota_bytes" bigint DEFAULT 1073741824 NOT NULL`,
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
      console.log(`[migration] executed: ${sql.slice(0, 80)}...`);
    }
    console.log(`[migration] all ${migrations.length} migrations applied`);
  } finally {
    client.release();
  }
}