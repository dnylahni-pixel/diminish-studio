// =============================================================================
// Demo dataset assembly
// -----------------------------------------------------------------------------
// `DEMO_DATASET` is the single dataset every intelligence-lab capability runs
// against in Demo Mode. `DEMO_SOURCE_META` carries the "داده آزمایشی" badge
// metadata the UI is required to show. `CORRUPTED_DATA_QUALITY_DATASET` is a
// second, separate variant used only by the data-quality scorecard to
// demonstrate duplicate-idempotency detection (a state that the primary
// dataset intentionally avoids so it stays internally valid).
// =============================================================================

import type { DatasetSourceMeta, IntelligenceDataset } from "@/shared/dataset-types";
import {
  ADDON_FEATURES, ADDON_PRICES, ADDONS, COUPONS, FEATURE_DEPENDENCIES, FEATURE_PRICING_RULES,
  FEATURES, PLAN_ADDONS, PLAN_CHANGE_RULES, PLAN_CREDIT_POLICIES, PLAN_FEATURES, PLAN_LIMITS,
  PLAN_PRICES, PLAN_VERSIONS, PLANS, TAX_RATES,
} from "./catalog.fixtures";
import {
  SUBSCRIPTION_ADDONS, SUBSCRIPTION_DISCOUNTS, SUBSCRIPTION_EVENTS, SUBSCRIPTION_PERIODS,
  SUBSCRIPTION_SCHEDULES, SUBSCRIPTIONS, TRIALS, USERS,
} from "./subscription.fixtures";
import {
  COUPON_REDEMPTIONS, INVOICE_ITEMS, INVOICES, PAYMENT_METHODS, TRANSACTIONS,
} from "./billing.fixtures";
import {
  CREDIT_ACCOUNTS, CREDIT_EXPIRATIONS, CREDIT_GRANTS, CREDIT_LEDGER, CREDIT_PACKAGE_PRICES,
  CREDIT_PACKAGES, CREDIT_RESERVATIONS, USAGE_DAILY_AGGREGATES, USAGE_EVENTS,
} from "./credit-and-usage.fixtures";

export { DEMO_NOW } from "./ids";

export const DEMO_DATASET: IntelligenceDataset = {
  users: USERS,
  features: FEATURES,
  featureDependencies: FEATURE_DEPENDENCIES,
  plans: PLANS,
  planVersions: PLAN_VERSIONS,
  planPrices: PLAN_PRICES,
  planFeatures: PLAN_FEATURES,
  planLimits: PLAN_LIMITS,
  featurePricingRules: FEATURE_PRICING_RULES,
  planCreditPolicies: PLAN_CREDIT_POLICIES,
  planChangeRules: PLAN_CHANGE_RULES,
  addons: ADDONS,
  planAddons: PLAN_ADDONS,
  addonPrices: ADDON_PRICES,
  addonFeatures: ADDON_FEATURES,
  coupons: COUPONS,
  subscriptions: SUBSCRIPTIONS,
  subscriptionEvents: SUBSCRIPTION_EVENTS,
  subscriptionPeriods: SUBSCRIPTION_PERIODS,
  subscriptionSchedules: SUBSCRIPTION_SCHEDULES,
  trials: TRIALS,
  subscriptionAddons: SUBSCRIPTION_ADDONS,
  subscriptionDiscounts: SUBSCRIPTION_DISCOUNTS,
  transactions: TRANSACTIONS,
  paymentMethods: PAYMENT_METHODS,
  invoices: INVOICES,
  invoiceItems: INVOICE_ITEMS,
  taxRates: TAX_RATES,
  couponRedemptions: COUPON_REDEMPTIONS,
  usageDailyAggregates: USAGE_DAILY_AGGREGATES,
  creditAccounts: CREDIT_ACCOUNTS,
  creditLedger: CREDIT_LEDGER,
  creditGrants: CREDIT_GRANTS,
  creditReservations: CREDIT_RESERVATIONS,
  creditPackages: CREDIT_PACKAGES,
  creditPackagePrices: CREDIT_PACKAGE_PRICES,
  creditExpirations: CREDIT_EXPIRATIONS,
  usageEvents: USAGE_EVENTS,
};

export const DEMO_SOURCE_META: DatasetSourceMeta = {
  mode: "demo",
  label: "داده آزمایشی (Demo Fixtures) — ثابت و بدون اتصال به دیتابیس",
  generatedAt: new Date("2026-01-15T00:00:00.000Z").toISOString(),
};

/**
 * A second dataset, derived from the primary one, with one extra ledger row
 * that reuses an existing idempotency key. Used exclusively by the
 * data-quality scorecard's "duplicate idempotency key" scenario so the
 * primary DEMO_DATASET can stay free of duplicate-key violations (matching
 * what the real `uq_credit_ledger__idempotency_key` constraint would allow).
 */
export function buildCorruptedDataQualityDataset(): IntelligenceDataset {
  const duplicateLedgerEntry = {
    ...DEMO_DATASET.creditLedger[0],
    id: "cl000000-0000-4000-8000-000000000999",
    createdAt: new Date("2025-12-01T00:10:00Z"),
  };
  return {
    ...DEMO_DATASET,
    creditLedger: [...DEMO_DATASET.creditLedger, duplicateLedgerEntry],
  };
}
