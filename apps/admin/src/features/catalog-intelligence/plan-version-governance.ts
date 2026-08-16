// =============================================================================
// Plan Version Diff & Publish-Readiness Validator
// -----------------------------------------------------------------------------
// Capabilities: diffPlanVersions, validatePlanVersionPublishReadiness
// Tables used: plan_versions, plan_prices, plan_features, plan_limits,
//              feature_pricing_rules, plan_credit_policies, subscriptions
// Problem solved: catalog editors need to know exactly what changed between
// two versions of the same plan (price, features, quotas, credit policy)
// before publishing, and whether publishing would create version overlaps,
// duplicate "published" versions, or orphan an existing subscription that is
// still pinned to a version being retired.
// Consumer: catalog-intelligence UI tab, decision-engine impact analysis.
// =============================================================================

import type { IntelligenceDataset, PlanVersionRow, UUID } from "@/shared/dataset-types";
import { overlaps } from "@/shared/date";
import type { ReasonedFinding } from "@/shared/reason-code";

export type PlanGovernanceReasonCode =
  | "OVERLAPPING_VERSIONS"
  | "MULTIPLE_PUBLISHED_VERSIONS"
  | "SUBSCRIPTION_ON_RETIRED_VERSION"
  | "SUBSCRIPTION_ON_UNPUBLISHED_VERSION"
  | "MISSING_PRICE_FOR_CURRENCY"
  | "NO_FEATURES_DEFINED";

export interface PlanVersionFieldDiff<T> {
  field: string;
  before: T | null;
  after: T | null;
  changed: boolean;
}

export interface PlanVersionDiff {
  fromVersionId: UUID;
  toVersionId: UUID;
  priceDiffs: PlanVersionFieldDiff<string>[];
  featuresAdded: string[];
  featuresRemoved: string[];
  limitsChanged: { featureKey: string; before: string | null; after: string | null }[];
  creditPolicyChanged: boolean;
}

export function diffPlanVersions(dataset: IntelligenceDataset, fromVersionId: UUID, toVersionId: UUID): PlanVersionDiff {
  const featureById = new Map(dataset.features.map((feature) => [feature.id, feature]));

  const pricesFor = (versionId: UUID) => dataset.planPrices.filter((price) => price.planVersionId === versionId);
  const currencies = new Set([...pricesFor(fromVersionId), ...pricesFor(toVersionId)].map((price) => price.currency));
  const priceDiffs: PlanVersionFieldDiff<string>[] = Array.from(currencies).map((currency) => {
    const before = pricesFor(fromVersionId).find((price) => price.currency === currency)?.unitAmount ?? null;
    const after = pricesFor(toVersionId).find((price) => price.currency === currency)?.unitAmount ?? null;
    return {
      field: `price:${currency}`,
      before: before !== null ? before.toString() : null,
      after: after !== null ? after.toString() : null,
      changed: before !== after,
    };
  });

  const fromFeatureIds = new Set(dataset.planFeatures.filter((row) => row.planVersionId === fromVersionId && row.isEnabled).map((row) => row.featureId));
  const toFeatureIds = new Set(dataset.planFeatures.filter((row) => row.planVersionId === toVersionId && row.isEnabled).map((row) => row.featureId));
  const featuresAdded = [...toFeatureIds].filter((id) => !fromFeatureIds.has(id)).map((id) => featureById.get(id)?.key ?? id);
  const featuresRemoved = [...fromFeatureIds].filter((id) => !toFeatureIds.has(id)).map((id) => featureById.get(id)?.key ?? id);

  const limitsFor = (versionId: UUID) => dataset.planLimits.filter((row) => row.planVersionId === versionId);
  const limitFeatureIds = new Set([...limitsFor(fromVersionId), ...limitsFor(toVersionId)].map((row) => row.featureId));
  const limitsChanged = Array.from(limitFeatureIds)
    .map((featureId) => {
      const before = limitsFor(fromVersionId).find((row) => row.featureId === featureId)?.limitValue ?? null;
      const after = limitsFor(toVersionId).find((row) => row.featureId === featureId)?.limitValue ?? null;
      return {
        featureKey: featureById.get(featureId)?.key ?? featureId,
        before: before !== null ? before.toString() : null,
        after: after !== null ? after.toString() : null,
      };
    })
    .filter((entry) => entry.before !== entry.after);

  const creditPolicyBefore = dataset.planCreditPolicies.find((row) => row.planVersionId === fromVersionId);
  const creditPolicyAfter = dataset.planCreditPolicies.find((row) => row.planVersionId === toVersionId);
  const creditPolicyChanged = JSON.stringify({ ...creditPolicyBefore, id: undefined, planVersionId: undefined }) !==
    JSON.stringify({ ...creditPolicyAfter, id: undefined, planVersionId: undefined });

  return { fromVersionId, toVersionId, priceDiffs, featuresAdded, featuresRemoved, limitsChanged, creditPolicyChanged };
}

