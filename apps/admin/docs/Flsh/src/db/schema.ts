import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. APP DOMAIN
// ==========================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. CATALOG & PRODUCT CONFIGURATION DOMAIN
// ==========================================

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'boolean', 'metered', 'licensed'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const featureDependencies = pgTable("feature_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  dependency_feature_id: uuid("dependency_feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("requires"), // 'requires', 'excludes'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'archived'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planVersions = pgTable("plan_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_id: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'published', 'retired'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planPrices = pgTable("plan_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  billing_scheme: text("billing_scheme").notNull().default("flat"), // 'flat', 'tiered', 'volume'
  currency: text("currency").notNull().default("USD"),
  amount: integer("amount").notNull(), // minor units (cents)
  billing_period: text("billing_period").notNull().default("monthly"), // 'monthly', 'yearly'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planFeatures = pgTable("plan_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planLimits = pgTable("plan_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  limit_value: integer("limit_value").notNull(),
  overage_allowed: boolean("overage_allowed").notNull().default(false),
  overage_unit_price: integer("overage_unit_price"), // minor units
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const featurePricingRules = pgTable("feature_pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  pricing_model: text("pricing_model").notNull().default("standard"), // 'standard', 'tiered', 'volume'
  tiers: jsonb("tiers"), // e.g., [{ up_to: 100, unit_amount: 10 }, { up_to: null, unit_amount: 8 }]
  currency: text("currency").notNull().default("USD"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planCreditPolicies = pgTable("plan_credit_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  initial_grant_amount: integer("initial_grant_amount").notNull().default(0),
  recurring_grant_amount: integer("recurring_grant_amount").notNull().default(0),
  grant_interval: text("grant_interval").notNull().default("monthly"), // 'one_time', 'monthly', 'yearly'
  rollover_policy: text("rollover_policy").notNull().default("expire"), // 'expire', 'rollover'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planChangeRules = pgTable("plan_change_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  from_plan_id: uuid("from_plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  to_plan_id: uuid("to_plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  allowed: boolean("allowed").notNull().default(true),
  proration_behavior: text("proration_behavior").notNull().default("prorate"), // 'prorate', 'full_price', 'none'
  transition_type: text("transition_type").notNull().default("immediate"), // 'immediate', 'period_end'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const addons = pgTable("addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // 'active', 'archived'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planAddons = pgTable("plan_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  addon_id: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  is_mandatory: boolean("is_mandatory").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const addonPrices = pgTable("addon_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  addon_id: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  billing_scheme: text("billing_scheme").notNull().default("flat"),
  currency: text("currency").notNull().default("USD"),
  amount: integer("amount").notNull(), // minor units
  billing_period: text("billing_period").notNull().default("monthly"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const addonFeatures = pgTable("addon_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  addon_id: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  discount_type: text("discount_type").notNull(), // 'percentage', 'fixed'
  discount_amount: integer("discount_amount").notNull(), // percent * 100 or amount in minor units
  currency: text("currency").notNull().default("USD"),
  duration: text("duration").notNull().default("once"), // 'once', 'forever', 'repeating'
  duration_in_months: integer("duration_in_months"),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. BILLING & SUBSCRIPTION LIFECYCLE DOMAIN
// ==========================================

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan_id: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  plan_version_id: uuid("plan_version_id").notNull().references(() => planVersions.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // 'trial', 'active', 'paused', 'canceled', 'past_due'
  current_period_start: timestamp("current_period_start", { withTimezone: true }).notNull(),
  current_period_end: timestamp("current_period_end", { withTimezone: true }).notNull(),
  trial_start: timestamp("trial_start", { withTimezone: true }),
  trial_end: timestamp("trial_end", { withTimezone: true }),
  cancel_at_period_end: boolean("cancel_at_period_end").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionEvents = pgTable("subscription_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  event_type: text("event_type").notNull(), // 'created', 'activated', 'paused', 'resumed', 'canceled', 'plan_changed', 'period_renewed'
  previous_status: text("previous_status"),
  new_status: text("new_status"),
  payload: jsonb("payload"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionPeriods = pgTable("subscription_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  start_date: timestamp("start_date", { withTimezone: true }).notNull(),
  end_date: timestamp("end_date", { withTimezone: true }).notNull(),
  invoice_id: uuid("invoice_id"), // manual reference, can be null before billing
  status: text("status").notNull().default("draft"), // 'draft', 'closed'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionSchedules = pgTable("subscription_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  target_plan_id: uuid("target_plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  scheduled_date: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'executed', 'canceled', 'stuck'
  execution_details: jsonb("execution_details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trials = pgTable("trials", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  start_date: timestamp("start_date", { withTimezone: true }).notNull(),
  end_date: timestamp("end_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"), // 'active', 'converted', 'expired'
  converted_at: timestamp("converted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionAddons = pgTable("subscription_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  addon_id: uuid("addon_id").notNull().references(() => addons.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("active"), // 'active', 'canceled'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionDiscounts = pgTable("subscription_discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  coupon_id: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  applied_at: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").notNull().default("active"), // 'active', 'expired'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invoice_id: uuid("invoice_id"), // references invoice below
  amount: integer("amount").notNull(), // minor units
  currency: text("currency").notNull().default("USD"),
  type: text("type").notNull(), // 'charge', 'refund'
  status: text("status").notNull(), // 'success', 'failed', 'pending', 'reversed'
  gateway: text("gateway"),
  gateway_reference: text("gateway_reference"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  is_default: boolean("is_default").notNull().default(false),
  card_type: text("card_type").notNull(), // 'visa', 'mastercard', etc.
  last4: text("last4").notNull(),
  expiry_month: integer("expiry_month").notNull(),
  expiry_year: integer("expiry_year").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'disabled'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  number: text("number").notNull().unique(),
  status: text("status").notNull().default("draft"), // 'draft', 'open', 'paid', 'void', 'uncollectible'
  subtotal: integer("subtotal").notNull().default(0), // minor units
  tax: integer("tax").notNull().default(0), // minor units
  discount: integer("discount").notNull().default(0), // minor units
  total: integer("total").notNull().default(0), // minor units
  currency: text("currency").notNull().default("USD"),
  due_date: timestamp("due_date", { withTimezone: true }),
  paid_at: timestamp("paid_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_id: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // minor units
  quantity: integer("quantity").notNull().default(1),
  unit_price: integer("unit_price").notNull(), // minor units
  type: text("type").notNull(), // 'plan', 'addon', 'credit_package', 'overage'
  reference_id: uuid("reference_id"), // plan_id, addon_id, etc.
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taxRates = pgTable("tax_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  rate_percent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(), // e.g., 18.00
  country: text("country").notNull(),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupon_id: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  invoice_id: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  discount_amount_applied: integer("discount_amount_applied").notNull(), // minor units
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageDailyAggregates = pgTable("usage_daily_aggregates", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  total_quantity: integer("total_quantity").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 4. CREDITS & METERED USAGE DOMAIN
// ==========================================

export const creditAccounts = pgTable("credit_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("CREDIT"), // virtual credit or actual currency
  balance: integer("balance").notNull().default(0), // standard balance (grants - usage)
  reserved_balance: integer("reserved_balance").notNull().default(0), // locked for active sessions
  lifetime_granted: integer("lifetime_granted").notNull().default(0),
  lifetime_used: integer("lifetime_used").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  credit_account_id: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'grant', 'usage', 'reservation_hold', 'reservation_capture', 'reservation_release', 'refund', 'expiration'
  amount: integer("amount").notNull(),
  direction: text("direction").notNull(), // 'debit' (reduces balance), 'credit' (increases balance)
  current_balance: integer("current_balance").notNull(), // balance after transaction
  reference_type: text("reference_type"), // 'subscription', 'invoice', 'usage_event', 'credit_grant'
  reference_id: uuid("reference_id"),
  idempotency_key: text("idempotency_key").unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditGrants = pgTable("credit_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  credit_account_id: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  remaining_amount: integer("remaining_amount").notNull(),
  expiration_date: timestamp("expiration_date", { withTimezone: true }),
  source: text("source").notNull().default("manual"), // 'plan_grant', 'manual', 'purchase'
  status: text("status").notNull().default("active"), // 'active', 'exhausted', 'expired'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditReservations = pgTable("credit_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  credit_account_id: uuid("credit_account_id").notNull().references(() => creditAccounts.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'captured', 'released'
  expiration_date: timestamp("expiration_date", { withTimezone: true }).notNull(),
  reference_type: text("reference_type"), // 'session', 'api_gateway', etc.
  reference_id: uuid("reference_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditPackages = pgTable("credit_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  credit_amount: integer("credit_amount").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'archived'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditPackagePrices = pgTable("credit_package_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  credit_package_id: uuid("credit_package_id").notNull().references(() => creditPackages.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("USD"),
  price_amount: integer("price_amount").notNull(), // minor units
  status: text("status").notNull().default("active"), // 'active', 'archived'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditExpirations = pgTable("credit_expirations", {
  id: uuid("id").primaryKey().defaultRandom(),
  credit_grant_id: uuid("credit_grant_id").notNull().references(() => creditGrants.id, { onDelete: "cascade" }),
  expired_amount: integer("expired_amount").notNull(),
  executed_at: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  feature_id: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  idempotency_key: text("idempotency_key").unique(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
