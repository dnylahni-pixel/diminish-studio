// =============================================================================
// Demo Mode — Catalog fixtures (features, plans, versions, pricing, addons)
// -----------------------------------------------------------------------------
// Intentional data-quality issues are embedded on purpose (documented inline)
// so the catalog-intelligence and data-quality engines have real signal to
// detect in Demo Mode instead of always returning "no problems found".
// =============================================================================

import type {
  AddonFeatureRow,
  AddonPriceRow,
  AddonRow,
  CouponRow,
  FeatureDependencyRow,
  FeaturePricingRuleRow,
  FeatureRow,
  PlanAddonRow,
  PlanChangeRuleRow,
  PlanCreditPolicyRow,
  PlanFeatureRow,
  PlanLimitRow,
  PlanPriceRow,
  PlanRow,
  PlanVersionRow,
  TaxRateRow,
} from "@/shared/dataset-types";
import { IDS } from "./ids";

export const FEATURES: FeatureRow[] = [
  { id: IDS.features.seats, key: "seats", name: "کاربران فعال", category: "core", isMetered: false, unit: "seat", status: "active" },
  { id: IDS.features.apiCalls, key: "api_calls", name: "درخواست API", category: "usage", isMetered: true, unit: "call", status: "active" },
  { id: IDS.features.exportData, key: "export_data", name: "خروجی داده", category: "core", isMetered: false, unit: null, status: "active" },
  { id: IDS.features.prioritySupport, key: "priority_support", name: "پشتیبانی ویژه", category: "support", isMetered: false, unit: null, status: "active" },
  { id: IDS.features.advancedAnalytics, key: "advanced_analytics", name: "تحلیل پیشرفته", category: "analytics", isMetered: false, unit: null, status: "active" },
  { id: IDS.features.sso, key: "sso", name: "ورود یکپارچه (SSO)", category: "security", isMetered: false, unit: null, status: "active" },
];

/**
 * Two intentional data-quality issues live here:
 * 1. `advanced_analytics` <-> `sso` form a 2-node dependency cycle.
 * 2. `export_data` depends on a feature id that does not exist in FEATURES
 *    (`dataWarehouseConnectorMissing`) — simulating a soft-deleted feature
 *    whose dependency row was never cleaned up.
 */
export const FEATURE_DEPENDENCIES: FeatureDependencyRow[] = [
  { id: "d0000000-0000-4000-8000-000000000001", featureId: IDS.features.advancedAnalytics, dependsOnFeatureId: IDS.features.apiCalls, dependencyType: "requires" },
  { id: "d0000000-0000-4000-8000-000000000002", featureId: IDS.features.advancedAnalytics, dependsOnFeatureId: IDS.features.sso, dependencyType: "requires" },
  { id: "d0000000-0000-4000-8000-000000000003", featureId: IDS.features.sso, dependsOnFeatureId: IDS.features.advancedAnalytics, dependencyType: "requires" },
  { id: "d0000000-0000-4000-8000-000000000004", featureId: IDS.features.exportData, dependsOnFeatureId: IDS.features.dataWarehouseConnectorMissing, dependencyType: "requires" },
];

export const PLANS: PlanRow[] = [
  { id: IDS.plans.starter, key: "starter", name: "استارتر", status: "active", tier: 1 },
  { id: IDS.plans.pro, key: "pro", name: "حرفه‌ای", status: "active", tier: 2 },
  { id: IDS.plans.enterprise, key: "enterprise", name: "سازمانی", status: "active", tier: 3 },
  { id: IDS.plans.legacy, key: "legacy", name: "پلن قدیمی (منسوخ)", status: "deprecated", tier: 1 },
];

/**
 * `legacyV1` and `legacyV2` are BOTH `published` with open-ended effective
 * ranges — an intentional "multiple published versions" inconsistency for
 * the publish-readiness validator to catch. `proV1`/`proV2` intentionally
 * overlap by 9 days for the version-overlap detector.
 */
