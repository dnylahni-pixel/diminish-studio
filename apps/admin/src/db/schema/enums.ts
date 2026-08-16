import { pgEnum } from "drizzle-orm/pg-core";

// ==================== App Enums ====================
export const userStatus = pgEnum("user_status", ["active", "inactive", "suspended"]);

// ==================== Catalog Enums ====================
export const featureKind = pgEnum("feature_kind", ["boolean", "metered", "quota", "package"]);
export const priceType = pgEnum("price_type", ["recurring", "one_time"]);
export const billingInterval = pgEnum("billing_interval", ["day", "week", "month", "year"]);
export const planStatus = pgEnum("plan_status", ["draft", "active", "archived"]);
export const planVersionStatus = pgEnum("plan_version_status", ["draft", "published", "retired"]);
export const limitPeriod = pgEnum("limit_period", ["none", "day", "week", "month"]);
export const limitBehavior = pgEnum("limit_behavior", ["block", "allow_overage"]);
export const featurePriceMetric = pgEnum("feature_price_metric", ["unit", "minute", "megabyte", "request", "seat"]);
export const featurePriceModel = pgEnum("feature_price_model", ["flat", "tiered", "volume"]);
export const creditPolicyReset = pgEnum("credit_policy_reset", ["none", "daily", "weekly", "monthly"]);
export const prorationMode = pgEnum("proration_mode", ["none", "immediate", "next_cycle"]);
export const addonScope = pgEnum("addon_scope", ["subscription", "account"]);
export const couponType = pgEnum("coupon_type", ["percentage", "fixed_amount", "credit_grant"]);

// ==================== Billing Enums ====================
export const subscriptionStatus = pgEnum("subscription_status", [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
  "expired",
]);
export const subscriptionEventType = pgEnum("subscription_event_type", [
  "created",
  "activated",
  "renewed",
  "plan_changed",
  "price_changed",
  "paused",
  "resumed",
  "past_due",
  "canceled",
  "expired",
  "trial_started",
  "trial_ended",
  "discount_applied",
  "addon_attached",
  "addon_removed",
]);
export const periodStatus = pgEnum("period_status", ["scheduled", "active", "closed", "failed"]);
export const scheduleAction = pgEnum("schedule_action", [
  "change_plan",
  "change_price",
  "pause",
  "resume",
  "cancel",
]);
export const trialStatus = pgEnum("trial_status", ["scheduled", "active", "converted", "expired", "canceled"]);
export const discountSourceType = pgEnum("discount_source_type", ["coupon", "manual"]);
export const transactionType = pgEnum("transaction_type", ["charge", "refund", "credit_adjustment", "debit_adjustment"]);
export const transactionStatus = pgEnum("transaction_status", ["pending", "succeeded", "failed", "voided"]);
export const paymentMethodType = pgEnum("payment_method_type", ["card", "bank_account", "wallet", "paypal", "crypto"]);
export const paymentMethodStatus = pgEnum("payment_method_status", ["active", "expired", "disabled", "deleted"]);
export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
  "refunded",
  "partially_refunded",
]);
export const invoiceItemType = pgEnum("invoice_item_type", [
  "plan",
  "addon",
  "credit_package",
  "usage",
  "overage",
  "discount",
  "tax",
  "adjustment",
]);
export const taxType = pgEnum("tax_type", ["vat", "sales_tax", "gst", "service_tax"]);
export const taxStatus = pgEnum("tax_status", ["active", "inactive", "archived"]);
export const redemptionStatus = pgEnum("redemption_status", ["applied", "consumed", "reversed", "expired"]);
export const usageAggregateUnit = pgEnum("usage_aggregate_unit", ["unit", "minute", "megabyte", "request", "seat"]);

// ==================== Credits Enums ====================
export const creditAccountStatus = pgEnum("credit_account_status", ["active", "frozen", "closed"]);
export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "grant",
  "purchase",
  "usage",
  "refund",
  "expiration",
  "reservation_hold",
  "reservation_release",
  "reservation_capture",
  "manual_adjustment",
]);

export const creditGrantSource = pgEnum("credit_grant_source", ["plan", "coupon", "manual", "promotion"]);
export const reservationStatus = pgEnum("reservation_status", ["active", "released", "captured", "expired"]);
export const creditPackageStatus = pgEnum("credit_package_status", ["draft", "active", "archived"]);
export const usageStatus = pgEnum("usage_status", ["pending", "confirmed", "reversed"]);