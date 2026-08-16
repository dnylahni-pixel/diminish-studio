// =============================================================================
// Diminish Super Admin — physical database schema
// -----------------------------------------------------------------------------
// IMPORTANT ENVIRONMENT NOTE (see docs/assumptions-and-limitations.md #1):
// The repository handed to this workspace did NOT contain the 38-table
// Diminish domain model described in the task brief (no AGENTS.md, no
// src/db/schema/**, no neon-http driver). Only a blank Next.js + Drizzle +
// `pg` starter existed. This file implements the 38 tables from the brief's
// canonical list, using the driver that already exists in this repo
// (`drizzle-orm/node-postgres` over a local Postgres instance). All 38 tables
// physically live in the `public` schema, matching the brief's stated
// constraint even though they are grouped conceptually below into
// app / catalog / billing / credits sections.
// =============================================================================

import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deleted"]);

export const featureStatusEnum = pgEnum("feature_status", ["active", "deprecated", "archived"]);
export const featureDependencyTypeEnum = pgEnum("feature_dependency_type", ["requires", "recommends"]);

export const planStatusEnum = pgEnum("plan_status", ["draft", "active", "deprecated", "archived"]);
export const planVersionStatusEnum = pgEnum("plan_version_status", ["draft", "published", "retired"]);
export const billingIntervalUnitEnum = pgEnum("billing_interval_unit", ["day", "week", "month", "year"]);
export const billingSchemeEnum = pgEnum("billing_scheme", ["flat", "per_seat"]);

export const limitTypeEnum = pgEnum("limit_type", ["quota", "rate", "seat"]);
export const limitPeriodUnitEnum = pgEnum("limit_period_unit", ["day", "month", "billing_cycle"]);

export const pricingModelEnum = pgEnum("pricing_model", ["flat", "tiered", "volume"]);

export const planChangeTypeEnum = pgEnum("plan_change_type", ["upgrade", "downgrade", "lateral"]);
export const prorationBehaviorEnum = pgEnum("proration_behavior", ["immediate", "end_of_period", "none"]);

export const addonStatusEnum = pgEnum("addon_status", ["active", "archived"]);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", ["percentage", "fixed_amount"]);
export const couponDurationEnum = pgEnum("coupon_duration", ["once", "repeating", "forever"]);
export const couponStatusEnum = pgEnum("coupon_status", ["active", "expired", "archived"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
  "expired",
]);

export const subscriptionEventTypeEnum = pgEnum("subscription_event_type", [
  "created",
  "activated",
  "plan_changed",
  "paused",
  "resumed",
  "canceled",
  "expired",
  "renewed",
  "payment_failed",
  "trial_started",
  "trial_converted",
  "trial_expired",
  "discount_applied",
  "discount_removed",
  "addon_added",
  "addon_removed",
  "schedule_executed",
]);

export const periodStatusEnum = pgEnum("period_status", ["upcoming", "current", "closed", "voided"]);