export const PLAN_VERSIONS: PlanVersionRow[] = [
  { id: IDS.planVersions.starterV1, planId: IDS.plans.starter, version: 1, status: "published", effectiveFrom: new Date("2025-01-01T00:00:00Z"), effectiveTo: null, billingIntervalUnit: "month", billingIntervalCount: 1 },
  { id: IDS.planVersions.proV1, planId: IDS.plans.pro, version: 1, status: "published", effectiveFrom: new Date("2025-01-01T00:00:00Z"), effectiveTo: new Date("2025-07-10T00:00:00Z"), billingIntervalUnit: "month", billingIntervalCount: 1 },
  { id: IDS.planVersions.proV2, planId: IDS.plans.pro, version: 2, status: "published", effectiveFrom: new Date("2025-07-01T00:00:00Z"), effectiveTo: null, billingIntervalUnit: "month", billingIntervalCount: 1 },
  { id: IDS.planVersions.enterpriseV1, planId: IDS.plans.enterprise, version: 1, status: "published", effectiveFrom: new Date("2025-01-01T00:00:00Z"), effectiveTo: null, billingIntervalUnit: "month", billingIntervalCount: 1 },
  { id: IDS.planVersions.legacyV1, planId: IDS.plans.legacy, version: 1, status: "published", effectiveFrom: new Date("2024-01-01T00:00:00Z"), effectiveTo: null, billingIntervalUnit: "month", billingIntervalCount: 1 },
  { id: IDS.planVersions.legacyV2, planId: IDS.plans.legacy, version: 2, status: "published", effectiveFrom: new Date("2024-06-01T00:00:00Z"), effectiveTo: null, billingIntervalUnit: "month", billingIntervalCount: 1 },
];

export const PLAN_PRICES: PlanPriceRow[] = [
  { id: "p0000000-0000-4000-8000-000000000001", planVersionId: IDS.planVersions.starterV1, currency: "USD", unitAmount: BigInt(2900), billingScheme: "flat" },
  { id: "p0000000-0000-4000-8000-000000000002", planVersionId: IDS.planVersions.proV1, currency: "USD", unitAmount: BigInt(7900), billingScheme: "flat" },
  { id: "p0000000-0000-4000-8000-000000000003", planVersionId: IDS.planVersions.proV2, currency: "USD", unitAmount: BigInt(9900), billingScheme: "flat" },
  { id: "p0000000-0000-4000-8000-000000000004", planVersionId: IDS.planVersions.enterpriseV1, currency: "IRR", unitAmount: BigInt(49000000), billingScheme: "flat" },
];

