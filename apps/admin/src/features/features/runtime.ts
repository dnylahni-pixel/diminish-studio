import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  featureDependencies,
  featurePricingRules,
  features,
  planFeatures,
  planLimits,
} from "@/db/schema";
import {
  readDefaultAccess,
  resolveOptionalFeaturePolicy,
  type ResolvedFeaturePolicy,
} from "./policy";

export interface RuntimeFeaturePolicy {
  feature: {
    id: string;
    code: string;
    name: string;
    kind: "boolean" | "metered" | "quota" | "package";
    unitName: string | null;
    metadata: unknown;
  };
  planVersionId: string;
  resolved: ResolvedFeaturePolicy;
  blockedByDependencies: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  dependencyCycle: string[];
  config: unknown;
  limits: Array<{
    value: bigint | null;
    period: "none" | "day" | "week" | "month";
    behavior: "block" | "allow_overage";
    overageUnitPrice: bigint | null;
    metadata: unknown;
  }>;
  pricing: Array<{
    metric: "unit" | "minute" | "megabyte" | "request" | "seat";
    model: "flat" | "tiered" | "volume";
    currency: string | null;
    unitPrice: bigint;
    creditCostPerUnit: bigint;
    minimumCharge: bigint;
    tiers: unknown;
    metadata: unknown;
  }>;
}

function toBigInt(value: number | null | undefined) {
  return value === null || value === undefined ? BigInt(0) : BigInt(value);
}

