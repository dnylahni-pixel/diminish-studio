import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env" });
const url = process.env.DATABASE_URL;
console.log("host:", new URL(url).host, "| db:", new URL(url).pathname);

const sql = neon(url);
const queries = [
  sql`select count(*) as n from information_schema.tables where table_schema='public'`,
  sql`select to_regclass('public.plan_prices') as plan_prices, to_regclass('public.plans') as plans, to_regclass('public.subscriptions') as subs, to_regclass('public.users') as users`,
  sql`select distinct "currency" from "plan_prices" where "plan_prices"."is_active" = true order by "plan_prices"."currency" asc`,
];
for (const q of queries) {
  try {
    const rows = await q;
    console.log("OK rows:", JSON.stringify(rows));
  } catch (e) {
    console.log("---ERROR---");
    console.log("name:", e?.constructor?.name);
    console.log("message:", e?.message);
    console.log("code:", e?.code, "| status:", e?.status);
    console.log("cause:", e?.cause?.message ?? e?.cause ?? "(none)");
    if ((e?.cause?.message ?? e?.message ?? "").includes("does not exist")) {
      console.log(">>> TABLE/COLUMN DOES NOT EXIST");
    }
  }
}