export interface PlanVersionPublishReadinessReport {
  planId: UUID;
  completenessScore: number; // 0-100
  blockers: ReasonedFinding<PlanGovernanceReasonCode>[];
  warnings: ReasonedFinding<PlanGovernanceReasonCode>[];
}

/**
 * Scores and validates every version of a single plan. This is intentionally
 * plan-scoped (not global) because "published" is only ambiguous within one
 * plan's version history.
 */
export function validatePlanVersionPublishReadiness(
  dataset: IntelligenceDataset,
  planId: UUID,
): PlanVersionPublishReadinessReport {
  const versions = dataset.planVersions.filter((version) => version.planId === planId);
  const blockers: ReasonedFinding<PlanGovernanceReasonCode>[] = [];
  const warnings: ReasonedFinding<PlanGovernanceReasonCode>[] = [];

  const publishedVersions = versions.filter((version) => version.status === "published" && version.effectiveTo === null);
  if (publishedVersions.length > 1) {
    blockers.push({
      code: "MULTIPLE_PUBLISHED_VERSIONS",
      severity: "critical",
      messageFa: `${publishedVersions.length} نسخه به‌صورت هم‌زمان «published» و بدون تاریخ پایان هستند؛ مشخص نیست کدام نسخه فعال مرجع است.`,
      weight: 3,
      evidence: { versionIds: publishedVersions.map((v) => v.id) },
    });
  }

  for (let i = 0; i < versions.length; i += 1) {
    for (let j = i + 1; j < versions.length; j += 1) {
      const a = versions[i];
      const b = versions[j];
      if (overlapsVersions(a, b)) {
        blockers.push({
          code: "OVERLAPPING_VERSIONS",
          severity: "critical",
          messageFa: `بازه اثرگذاری نسخه ${a.version} و نسخه ${b.version} با یکدیگر هم‌پوشانی دارد.`,
          weight: 2,
          evidence: { versionIds: [a.id, b.id] },
        });
      }
    }
  }

  for (const version of versions) {
    const hasFeatures = dataset.planFeatures.some((row) => row.planVersionId === version.id && row.isEnabled);
    if (!hasFeatures) {
      warnings.push({
        code: "NO_FEATURES_DEFINED",
        severity: "warning",
        messageFa: `نسخه ${version.version} هیچ featureی فعالی ندارد.`,
        weight: 1,
        evidence: { versionId: version.id },
      });
    }
    const hasPrice = dataset.planPrices.some((row) => row.planVersionId === version.id);
    if (!hasPrice && version.status === "published") {
      warnings.push({
        code: "MISSING_PRICE_FOR_CURRENCY",
        severity: "warning",
        messageFa: `نسخه منتشرشده ${version.version} هیچ قیمتی برای هیچ ارزی ندارد.`,
        weight: 1,
        evidence: { versionId: version.id },
      });
    }
  }

  for (const subscription of dataset.subscriptions) {
    const version = versions.find((v) => v.id === subscription.planVersionId);
    if (!version) continue;
    if (version.status === "retired") {
      blockers.push({
        code: "SUBSCRIPTION_ON_RETIRED_VERSION",
        severity: "critical",
        messageFa: `اشتراک ${subscription.id} همچنان به نسخه بازنشسته ${version.version} متصل است.`,
        weight: 3,
        evidence: { subscriptionId: subscription.id, versionId: version.id },
      });
    } else if (version.status === "draft") {
      blockers.push({
        code: "SUBSCRIPTION_ON_UNPUBLISHED_VERSION",
        severity: "critical",
        messageFa: `اشتراک ${subscription.id} به نسخه پیش‌نویس (منتشرنشده) ${version.version} متصل است.`,
        weight: 3,
        evidence: { subscriptionId: subscription.id, versionId: version.id },
      });
    }
  }

  const totalChecks = 5;
  const failedWeight = blockers.reduce((sum, item) => sum + item.weight, 0) + warnings.reduce((sum, item) => sum + item.weight * 0.5, 0);
  const completenessScore = Math.max(0, Math.round(100 - (failedWeight / totalChecks) * 20));

  return { planId, completenessScore, blockers, warnings };
}

function overlapsVersions(a: PlanVersionRow, b: PlanVersionRow): boolean {
  const aEnd = a.effectiveTo ?? new Date("9999-12-31T00:00:00Z");
  const bEnd = b.effectiveTo ?? new Date("9999-12-31T00:00:00Z");
  return overlaps(a.effectiveFrom, aEnd, b.effectiveFrom, bEnd);
}
