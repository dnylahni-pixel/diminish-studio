import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, check } from "drizzle-orm/pg-core";
import { taxType, taxStatus } from "../enums";
import { sql } from "drizzle-orm";

// ============================================================
// billing.tax_rates — Tax/VAT/Sales Tax rate definitions
// ============================================================
export const taxRates = pgTable(
  "tax_rates",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    region: text("region"),
    taxType: taxType("tax_type").notNull(),
    rateBps: integer("rate_bps").notNull(),
    inclusive: boolean("inclusive").notNull().default(false),
    appliesTo: text("applies_to").notNull().default("all"),
    status: taxStatus("status").notNull().default("active"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_rate_bps", sql`${table.rateBps} >= 0 AND ${table.rateBps} <= 10000`),
    check("chk_valid_range", sql`${table.validTo} IS NULL OR ${table.validTo} > ${table.validFrom}`),
  ],
);