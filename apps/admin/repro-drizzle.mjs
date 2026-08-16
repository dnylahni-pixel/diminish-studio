import { config } from "dotenv";
config({ path: ".env" });

const { neon } = await import("@neondatabase/serverless");
const { drizzle } = await import("drizzle-orm/neon-http");
const { eq, asc, sql } = await import("drizzle-orm");
const { pgTable, uuid, text, bigint, boolean, integer, jsonb, timestamp } = await import("drizzle-orm/pg-core");

// Mirror of apps/admin plan_prices table (catalog/plans.ts)
const planPrices = pgTable("plan_prices", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  planVersionId: uuid("plan_version_id").notNull(),
  priceType: text("price_type").notNull().default("recurring"),
  currency: text("currency").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  billingInterval: text("billing_interval"),
  billingIntervalCount: integer("billing_interval_count"),
  trialDays: integer("trial_days"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient, { schema: { planPrices } });

console.log("--- run 1: exact failing query (isActive = true) ---");
try {
  const rows = await db
    .selectDistinct({ currency: planPrices.currency })
    .from(planPrices)
    .where(eq(planPrices.isActive, true))
    .orderBy(asc(planPrices.currency));
  console.log("OK rows:", JSON.stringify(rows));
} catch (e) {
  console.log("name:", e?.constructor?.name);
  console.log("message:", e?.message);
  console.log("cause message:", e?.cause?.message ?? e?.cause ?? "(none)");
  console.log("cause code:", e?.cause?.code, "| status:", e?.cause?.status);
}

console.log("--- run 2: simple select count ---");
try {
  const rows = await db.select({ n: sql`count(*)` }).from(planPrices);
  console.log("OK rows:", JSON.stringify(rows));
} catch (e) {
  console.log("name:", e?.constructor?.name);
  console.log("message:", e?.message);
  console.log("cause message:", e?.cause?.message ?? e?.cause ?? "(none)");
}
