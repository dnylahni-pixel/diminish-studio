import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Database Tables ===\n");

  // Get all tables with schema name
  const tables = await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name;
  `;

  if (tables.length === 0) {
    console.log("No tables found.");
  } else {
    for (const t of tables) {
      console.log(`  ${t.table_schema}.${t.table_name}`);

      // Get columns for each table
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = ${t.table_schema}
          AND table_name = ${t.table_name}
        ORDER BY ordinal_position;
      `;

      for (const c of columns) {
        console.log(`    ├─ ${c.column_name} (${c.data_type})${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ' default=' + c.column_default : ''}`);
      }
      console.log("");
    }
  }
}

main().catch(console.error);