import { pgTable, uuid, text, timestamp, integer, bigint, boolean, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { planStatus, planVersionStatus, priceType, billingInterval } from "../enums";

// ============================================================
// catalog.plans — Master plan definitions
// ============================================================
export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: planStatus("status").notNull().default("draft"),
  isPublic: boolean("is_public").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// catalog.plan_versions — Versioned snapshots of plan configuration
// ============================================================
export const planVersions = pgTable(
  "plan_versions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    versionNumber: integer("version_number").notNull(),
    status: planVersionStatus("status").notNull().default("draft"),
    title: text("title"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    changeNotes: text("change_notes"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_plan_version").on(table.planId, table.versionNumber)],
);

// ============================================================
// catalog.plan_prices — Base pricing rows for a plan version
// ============================================================
export const planPrices = pgTable(
  "plan_prices",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id),
    priceType: priceType("price_type").notNull().default("recurring"),
    currency: text("currency").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    billingInterval: billingInterval("billing_interval"),
    billingIntervalCount: integer("billing_interval_count"),
    trialDays: integer("trial_days"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_price_amount", sql`${table.amount} >= 0`),
    check(
      "chk_billing_interval_count",
      sql`${table.billingIntervalCount} IS NULL OR ${table.billingIntervalCount} > 0`,
    ),
  ],
);