import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { creditPackageStatus } from "../enums";
import { sql } from "drizzle-orm";

// ============================================================
// credits.credit_packages — Sellable credit packs
// ============================================================
export const creditPackages = pgTable(
  "credit_packages",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    status: creditPackageStatus("status").notNull().default("draft"),
    creditAmount: bigint("credit_amount", { mode: "number" }).notNull(),
    expiryDays: integer("expiry_days"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("chk_credit_amount", sql`${table.creditAmount} > 0`)],
);