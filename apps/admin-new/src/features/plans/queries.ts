import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  featurePricingRules,
  features,
  planAddons,
  planCreditPolicies,
  planFeatures,
  planLimits,
  planPrices,
  planVersions,
  plans,
  subscriptions,
} from "@/db/schema";
import type {
  AddonWorkspaceItem,
  CreditWindow,
  CreditWindowPeriod,
  FeaturePolicyItem,
  FeatureWorkspaceItem,
  PlanCreditPolicyWorkspaceItem,
  PlanPriceWorkspaceItem,
  PlanWorkspaceItem,
  PlanWorkspaceVersion,
  PlansWorkspaceData,
} from "./types";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toCount(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

const CREDIT_WINDOW_PERIODS: CreditWindowPeriod[] = [
  "hour",
  "day",
  "week",
  "month",
  "year",
  "total",
];

function parseCreditWindows(metadata: unknown): CreditWindow[] {
  const raw =
    metadata && typeof metadata === "object"
      ? (metadata as { creditWindows?: unknown }).creditWindows
      : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === "object",
    )
    .map((entry) => ({
      id: String(entry.id ?? crypto.randomUUID()),
      period: CREDIT_WINDOW_PERIODS.includes(entry.period as CreditWindowPeriod)
        ? (entry.period as CreditWindowPeriod)
        : "month",
      periodCount: Number(entry.periodCount ?? 1) || 1,
      creditAmount: Number(entry.creditAmount ?? 0) || 0,
    }));
}

