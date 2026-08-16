import { pgTable, uuid, text, timestamp, integer, bigint, boolean, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { addonScope, priceType, billingInterval, couponType } from "../enums";
import { plans } from "./plans";
import { features } from "./features";

// ============================================================
// catalog.addons — Master addon definitions
// ============================================================
export const addons = pgTable("addons", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  scope: addonScope("scope").notNull().default("subscription"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// catalog.plan_addons — Which addons are available for which plans
// ============================================================
export const planAddons = pgTable(
  "plan_addons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => addons.id),
    isDefault: boolean("is_default").notNull().default(false),
    isRequired: boolean("is_required").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_plan_addon").on(table.planId, table.addonId)],
);

// ============================================================
// catalog.addon_prices — Pricing rows for addons
// ============================================================
export const addonPrices = pgTable(
  "addon_prices",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => addons.id),
    currency: text("currency").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    priceType: priceType("price_type").notNull().default("recurring"),
    billingInterval: billingInterval("billing_interval"),
    billingIntervalCount: integer("billing_interval_count"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("chk_addon_price_amount", sql`${table.amount} >= 0`)],
);

// ============================================================
// catalog.addon_features — Features unlocked by an addon
// ============================================================
export const addonFeatures = pgTable(
  "addon_features",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => addons.id),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    config: jsonb("config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_addon_feature").on(table.addonId, table.featureId)],
);

// ============================================================
// catalog.coupons — Discount or credit grant coupons/promotions
// ============================================================
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    code: text("code").notNull().unique(),
    name: text("name"),
    type: couponType("type").notNull(),
    percentageOff: integer("percentage_off"),
    amountOff: bigint("amount_off", { mode: "number" }),
    currency: text("currency"),
    creditAmount: bigint("credit_amount", { mode: "number" }),
    maxRedemptions: integer("max_redemptions"),
    redeemedCount: integer("redeemed_count").notNull().default(0),
    perUserLimit: integer("per_user_limit"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    appliesToPlanId: uuid("applies_to_plan_id").references(() => plans.id),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_percentage", sql`${table.percentageOff} IS NULL OR (${table.percentageOff} >= 1 AND ${table.percentageOff} <= 100)`),
    check("chk_amount_off", sql`${table.amountOff} IS NULL OR ${table.amountOff} >= 0`),
    check("chk_credit_amount", sql`${table.creditAmount} IS NULL OR ${table.creditAmount} >= 0`),
    check("chk_user_limit", sql`${table.perUserLimit} IS NULL OR ${table.perUserLimit} > 0`),
  ],
);