import { pgTable, uuid, text, timestamp, integer, bigint, boolean, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { limitPeriod, limitBehavior, featurePriceMetric, featurePriceModel, creditPolicyReset, prorationMode } from "../enums";
import { planVersions } from "./plans";
import { features } from "./features";
import { plans } from "./plans";

// ============================================================
// catalog.plan_features — Features attached to a plan version
// ============================================================
export const planFeatures = pgTable(
  "plan_features",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    isIncluded: boolean("is_included").notNull().default(true),
    config: jsonb("config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_plan_feature").on(table.planVersionId, table.featureId)],
);

// ============================================================
// catalog.plan_limits — Included limits/quotas per feature
// ============================================================
export const planLimits = pgTable(
  "plan_limits",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    limitValue: bigint("limit_value", { mode: "number" }),
    period: limitPeriod("period").notNull().default("none"),
    behavior: limitBehavior("behavior").notNull().default("block"),
    overageUnitPrice: bigint("overage_unit_price", { mode: "number" }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_plan_limit").on(table.planVersionId, table.featureId, table.period),
    check("chk_limit_value", sql`${table.limitValue} IS NULL OR ${table.limitValue} >= 0`),
    check("chk_overage_price", sql`${table.overageUnitPrice} IS NULL OR ${table.overageUnitPrice} >= 0`),
  ],
);

// ============================================================
// catalog.feature_pricing_rules — Metered/usage pricing per feature
// ============================================================
export const featurePricingRules = pgTable(
  "feature_pricing_rules",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    metric: featurePriceMetric("metric").notNull(),
    pricingModel: featurePriceModel("pricing_model").notNull().default("flat"),
    currency: text("currency"),
    unitPrice: bigint("unit_price", { mode: "number" }),
    tiers: jsonb("tiers").default([]),
    creditCostPerUnit: bigint("credit_cost_per_unit", { mode: "number" }),
    minimumCharge: bigint("minimum_charge", { mode: "number" }),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_unit_price", sql`${table.unitPrice} IS NULL OR ${table.unitPrice} >= 0`),
    check("chk_credit_cost", sql`${table.creditCostPerUnit} IS NULL OR ${table.creditCostPerUnit} >= 0`),
    check("chk_min_charge", sql`${table.minimumCharge} IS NULL OR ${table.minimumCharge} >= 0`),
  ],
);

// ============================================================
// catalog.plan_credit_policies — Credit behavior per plan version
// ============================================================
export const planCreditPolicies = pgTable(
  "plan_credit_policies",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id)
      .unique(),
    monthlyCreditGrant: bigint("monthly_credit_grant", { mode: "number" }).notNull().default(0),
    rolloverEnabled: boolean("rollover_enabled").notNull().default(false),
    rolloverCap: bigint("rollover_cap", { mode: "number" }),
    resetPolicy: creditPolicyReset("reset_policy").notNull().default("monthly"),
    grantExpiryDays: integer("grant_expiry_days"),
    negativeBalanceAllowed: boolean("negative_balance_allowed").notNull().default(false),
    maxNegativeBalance: bigint("max_negative_balance", { mode: "number" }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_credit_grant", sql`${table.monthlyCreditGrant} >= 0`),
    check("chk_rollover_cap", sql`${table.rolloverCap} IS NULL OR ${table.rolloverCap} >= 0`),
  ],
);

// ============================================================
// catalog.plan_change_rules — Upgrade/downgrade rules between plans
// ============================================================
export const planChangeRules = pgTable(
  "plan_change_rules",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    fromPlanId: uuid("from_plan_id")
      .notNull()
      .references(() => plans.id),
    toPlanId: uuid("to_plan_id")
      .notNull()
      .references(() => plans.id),
    prorationMode: prorationMode("proration_mode").notNull().default("immediate"),
    allowChange: boolean("allow_change").notNull().default(true),
    carryUnusedCredits: boolean("carry_unused_credits").notNull().default(false),
    changeFeeAmount: bigint("change_fee_amount", { mode: "number" }),
    currency: text("currency"),
    ruleConfig: jsonb("rule_config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_plan_change").on(table.fromPlanId, table.toPlanId),
    check("chk_no_self_change", sql`${table.fromPlanId} <> ${table.toPlanId}`),
  ],
);