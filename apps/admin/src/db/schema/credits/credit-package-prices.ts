import { pgTable, uuid, text, timestamp, bigint, boolean, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { creditPackages } from "./credit-packages";

// ============================================================
// credits.credit_package_prices — Pricing for sellable credit packages
// ============================================================
export const creditPackagePrices = pgTable(
  "credit_package_prices",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    creditPackageId: uuid("credit_package_id")
      .notNull()
      .references(() => creditPackages.id),
    currency: text("currency").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("chk_amount", sql`${table.amount} >= 0`)],
);