export const scheduleTypeEnum = pgEnum("schedule_type", ["plan_change", "cancellation", "pause", "resume"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["pending", "executed", "canceled", "failed"]);

export const trialStatusEnum = pgEnum("trial_status", ["active", "converted", "expired", "canceled"]);

export const subscriptionAddonStatusEnum = pgEnum("subscription_addon_status", ["active", "removed"]);
export const subscriptionDiscountStatusEnum = pgEnum("subscription_discount_status", [
  "active",
  "expired",
  "removed",
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["charge", "refund", "adjustment"]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "succeeded",
  "failed",
  "pending",
  "reversed",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", ["card", "bank_transfer", "wallet"]);
export const paymentMethodStatusEnum = pgEnum("payment_method_status", ["active", "expired", "removed"]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "open", "paid", "void", "uncollectible"]);
export const invoiceItemTypeEnum = pgEnum("invoice_item_type", [
  "plan",
  "addon",
  "usage",
  "credit_package",
  "tax",
  "discount",
  "proration",
]);

export const taxStatusEnum = pgEnum("tax_status", ["active", "archived"]);

export const creditAccountStatusEnum = pgEnum("credit_account_status", ["active", "frozen", "closed"]);
export const creditLedgerEntryTypeEnum = pgEnum("credit_ledger_entry_type", [
  "grant",
  "reserve",
  "capture",
  "release",
  "expire",
  "adjustment",
  "refund",
]);
export const creditGrantSourceEnum = pgEnum("credit_grant_source", [
  "plan_policy",
  "package_purchase",
  "promo",
  "manual",
  "refund",
]);
export const creditGrantStatusEnum = pgEnum("credit_grant_status", [
  "active",
  "exhausted",
  "expired",
  "revoked",
]);
export const creditReservationStatusEnum = pgEnum("credit_reservation_status", [
  "held",
  "captured",
  "released",
  "expired",
]);
export const creditPackageStatusEnum = pgEnum("credit_package_status", ["active", "archived"]);

export const usageEventStatusEnum = pgEnum("usage_event_status", ["recorded", "reversed"]);

// -----------------------------------------------------------------------------
// App
// -----------------------------------------------------------------------------

/** 1. users — legacy timestamp column intentionally kept as timezone-naive. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  status: userStatusEnum("status").notNull().default("active"),
  acquisitionSource: text("acquisition_source"),
  // Legacy column: no timezone, inherited from the original users table.
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_users__email").on(table.email),
]);

// -----------------------------------------------------------------------------
// Catalog
// -----------------------------------------------------------------------------

/** 2. features */
export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  isMetered: boolean("is_metered").notNull().default(false),
  unit: text("unit"),
  status: featureStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_features__key").on(table.key),
]);

/** 3. feature_dependencies */
export const featureDependencies = pgTable("feature_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  dependsOnFeatureId: uuid("depends_on_feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  dependencyType: featureDependencyTypeEnum("dependency_type").notNull().default("requires"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_feature_dependencies__pair").on(table.featureId, table.dependsOnFeatureId),
  check("chk_feature_dependencies__no_self_reference", sql`${table.featureId} <> ${table.dependsOnFeatureId}`),
  index("idx_feature_dependencies__depends_on").on(table.dependsOnFeatureId),
]);

/** 4. plans */
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: planStatusEnum("status").notNull().default("draft"),
  tier: integer("tier").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plans__key").on(table.key),
]);