export async function getRuntimeFeaturePolicy(
  featureCode: string,
  planVersionId: string,
): Promise<RuntimeFeaturePolicy | null> {
  const [
    featureRows,
    allFeatureRows,
    dependencyRows,
    planFeatureRows,
    limitRows,
    pricingRows,
  ] = await Promise.all([
    db
      .select()
      .from(features)
      .where(eq(features.code, featureCode))
      .limit(1),
    db.select().from(features),
    db.select().from(featureDependencies),
    db
      .select()
      .from(planFeatures)
      .where(eq(planFeatures.planVersionId, planVersionId)),
    db
      .select()
      .from(planLimits)
      .where(eq(planLimits.planVersionId, planVersionId)),
    db
      .select()
      .from(featurePricingRules)
      .where(
        and(
          eq(featurePricingRules.planVersionId, planVersionId),
          eq(featurePricingRules.isActive, true),
        ),
      ),
  ]);
  const feature = featureRows[0];
  if (!feature) return null;

  const featureById = new Map(allFeatureRows.map((row) => [row.id, row]));
  const planFeatureById = new Map(
    planFeatureRows.map((row) => [row.featureId, row]),
  );
  const dependenciesByFeatureId = new Map<string, string[]>();

  for (const dependency of dependencyRows) {
    if (!dependency.isHardDependency) continue;
    const current = dependenciesByFeatureId.get(dependency.featureId) ?? [];
    current.push(dependency.dependsOnFeatureId);
    dependenciesByFeatureId.set(dependency.featureId, current);
  }

  const memo = new Map<
    string,
    {
      resolved: ResolvedFeaturePolicy;
      blockedByDependencies: string[];
      dependencyCycle: string[];
    }
  >();

  function resolveFeature(
    currentFeatureId: string,
    path: string[],
  ): {
    resolved: ResolvedFeaturePolicy;
    blockedByDependencies: string[];
    dependencyCycle: string[];
  } {
    const cached = memo.get(currentFeatureId);
    if (cached) return cached;

    const currentFeature = featureById.get(currentFeatureId);
    if (!currentFeature) {
      return {
        resolved: resolveOptionalFeaturePolicy({
          featureActive: false,
          defaultAccess: "deny",
        }),
        blockedByDependencies: [currentFeatureId],
        dependencyCycle: [],
      };
    }

    const cycleStart = path.indexOf(currentFeatureId);
    if (cycleStart >= 0) {
      return {
        resolved: resolveOptionalFeaturePolicy({
          featureActive: false,
          defaultAccess: "deny",
        }),
        blockedByDependencies: [],
        dependencyCycle: [...path.slice(cycleStart), currentFeatureId],
      };
    }

    const planFeature = planFeatureById.get(currentFeatureId);
    const pricing = pricingRows.find((row) => row.featureId === currentFeatureId);
    let resolved = resolveOptionalFeaturePolicy({
      featureActive: currentFeature.isActive,
      defaultAccess: readDefaultAccess(currentFeature.metadata),
      planInclusion: planFeature?.isIncluded,
      pricingRuleActive: pricing?.isActive,
      creditCostPerUnit: pricing?.creditCostPerUnit,
      moneyCostPerUnit: pricing?.unitPrice,
    });
    const blockedByDependencies: string[] = [];
    let dependencyCycle: string[] = [];

    if (resolved.access === "allow") {
      for (const dependencyId of dependenciesByFeatureId.get(currentFeatureId) ?? []) {
        const dependency = resolveFeature(dependencyId, [...path, currentFeatureId]);
        if (dependency.resolved.access === "deny") {
          blockedByDependencies.push(dependencyId);
        }
        if (dependency.dependencyCycle.length > 0) {
          dependencyCycle = dependency.dependencyCycle;
        }
      }
    }

    if (blockedByDependencies.length > 0 || dependencyCycle.length > 0) {
      resolved = {
        ...resolved,
        access: "deny",
        accessSource: "plan_override",
      };
    }

    const result = { resolved, blockedByDependencies, dependencyCycle };
    memo.set(currentFeatureId, result);
    return result;
  }

  const evaluation = resolveFeature(feature.id, []);
  const selectedLimits = limitRows.filter((row) => row.featureId === feature.id);
  const selectedPricing = pricingRows.filter((row) => row.featureId === feature.id);
  const featureConfig = planFeatureById.get(feature.id)?.config ?? {};

  return {
    feature: {
      id: feature.id,
      code: feature.code,
      name: feature.name,
      kind: feature.kind,
      unitName: feature.unitName,
      metadata: feature.metadata,
    },
    planVersionId,
    resolved: {
      ...evaluation.resolved,
      limit:
        selectedLimits[0]?.limitValue === null ||
        selectedLimits[0]?.limitValue === undefined
          ? null
          : BigInt(selectedLimits[0].limitValue),
      unlimited:
        selectedLimits[0]?.limitValue === null ||
        selectedLimits[0]?.limitValue === undefined,
    },
    blockedByDependencies: evaluation.blockedByDependencies
      .map((id) => featureById.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined)
      .map((row) => ({ id: row.id, code: row.code, name: row.name })),
    dependencyCycle: evaluation.dependencyCycle.map(
      (id) => featureById.get(id)?.code ?? id,
    ),
    config: featureConfig,
    limits: selectedLimits.map((row) => ({
      value: row.limitValue === null ? null : BigInt(row.limitValue),
      period: row.period,
      behavior: row.behavior,
      overageUnitPrice:
        row.overageUnitPrice === null ? null : BigInt(row.overageUnitPrice),
      metadata: row.metadata,
    })),
    pricing: selectedPricing.map((row) => ({
      metric: row.metric,
      model: row.pricingModel,
      currency: row.currency,
      unitPrice: toBigInt(row.unitPrice),
      creditCostPerUnit: toBigInt(row.creditCostPerUnit),
      minimumCharge: toBigInt(row.minimumCharge),
      tiers: row.tiers,
      metadata: row.metadata,
    })),
  };
}

export function quoteRuntimeFeatureUsage(
  policy: RuntimeFeaturePolicy,
  quantity: bigint,
) {
  const safeQuantity = quantity < BigInt(0) ? BigInt(0) : quantity;
  const primaryPricing = policy.pricing[0];
  const creditCost = policy.resolved.creditCostPerUnit * safeQuantity;
  const rawMoneyCost = policy.resolved.moneyCostPerUnit * safeQuantity;
  const minimumCharge = primaryPricing?.minimumCharge ?? BigInt(0);
  const moneyCost =
    rawMoneyCost > BigInt(0) && rawMoneyCost < minimumCharge
      ? minimumCharge
      : rawMoneyCost;

  return {
    allowed: policy.resolved.access === "allow",
    quantity: safeQuantity,
    creditCost,
    moneyCost,
    currency: primaryPricing?.currency ?? null,
    unlimited: policy.resolved.unlimited,
    limit: policy.resolved.limit,
  };
}
