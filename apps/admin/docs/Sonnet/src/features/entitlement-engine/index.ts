// =============================================================================
// Effective Entitlement Resolver
// -----------------------------------------------------------------------------
// Capability: resolveEffectiveSubscriptionEntitlements
// Tables used: subscriptions, plan_versions, plan_features, plan_limits,
//              subscription_addons, addon_features, feature_dependencies,
//              features
// Problem solved: "What can this subscription actually do right now?" is not
// a single column anywhere in the schema — it is the join of the plan's
// feature grants, any active addon's feature grants, and the feature
// dependency graph (a feature that "requires" another is not truly usable
// unless the dependency is also granted). This resolver produces one
// authoritative answer instead of every caller re-deriving it differently.
// Consumers: account-intelligence (User 360), decision-engine (next best
// action upsell logic), UI entitlement inspector.
// Decision supported: support/billing staff can answer "why does this
// customer not have feature X" with a concrete reason instead of guessing.
// =============================================================================

import type { ExplainableResult, ReasonedFinding } from "@/shared/reason-code";
import { deriveConfidenceFromSignalCount } from "@/shared/reason-code";
import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";

export type EntitlementReasonCode =
  | "GRANTED_BY_PLAN"
  | "GRANTED_BY_ADDON"
  | "BLOCKED_MISSING_DEPENDENCY"
  | "BLOCKED_NOT_INCLUDED"
  | "DISABLED_BY_PLAN_VERSION";

export interface FeatureEntitlement {
  featureId: UUID;
  featureKey: string;
  featureName: string;
  granted: boolean;
  grantedBy: ("plan" | "addon")[];
  limit: { limitType: string; limitValue: string | null; periodUnit: string | null } | null;
  reasons: ReasonedFinding<EntitlementReasonCode>[];
}

export interface EffectiveEntitlementProfile {
  subscriptionId: UUID;
  planVersionId: UUID;
  entitlements: FeatureEntitlement[];
}

export function resolveEffectiveSubscriptionEntitlements(
  dataset: IntelligenceDataset,
  subscriptionId: UUID,
): ExplainableResult<EntitlementReasonCode, EffectiveEntitlementProfile> {
  const subscription = dataset.subscriptions.find((row) => row.id === subscriptionId);
  if (!subscription) {
    return {
      payload: { subscriptionId, planVersionId: "", entitlements: [] },
      reasons: [{ code: "BLOCKED_NOT_INCLUDED", severity: "critical", messageFa: "اشتراک یافت نشد.", weight: 1 }],
      confidence: "low",
      dataSufficiency: "insufficient",
    };
  }

  const featureById = new Map(dataset.features.map((feature) => [feature.id, feature]));

  const planFeatureIds = new Set(
    dataset.planFeatures
      .filter((row) => row.planVersionId === subscription.planVersionId && row.isEnabled)
      .map((row) => row.featureId),
  );

  const activeAddonIds = new Set(
    dataset.subscriptionAddons
      .filter((row) => row.subscriptionId === subscriptionId && row.status === "active")
      .map((row) => row.addonId),
  );
  const addonFeatureIds = new Set(
    dataset.addonFeatures.filter((row) => activeAddonIds.has(row.addonId)).map((row) => row.featureId),
  );

  const grantedFeatureIds = new Set<UUID>([...planFeatureIds, ...addonFeatureIds]);

  const dependenciesByFeature = new Map<UUID, UUID[]>();
  for (const dependency of dataset.featureDependencies) {
    if (dependency.dependencyType !== "requires") continue;
    const list = dependenciesByFeature.get(dependency.featureId) ?? [];
    list.push(dependency.dependsOnFeatureId);
    dependenciesByFeature.set(dependency.featureId, list);
  }

  const limitsByFeature = new Map(
    dataset.planLimits
      .filter((row) => row.planVersionId === subscription.planVersionId)
      .map((row) => [row.featureId, row]),
  );

  const entitlements: FeatureEntitlement[] = [];
  for (const feature of dataset.features) {
    const reasons: ReasonedFinding<EntitlementReasonCode>[] = [];
    const grantedByPlan = planFeatureIds.has(feature.id);
    const grantedByAddon = addonFeatureIds.has(feature.id);
    let granted = grantedByPlan || grantedByAddon;
    const grantedBy: ("plan" | "addon")[] = [];
    if (grantedByPlan) {
      grantedBy.push("plan");
      reasons.push({ code: "GRANTED_BY_PLAN", severity: "info", messageFa: `این قابلیت در نسخه فعلی پلن گنجانده شده است.`, weight: 1 });
    }
    if (grantedByAddon) {
      grantedBy.push("addon");
      reasons.push({ code: "GRANTED_BY_ADDON", severity: "info", messageFa: `این قابلیت از طریق افزونه فعال اعطا شده است.`, weight: 1 });
    }

    if (granted) {
      const requiredDependencies = dependenciesByFeature.get(feature.id) ?? [];
      const missingDependencies = requiredDependencies.filter((depId) => !grantedFeatureIds.has(depId));
      if (missingDependencies.length > 0) {
        granted = false;
        for (const missingId of missingDependencies) {
          const missingFeature = featureById.get(missingId);
          reasons.push({
            code: "BLOCKED_MISSING_DEPENDENCY",
            severity: "critical",
            messageFa: `قابلیت به «${missingFeature?.name ?? "یک وابستگی نامشخص"}» نیاز دارد که برای این اشتراک فعال نیست.`,
            weight: 2,
            evidence: { missingFeatureId: missingId },
          });
        }
      }
    } else if (feature.status !== "active") {
      reasons.push({ code: "DISABLED_BY_PLAN_VERSION", severity: "info", messageFa: "این قابلیت در کاتالوگ غیرفعال/منسوخ شده است.", weight: 1 });
    } else {
      reasons.push({ code: "BLOCKED_NOT_INCLUDED", severity: "info", messageFa: "این قابلیت در پلن یا افزونه‌های فعلی گنجانده نشده است.", weight: 1 });
    }

    const limitRow = limitsByFeature.get(feature.id);
    entitlements.push({
      featureId: feature.id,
      featureKey: feature.key,
      featureName: feature.name,
      granted,
      grantedBy,
      limit: limitRow
        ? { limitType: limitRow.limitType, limitValue: limitRow.limitValue !== null ? limitRow.limitValue.toString() : null, periodUnit: limitRow.periodUnit }
        : null,
      reasons,
    });
  }

  const blockedByDependency = entitlements.filter((entitlement) => entitlement.reasons.some((r) => r.code === "BLOCKED_MISSING_DEPENDENCY"));

  return {
    payload: { subscriptionId, planVersionId: subscription.planVersionId, entitlements },
    reasons: blockedByDependency.map((entitlement) => ({
      code: "BLOCKED_MISSING_DEPENDENCY" as const,
      severity: "warning" as const,
      messageFa: `قابلیت «${entitlement.featureName}» به دلیل وابستگی ناقص مسدود شد.`,
      weight: 1,
    })),
    confidence: deriveConfidenceFromSignalCount(dataset.planFeatures.length + dataset.addonFeatures.length, 3),
    dataSufficiency: dataset.features.length > 0 ? "sufficient" : "insufficient",
  };
}