/** 5. plan_versions — the true pricing/entitlement unit; plans are just a grouping. */
export const planVersions = pgTable("plan_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  status: planVersionStatusEnum("status").notNull().default("draft"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  billingIntervalUnit: billingIntervalUnitEnum("billing_interval_unit").notNull().default("month"),
  billingIntervalCount: integer("billing_interval_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_versions__plan_version").on(table.planId, table.version),
  index("idx_plan_versions__plan_status").on(table.planId, table.status),
  check("chk_plan_versions__effective_range", sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`),
]);

/** 6. plan_prices */
export const planPrices = pgTable("plan_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  unitAmount: bigint("unit_amount", { mode: "bigint" }).notNull(),
  billingScheme: billingSchemeEnum("billing_scheme").notNull().default("flat"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_prices__version_currency").on(table.planVersionId, table.currency),
  check("chk_plan_prices__non_negative", sql`${table.unitAmount} >= 0`),
]);

/** 7. plan_features */
export const planFeatures = pgTable("plan_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_features__version_feature").on(table.planVersionId, table.featureId),
]);

/** 8. plan_limits */
export const planLimits = pgTable("plan_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  limitType: limitTypeEnum("limit_type").notNull().default("quota"),
  // NULL limitValue means unlimited.
  limitValue: bigint("limit_value", { mode: "bigint" }),
  periodUnit: limitPeriodUnitEnum("period_unit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_limits__version_feature_type").on(table.planVersionId, table.featureId, table.limitType),
]);

/** 9. feature_pricing_rules — drives flat/tiered/volume metered pricing. */
export const featurePricingRules = pgTable("feature_pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  planVersionId: uuid("plan_version_id").references(() => planVersions.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  pricingModel: pricingModelEnum("pricing_model").notNull().default("flat"),
  /**
   * tiers JSONB shape (validated at the application boundary, see
   * src/features/catalog-intelligence/pricing-rule-schema.ts):
   * Array<{ upTo: string | null; unitAmount: string; flatAmount: string }>
   * Amounts are minor-unit integers encoded as strings to survive JSON
   * round-tripping of values that can exceed Number.MAX_SAFE_INTEGER.
   */
  tiers: jsonb("tiers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_feature_pricing_rules__feature_version").on(table.featureId, table.planVersionId),
]);

/** 10. plan_credit_policies */
export const planCreditPolicies = pgTable("plan_credit_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  grantAmount: bigint("grant_amount", { mode: "bigint" }).notNull().default(sql`0`),
  rolloverEnabled: boolean("rollover_enabled").notNull().default(false),
  rolloverMaxAmount: bigint("rollover_max_amount", { mode: "bigint" }),
  expirationDays: integer("expiration_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_credit_policies__version_currency").on(table.planVersionId, table.currency),
]);

/** 11. plan_change_rules — governs the upgrade/downgrade graph. */
export const planChangeRules = pgTable("plan_change_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromPlanId: uuid("from_plan_id").references(() => plans.id, { onDelete: "cascade" }),
  toPlanId: uuid("to_plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  changeType: planChangeTypeEnum("change_type").notNull(),
  prorationBehavior: prorationBehaviorEnum("proration_behavior").notNull().default("immediate"),
  isAllowed: boolean("is_allowed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_change_rules__from_to").on(table.fromPlanId, table.toPlanId),
]);

/** 12. addons */
export const addons = pgTable("addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  status: addonStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_addons__key").on(table.key),
]);

/** 13. plan_addons */
export const planAddons = pgTable("plan_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  addonId: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_plan_addons__plan_addon").on(table.planId, table.addonId),
]);

/** 14. addon_prices */
export const addonPrices = pgTable("addon_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  addonId: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  unitAmount: bigint("unit_amount", { mode: "bigint" }).notNull(),
  billingIntervalUnit: billingIntervalUnitEnum("billing_interval_unit").notNull().default("month"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_addon_prices__addon_currency_interval").on(table.addonId, table.currency, table.billingIntervalUnit),
]);

/** 15. addon_features */
export const addonFeatures = pgTable("addon_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  addonId: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_addon_features__addon_feature").on(table.addonId, table.featureId),
]);

/** 16. coupons */
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  discountType: couponDiscountTypeEnum("discount_type").notNull(),
  percentOff: numeric("percent_off", { precision: 5, scale: 2 }),
  amountOff: bigint("amount_off", { mode: "bigint" }),
  currency: text("currency"),
  duration: couponDurationEnum("duration").notNull().default("once"),
  durationInMonths: integer("duration_in_months"),
  maxRedemptions: integer("max_redemptions"),
  redeemBy: timestamp("redeem_by", { withTimezone: true }),
  status: couponStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_coupons__code").on(table.code),
  check(
    "chk_coupons__discount_shape",
    sql`(${table.discountType} = 'percentage' and ${table.percentOff} is not null) or (${table.discountType} = 'fixed_amount' and ${table.amountOff} is not null and ${table.currency} is not null)`,
  ),
]);

// -----------------------------------------------------------------------------
// Billing & Subscription Lifecycle
// -----------------------------------------------------------------------------

/** 17. subscriptions */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  currency: text("currency").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull().defaultNow(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscriptions__user").on(table.userId),
  index("idx_subscriptions__plan_version_status").on(table.planVersionId, table.status),
  check("chk_subscriptions__period_range", sql`${table.currentPeriodEnd} > ${table.currentPeriodStart}`),
]);

/** 18. subscription_events — append-only lifecycle audit trail. */
export const subscriptionEvents = pgTable("subscription_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  eventType: subscriptionEventTypeEnum("event_type").notNull(),
  fromStatus: subscriptionStatusEnum("from_status"),
  toStatus: subscriptionStatusEnum("to_status"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscription_events__subscription_time").on(table.subscriptionId, table.occurredAt),
]);

/** 19. subscription_periods — closed billing-cycle snapshots. */
export const subscriptionPeriods = pgTable("subscription_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  planVersionId: uuid("plan_version_id").notNull().references(() => planVersions.id),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  status: periodStatusEnum("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscription_periods__subscription_start").on(table.subscriptionId, table.periodStart),
  check("chk_subscription_periods__range", sql`${table.periodEnd} > ${table.periodStart}`),
]);

/** 20. subscription_schedules — future-dated lifecycle intents. */
export const subscriptionSchedules = pgTable("subscription_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  scheduleType: scheduleTypeEnum("schedule_type").notNull(),
  targetPlanVersionId: uuid("target_plan_version_id").references(() => planVersions.id),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  status: scheduleStatusEnum("status").notNull().default("pending"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscription_schedules__due").on(table.status, table.effectiveAt),
]);

/** 21. trials */
export const trials = pgTable("trials", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  status: trialStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_trials__subscription").on(table.subscriptionId),
]);

/** 22. subscription_addons */
export const subscriptionAddons = pgTable("subscription_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  addonId: uuid("addon_id").notNull().references(() => addons.id),
  quantity: integer("quantity").notNull().default(1),
  status: subscriptionAddonStatusEnum("status").notNull().default("active"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull().defaultNow(),
  endAt: timestamp("end_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscription_addons__subscription").on(table.subscriptionId),
]);

/** 23. subscription_discounts */
export const subscriptionDiscounts = pgTable("subscription_discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: subscriptionDiscountStatusEnum("status").notNull().default("active"),
}, (table) => [
  index("idx_subscription_discounts__subscription").on(table.subscriptionId),
]);

/** 24. transactions — monetary movements; amount is always non-negative, sign is via `type`. */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  invoiceId: uuid("invoice_id"),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  currency: text("currency").notNull(),
  paymentMethodId: uuid("payment_method_id"),
  externalReference: text("external_reference"),
  idempotencyKey: text("idempotency_key"),
  failureReason: text("failure_reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_transactions__idempotency_key").on(table.idempotencyKey),
  index("idx_transactions__subscription_time").on(table.subscriptionId, table.occurredAt),
  index("idx_transactions__invoice").on(table.invoiceId),
  check("chk_transactions__amount_non_negative", sql`${table.amount} >= 0`),
]);

/** 25. payment_methods */
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: paymentMethodTypeEnum("type").notNull(),
  brand: text("brand"),
  last4: text("last4"),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  isDefault: boolean("is_default").notNull().default(false),
  status: paymentMethodStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_payment_methods__user").on(table.userId),
]);

/** 26. invoices — header; snapshots the customer/tax view at issue time. */
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  currency: text("currency").notNull(),
  subtotal: bigint("subtotal", { mode: "bigint" }).notNull().default(sql`0`),
  taxTotal: bigint("tax_total", { mode: "bigint" }).notNull().default(sql`0`),
  discountTotal: bigint("discount_total", { mode: "bigint" }).notNull().default(sql`0`),
  total: bigint("total", { mode: "bigint" }).notNull().default(sql`0`),
  amountPaid: bigint("amount_paid", { mode: "bigint" }).notNull().default(sql`0`),
  amountDue: bigint("amount_due", { mode: "bigint" }).notNull().default(sql`0`),
  customerSnapshot: jsonb("customer_snapshot"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_invoices__invoice_number").on(table.invoiceNumber),
  index("idx_invoices__subscription").on(table.subscriptionId),
  index("idx_invoices__status_due").on(table.status, table.dueAt),
]);

/** 27. invoice_items — detail lines; sum must reconcile to invoice header totals. */
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  subscriptionPeriodId: uuid("subscription_period_id").references(() => subscriptionPeriods.id),
  description: text("description").notNull(),
  itemType: invoiceItemTypeEnum("item_type").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("1"),
  unitAmount: bigint("unit_amount", { mode: "bigint" }).notNull(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  currency: text("currency").notNull(),
  taxRateId: uuid("tax_rate_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_invoice_items__invoice").on(table.invoiceId),
]);

/** 28. tax_rates */
export const taxRates = pgTable("tax_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  percentage: numeric("percentage", { precision: 6, scale: 3 }).notNull(),
  country: text("country"),
  isInclusive: boolean("is_inclusive").notNull().default(false),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  status: taxStatusEnum("status").notNull().default("active"),
}, (table) => [
  uniqueIndex("uq_tax_rates__code").on(table.code),
]);

/** 29. coupon_redemptions */
export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  amountDiscounted: bigint("amount_discounted", { mode: "bigint" }),
  currency: text("currency"),
}, (table) => [
  index("idx_coupon_redemptions__coupon").on(table.couponId),
  index("idx_coupon_redemptions__user").on(table.userId),
]);

/** 30. usage_daily_aggregates — pre-aggregated read path for trend queries. */
export const usageDailyAggregates = pgTable("usage_daily_aggregates", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id),
  usageDate: date("usage_date").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("0"),
  unit: text("unit"),
  eventCount: integer("event_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_usage_daily_aggregates__sub_feature_date").on(table.subscriptionId, table.featureId, table.usageDate),
  index("idx_usage_daily_aggregates__feature_date").on(table.featureId, table.usageDate),
]);

// -----------------------------------------------------------------------------
// Credits & Metered Usage
// -----------------------------------------------------------------------------

/** 31. credit_accounts — one wallet per (user, currency). Cached balance only. */
export const creditAccounts = pgTable("credit_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  balance: bigint("balance", { mode: "bigint" }).notNull().default(sql`0`),
  reservedBalance: bigint("reserved_balance", { mode: "bigint" }).notNull().default(sql`0`),
  lifetimeGranted: bigint("lifetime_granted", { mode: "bigint" }).notNull().default(sql`0`),
  lifetimeUsed: bigint("lifetime_used", { mode: "bigint" }).notNull().default(sql`0`),
  status: creditAccountStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_credit_accounts__user_currency").on(table.userId, table.currency),
  check("chk_credit_accounts__reserved_within_balance", sql`${table.reservedBalance} >= 0`),
]);

/** 32. credit_ledger — append-only source of truth for balance movements. */
export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditAccountId: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  entryType: creditLedgerEntryTypeEnum("entry_type").notNull(),
  // Signed: grant/release/refund > 0, reserve/capture/expire < 0 (see formulas-and-kpis.md).
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  balanceAfter: bigint("balance_after", { mode: "bigint" }).notNull(),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_credit_ledger__idempotency_key").on(table.idempotencyKey),
  index("idx_credit_ledger__account_time").on(table.creditAccountId, table.createdAt),
  index("idx_credit_ledger__reference").on(table.referenceType, table.referenceId),
]);

/** 33. credit_grants — FIFO-consumable buckets with independent expiry. */
export const creditGrants = pgTable("credit_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditAccountId: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  source: creditGrantSourceEnum("source").notNull(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  remainingAmount: bigint("remaining_amount", { mode: "bigint" }).notNull(),
  currency: text("currency").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: creditGrantStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_credit_grants__account_fifo").on(table.creditAccountId, table.grantedAt),
  index("idx_credit_grants__expiry").on(table.status, table.expiresAt),
  check("chk_credit_grants__remaining_within_amount", sql`${table.remainingAmount} >= 0 and ${table.remainingAmount} <= ${table.amount}`),
]);

/** 34. credit_reservations — holds against usage before capture. */
export const creditReservations = pgTable("credit_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditAccountId: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  usageEventId: uuid("usage_event_id"),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  status: creditReservationStatusEnum("status").notNull().default("held"),
  idempotencyKey: text("idempotency_key"),
  heldAt: timestamp("held_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_credit_reservations__idempotency_key").on(table.idempotencyKey),
  index("idx_credit_reservations__account_status").on(table.creditAccountId, table.status),
]);

/** 35. credit_packages — purchasable top-up SKUs. */
export const creditPackages = pgTable("credit_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  creditAmount: bigint("credit_amount", { mode: "bigint" }).notNull(),
  status: creditPackageStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_credit_packages__key").on(table.key),
]);

/** 36. credit_package_prices */
export const creditPackagePrices = pgTable("credit_package_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditPackageId: uuid("credit_package_id").notNull().references(() => creditPackages.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  unitAmount: bigint("unit_amount", { mode: "bigint" }).notNull(),
}, (table) => [
  uniqueIndex("uq_credit_package_prices__package_currency").on(table.creditPackageId, table.currency),
]);

/** 37. credit_expirations — audit trail of grant expiry events. */
export const creditExpirations = pgTable("credit_expirations", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditGrantId: uuid("credit_grant_id").notNull().references(() => creditGrants.id, { onDelete: "cascade" }),
  expiredAmount: bigint("expired_amount", { mode: "bigint" }).notNull(),
  expiredAt: timestamp("expired_at", { withTimezone: true }).notNull().defaultNow(),
  creditLedgerEntryId: uuid("credit_ledger_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_credit_expirations__grant").on(table.creditGrantId),
]);

/** 38. usage_events — raw metering facts (forensic detail, not for trend scans). */
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id),
  userId: uuid("user_id").references(() => users.id),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
  unit: text("unit"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  status: usageEventStatusEnum("status").notNull().default("recorded"),
  idempotencyKey: text("idempotency_key"),
  creditReservationId: uuid("credit_reservation_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_usage_events__idempotency_key").on(table.idempotencyKey),
  index("idx_usage_events__subscription_feature_time").on(table.subscriptionId, table.featureId, table.occurredAt),
  index("idx_usage_events__late_arrival").on(table.recordedAt, table.occurredAt),
]);

// -----------------------------------------------------------------------------
// Relations (selected — cover the joins the intelligence engines rely on)
// -----------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  paymentMethods: many(paymentMethods),
  invoices: many(invoices),
  transactions: many(transactions),
  creditAccounts: many(creditAccounts),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  versions: many(planVersions),
}));

export const planVersionsRelations = relations(planVersions, ({ one, many }) => ({
  plan: one(plans, { fields: [planVersions.planId], references: [plans.id] }),
  prices: many(planPrices),
  features: many(planFeatures),
  limits: many(planLimits),
  creditPolicies: many(planCreditPolicies),
  subscriptions: many(subscriptions),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  dependsOn: many(featureDependencies, { relationName: "feature_depends_on" }),
  requiredBy: many(featureDependencies, { relationName: "feature_required_by" }),
}));

export const featureDependenciesRelations = relations(featureDependencies, ({ one }) => ({
  feature: one(features, {
    fields: [featureDependencies.featureId],
    references: [features.id],
    relationName: "feature_depends_on",
  }),
  dependsOnFeature: one(features, {
    fields: [featureDependencies.dependsOnFeatureId],
    references: [features.id],
    relationName: "feature_required_by",
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  planVersion: one(planVersions, { fields: [subscriptions.planVersionId], references: [planVersions.id] }),
  events: many(subscriptionEvents),
  periods: many(subscriptionPeriods),
  schedules: many(subscriptionSchedules),
  trial: many(trials),
  addons: many(subscriptionAddons),
  discounts: many(subscriptionDiscounts),
  invoices: many(invoices),
  transactions: many(transactions),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}));

export const creditAccountsRelations = relations(creditAccounts, ({ one, many }) => ({
  user: one(users, { fields: [creditAccounts.userId], references: [users.id] }),
  ledgerEntries: many(creditLedger),
  grants: many(creditGrants),
  reservations: many(creditReservations),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  account: one(creditAccounts, { fields: [creditLedger.creditAccountId], references: [creditAccounts.id] }),
}));

export const creditGrantsRelations = relations(creditGrants, ({ one, many }) => ({
  account: one(creditAccounts, { fields: [creditGrants.creditAccountId], references: [creditAccounts.id] }),
  expirations: many(creditExpirations),
}));

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  subscription: one(subscriptions, { fields: [usageEvents.subscriptionId], references: [subscriptions.id] }),
  feature: one(features, { fields: [usageEvents.featureId], references: [features.id] }),
}));

export const usageDailyAggregatesRelations = relations(usageDailyAggregates, ({ one }) => ({
  subscription: one(subscriptions, { fields: [usageDailyAggregates.subscriptionId], references: [subscriptions.id] }),
  feature: one(features, { fields: [usageDailyAggregates.featureId], references: [features.id] }),
}));