export const PLAN_FEATURES: PlanFeatureRow[] = [
  { id: "pf000000-0000-4000-8000-000000000001", planVersionId: IDS.planVersions.starterV1, featureId: IDS.features.seats, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000002", planVersionId: IDS.planVersions.starterV1, featureId: IDS.features.apiCalls, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000003", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.seats, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000004", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.apiCalls, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000005", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.exportData, isEnabled: true },
  // Intentional: proV2 enables SSO but not advanced_analytics; combined with the
  // dependency cycle above this proves a subscriber can get "sso" without ever
  // being able to satisfy advanced_analytics' reverse edge — a real publish blocker.
  { id: "pf000000-0000-4000-8000-000000000006", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.sso, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000007", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.seats, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000008", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.apiCalls, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000009", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.exportData, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000010", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.prioritySupport, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000011", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.advancedAnalytics, isEnabled: true },
  { id: "pf000000-0000-4000-8000-000000000012", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.sso, isEnabled: true },
];

export const PLAN_LIMITS: PlanLimitRow[] = [
  { id: "pl000000-0000-4000-8000-000000000001", planVersionId: IDS.planVersions.starterV1, featureId: IDS.features.apiCalls, limitType: "quota", limitValue: BigInt(1000), periodUnit: "billing_cycle" },
  { id: "pl000000-0000-4000-8000-000000000002", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.apiCalls, limitType: "quota", limitValue: BigInt(50000), periodUnit: "billing_cycle" },
  { id: "pl000000-0000-4000-8000-000000000003", planVersionId: IDS.planVersions.enterpriseV1, featureId: IDS.features.apiCalls, limitType: "quota", limitValue: null, periodUnit: "billing_cycle" },
  { id: "pl000000-0000-4000-8000-000000000004", planVersionId: IDS.planVersions.starterV1, featureId: IDS.features.seats, limitType: "seat", limitValue: BigInt(3), periodUnit: null },
  { id: "pl000000-0000-4000-8000-000000000005", planVersionId: IDS.planVersions.proV2, featureId: IDS.features.seats, limitType: "seat", limitValue: BigInt(10), periodUnit: null },
];

export const FEATURE_PRICING_RULES: FeaturePricingRuleRow[] = [
  {
    id: "fp000000-0000-4000-8000-000000000001",
    featureId: IDS.features.apiCalls,
    planVersionId: IDS.planVersions.proV2,
    currency: "USD",
    pricingModel: "tiered",
    tiers: [
      { upTo: "50000", unitAmount: "0", flatAmount: "0" },
      { upTo: "200000", unitAmount: "2", flatAmount: "0" },
      { upTo: null, unitAmount: "1", flatAmount: "0" },
    ],
  },
  {
    id: "fp000000-0000-4000-8000-000000000002",
    featureId: IDS.features.apiCalls,
    planVersionId: IDS.planVersions.enterpriseV1,
    currency: "IRR",
    pricingModel: "volume",
    tiers: [
      { upTo: "1000000", unitAmount: "50", flatAmount: "0" },
      { upTo: null, unitAmount: "30", flatAmount: "0" },
    ],
  },
];

export const PLAN_CREDIT_POLICIES: PlanCreditPolicyRow[] = [
  { id: "cp000000-0000-4000-8000-000000000001", planVersionId: IDS.planVersions.proV2, currency: "USD", grantAmount: BigInt(5000), rolloverEnabled: false, rolloverMaxAmount: null, expirationDays: 30 },
  { id: "cp000000-0000-4000-8000-000000000002", planVersionId: IDS.planVersions.enterpriseV1, currency: "IRR", grantAmount: BigInt(2000000), rolloverEnabled: true, rolloverMaxAmount: BigInt(4000000), expirationDays: 90 },
];

/**
 * Intentional gap: there is no rule allowing `enterprise -> starter` directly,
 * forcing a two-step downgrade through `pro`. The catalog validator surfaces
 * this as a "dead-end downgrade path" finding rather than silently allowing it.
 */
export const PLAN_CHANGE_RULES: PlanChangeRuleRow[] = [
  { id: "cr000000-0000-4000-8000-000000000001", fromPlanId: IDS.plans.starter, toPlanId: IDS.plans.pro, changeType: "upgrade", prorationBehavior: "immediate", isAllowed: true },
  { id: "cr000000-0000-4000-8000-000000000002", fromPlanId: IDS.plans.pro, toPlanId: IDS.plans.enterprise, changeType: "upgrade", prorationBehavior: "immediate", isAllowed: true },
  { id: "cr000000-0000-4000-8000-000000000003", fromPlanId: IDS.plans.starter, toPlanId: IDS.plans.enterprise, changeType: "upgrade", prorationBehavior: "immediate", isAllowed: true },
  { id: "cr000000-0000-4000-8000-000000000004", fromPlanId: IDS.plans.pro, toPlanId: IDS.plans.starter, changeType: "downgrade", prorationBehavior: "end_of_period", isAllowed: true },
];

export const ADDONS: AddonRow[] = [
  { id: IDS.addons.extraSeats, key: "extra_seats", name: "صندلی اضافه", status: "active" },
  { id: IDS.addons.dedicatedSupport, key: "dedicated_support", name: "پشتیبانی اختصاصی", status: "active" },
];

export const PLAN_ADDONS: PlanAddonRow[] = [
  { id: "pa000000-0000-4000-8000-000000000001", planId: IDS.plans.pro, addonId: IDS.addons.extraSeats, isRequired: false },
  { id: "pa000000-0000-4000-8000-000000000002", planId: IDS.plans.enterprise, addonId: IDS.addons.dedicatedSupport, isRequired: true },
];

export const ADDON_PRICES: AddonPriceRow[] = [
  { id: "ap000000-0000-4000-8000-000000000001", addonId: IDS.addons.extraSeats, currency: "USD", unitAmount: BigInt(500), billingIntervalUnit: "month" },
];

export const ADDON_FEATURES: AddonFeatureRow[] = [
  { id: "af000000-0000-4000-8000-000000000001", addonId: IDS.addons.dedicatedSupport, featureId: IDS.features.prioritySupport },
];

export const COUPONS: CouponRow[] = [
  {
    id: IDS.coupons.welcome10,
    code: "WELCOME10",
    discountType: "percentage",
    percentOff: "10.00",
    amountOff: null,
    currency: null,
    duration: "repeating",
    durationInMonths: 3,
    maxRedemptions: 100,
    redeemBy: new Date("2026-12-31T00:00:00Z"),
    status: "active",
  },
  {
    // Data-quality signal: status still "active" even though redeemBy is in the
    // past relative to DEMO_NOW (2026-01-15) — a temporal-validity mismatch.
    id: IDS.coupons.summer50Stale,
    code: "SUMMER50",
    discountType: "fixed_amount",
    percentOff: null,
    amountOff: BigInt(5000),
    currency: "USD",
    duration: "once",
    durationInMonths: null,
    maxRedemptions: 50,
    redeemBy: new Date("2025-09-01T00:00:00Z"),
    status: "active",
  },
];

export const TAX_RATES: TaxRateRow[] = [
  { id: IDS.taxRates.usCa, code: "US-CA", percentage: "8.500", isInclusive: false, effectiveFrom: new Date("2024-01-01T00:00:00Z"), effectiveTo: null, status: "active" },
  { id: IDS.taxRates.irVat, code: "IR-VAT", percentage: "9.000", isInclusive: false, effectiveFrom: new Date("2024-01-01T00:00:00Z"), effectiveTo: null, status: "active" },
];