function parseAllowedUploadMimeTypes(metadata: unknown): string[] {
  const raw =
    metadata && typeof metadata === "object"
      ? (metadata as { allowedUploadMimeTypes?: unknown })
          .allowedUploadMimeTypes
      : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Read-only server query for the Plans workspace inside the Review Lab.
 *
 * Returns the full catalog picture the owner needs to manage entitlement
 * limits (upload file size, duration, storage quota, …): plans + versions,
 * active features, and the current per-feature policy on every plan version.
 * The UI composes them by `planVersionId + featureId`.
 */
export async function getPlansWorkspaceData(): Promise<PlansWorkspaceData> {
  const [
    planRows,
    versionRows,
    featureRows,
    addonRows,
    planFeatureRows,
    limitRows,
    pricingRows,
    priceRows,
    creditRows,
    planAddonRows,
    subscriberRows,
  ] = await Promise.all([
    db
      .select({
        id: plans.id,
        code: plans.code,
        name: plans.name,
        description: plans.description,
        status: plans.status,
        isPublic: plans.isPublic,
        sortOrder: plans.sortOrder,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .orderBy(asc(plans.sortOrder), asc(plans.name), asc(plans.code)),
    db
      .select({
        id: planVersions.id,
        planId: planVersions.planId,
        versionNumber: planVersions.versionNumber,
        status: planVersions.status,
        title: planVersions.title,
        effectiveFrom: planVersions.effectiveFrom,
        effectiveTo: planVersions.effectiveTo,
        changeNotes: planVersions.changeNotes,
        metadata: planVersions.metadata,
        createdAt: planVersions.createdAt,
      })
      .from(planVersions)
      .orderBy(desc(planVersions.versionNumber), desc(planVersions.createdAt)),
    db
      .select({
        id: features.id,
        code: features.code,
        name: features.name,
        description: features.description,
        kind: features.kind,
        unitName: features.unitName,
        isActive: features.isActive,
      })
      .from(features)
      .where(eq(features.isActive, true))
      .orderBy(asc(features.name), asc(features.code)),
    db
      .select({
        id: addons.id,
        code: addons.code,
        name: addons.name,
        description: addons.description,
        scope: addons.scope,
        isActive: addons.isActive,
      })
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.name), asc(addons.code)),
    db
      .select({
        planVersionId: planFeatures.planVersionId,
        featureId: planFeatures.featureId,
        isIncluded: planFeatures.isIncluded,
      })
      .from(planFeatures),
    db
      .select({
        planVersionId: planLimits.planVersionId,
        featureId: planLimits.featureId,
        limitValue: planLimits.limitValue,
        period: planLimits.period,
        behavior: planLimits.behavior,
        overageUnitPrice: planLimits.overageUnitPrice,
      })
      .from(planLimits),
    db
      .select({
        planVersionId: featurePricingRules.planVersionId,
        featureId: featurePricingRules.featureId,
        metric: featurePricingRules.metric,
        pricingModel: featurePricingRules.pricingModel,
        currency: featurePricingRules.currency,
        unitPrice: featurePricingRules.unitPrice,
        creditCostPerUnit: featurePricingRules.creditCostPerUnit,
        minimumCharge: featurePricingRules.minimumCharge,
        isActive: featurePricingRules.isActive,
      })
      .from(featurePricingRules)
      .where(eq(featurePricingRules.isActive, true)),
    db
      .select({
        id: planPrices.id,
        planVersionId: planPrices.planVersionId,
        priceType: planPrices.priceType,
        currency: planPrices.currency,
        amount: planPrices.amount,
        billingInterval: planPrices.billingInterval,
        billingIntervalCount: planPrices.billingIntervalCount,
        trialDays: planPrices.trialDays,
        isDefault: planPrices.isDefault,
        isActive: planPrices.isActive,
      })
      .from(planPrices),
    db
      .select({
        planVersionId: planCreditPolicies.planVersionId,
        monthlyCreditGrant: planCreditPolicies.monthlyCreditGrant,
        rolloverEnabled: planCreditPolicies.rolloverEnabled,
        rolloverCap: planCreditPolicies.rolloverCap,
        resetPolicy: planCreditPolicies.resetPolicy,
        grantExpiryDays: planCreditPolicies.grantExpiryDays,
        negativeBalanceAllowed: planCreditPolicies.negativeBalanceAllowed,
        maxNegativeBalance: planCreditPolicies.maxNegativeBalance,
        metadata: planCreditPolicies.metadata,
      })
      .from(planCreditPolicies),
    db
      .select({
        planId: planAddons.planId,
        id: addons.id,
        code: addons.code,
        name: addons.name,
        description: addons.description,
        scope: addons.scope,
        isActive: addons.isActive,
      })
      .from(planAddons)
      .innerJoin(addons, eq(planAddons.addonId, addons.id)),
    db
      .select({
        planId: subscriptions.planId,
        value: sql<string>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'active')::text`,
      })
      .from(subscriptions)
      .groupBy(subscriptions.planId),
  ]);

  const versionsByPlan = new Map<string, PlanWorkspaceVersion[]>();
  for (const version of versionRows) {
    const current = versionsByPlan.get(version.planId) ?? [];
    current.push({
      id: version.id,
      planId: version.planId,
      versionNumber: version.versionNumber,
      status: version.status,
      title: version.title,
      effectiveFrom: toIso(version.effectiveFrom),
      effectiveTo: toIso(version.effectiveTo),
      changeNotes: version.changeNotes,
      allowedUploadMimeTypes: parseAllowedUploadMimeTypes(version.metadata),
      createdAt: version.createdAt.toISOString(),
    });
    versionsByPlan.set(version.planId, current);
  }

  const subscriberCounts = new Map(
    subscriberRows.map((row) => [row.planId, toCount(row.value)]),
  );

  const versionPlanMap = new Map(
    versionRows.map((version) => [version.id, version.planId]),
  );

  const priceRowsByPlan = new Map<string, PlanPriceWorkspaceItem[]>();
  for (const row of priceRows) {
    const planId = versionPlanMap.get(row.planVersionId);
    if (!planId) continue;
    const current = priceRowsByPlan.get(planId) ?? [];
    current.push({
      id: row.id,
      planVersionId: row.planVersionId,
      priceType: row.priceType,
      currency: row.currency,
      amount: String(row.amount),
      billingInterval: row.billingInterval,
      billingIntervalCount: row.billingIntervalCount,
      trialDays: row.trialDays,
      isDefault: row.isDefault,
      isActive: row.isActive,
    });
    priceRowsByPlan.set(planId, current);
  }

  const creditByPlan = new Map<string, PlanCreditPolicyWorkspaceItem>();
  for (const row of creditRows) {
    const planId = versionPlanMap.get(row.planVersionId);
    if (!planId) continue;
    creditByPlan.set(planId, {
      planVersionId: row.planVersionId,
      monthlyCreditGrant: String(row.monthlyCreditGrant),
      rolloverEnabled: row.rolloverEnabled,
      rolloverCap:
        row.rolloverCap === null ? null : String(row.rolloverCap),
      resetPolicy: row.resetPolicy,
      grantExpiryDays: row.grantExpiryDays,
      negativeBalanceAllowed: row.negativeBalanceAllowed,
      maxNegativeBalance:
        row.maxNegativeBalance === null
          ? null
          : String(row.maxNegativeBalance),
      windows: parseCreditWindows(row.metadata),
    });
  }

  const addonsByPlan = new Map<string, AddonWorkspaceItem[]>();
  for (const row of planAddonRows) {
    const current = addonsByPlan.get(row.planId) ?? [];
    current.push({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      scope: row.scope,
      isActive: row.isActive,
    });
    addonsByPlan.set(row.planId, current);
  }

  const workspacePlans: PlanWorkspaceItem[] = planRows.map((plan) => ({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
    activeSubscribers: subscriberCounts.get(plan.id) ?? 0,
    versions: versionsByPlan.get(plan.id) ?? [],
    defaultPrice:
      (priceRowsByPlan.get(plan.id) ?? []).find(
        (price) => price.isDefault && price.isActive,
      ) ?? null,
    creditPolicy: creditByPlan.get(plan.id) ?? null,
    addons: addonsByPlan.get(plan.id) ?? [],
  }));

  const workspaceFeatures: FeatureWorkspaceItem[] = featureRows.map(
    (feature) => ({
      id: feature.id,
      code: feature.code,
      name: feature.name,
      description: feature.description,
      kind: feature.kind,
      unitName: feature.unitName,
      isActive: feature.isActive,
    }),
  );

  const workspaceAddons: AddonWorkspaceItem[] = addonRows.map((addon) => ({
    id: addon.id,
    code: addon.code,
    name: addon.name,
    description: addon.description,
    scope: addon.scope,
    isActive: addon.isActive,
  }));

  const policyMap = new Map<string, FeaturePolicyItem>();
  const keyFor = (planVersionId: string, featureId: string) =>
    `${planVersionId}:${featureId}`;
  const entryFor = (planVersionId: string, featureId: string) => {
    const key = keyFor(planVersionId, featureId);
    const existing = policyMap.get(key);
    if (existing) return existing;
    const created: FeaturePolicyItem = {
      planVersionId,
      featureId,
      isIncluded: null,
      limitValue: null,
      period: null,
      behavior: null,
      overageUnitPrice: null,
      metric: null,
      pricingModel: null,
      currency: null,
      unitPrice: null,
      creditCostPerUnit: null,
      minimumCharge: null,
    };
    policyMap.set(key, created);
    return created;
  };

  for (const row of planFeatureRows) {
    const policy = entryFor(row.planVersionId, row.featureId);
    policy.isIncluded = row.isIncluded;
  }

  for (const row of limitRows) {
    const policy = entryFor(row.planVersionId, row.featureId);
    if (policy.limitValue === null) {
      policy.limitValue =
        row.limitValue === null ? null : String(row.limitValue);
      policy.period = row.period;
      policy.behavior = row.behavior;
      policy.overageUnitPrice =
        row.overageUnitPrice === null ? null : String(row.overageUnitPrice);
    }
  }

  for (const row of pricingRows) {
    const policy = entryFor(row.planVersionId, row.featureId);
    if (policy.metric === null) {
      policy.metric = row.metric;
      policy.pricingModel = row.pricingModel;
      policy.currency = row.currency;
      policy.unitPrice =
        row.unitPrice === null ? null : String(row.unitPrice);
      policy.creditCostPerUnit =
        row.creditCostPerUnit === null
          ? null
          : String(row.creditCostPerUnit);
      policy.minimumCharge =
        row.minimumCharge === null ? null : String(row.minimumCharge);
    }
  }

  return {
    summary: {
      totalPlans: workspacePlans.length,
      activePlans: workspacePlans.filter((plan) => plan.status === "active")
        .length,
      publishedVersions: versionRows.filter(
        (version) => version.status === "published",
      ).length,
      activeSubscribers: workspacePlans.reduce(
        (total, plan) => total + plan.activeSubscribers,
        0,
      ),
    },
    plans: workspacePlans,
    features: workspaceFeatures,
    addons: workspaceAddons,
    policies: [...policyMap.values()],
  };
}
