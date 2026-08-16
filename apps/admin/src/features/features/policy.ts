export type AccessDecision = "allow" | "deny";

export interface OptionalFeaturePolicyInput {
  featureActive: boolean;
  defaultAccess?: AccessDecision | null;
  planInclusion?: boolean | null;
  limitValue?: bigint | number | null;
  pricingRuleActive?: boolean | null;
  creditCostPerUnit?: bigint | number | null;
  moneyCostPerUnit?: bigint | number | null;
}

export interface ResolvedFeaturePolicy {
  access: AccessDecision;
  accessSource: "feature_status" | "plan_override" | "feature_default" | "system_default";
  limit: bigint | null;
  unlimited: boolean;
  creditCostPerUnit: bigint;
  moneyCostPerUnit: bigint;
  free: boolean;
}

function nonNegativeBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return value >= BigInt(0) ? value : BigInt(0);
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return BigInt(Math.trunc(value));
  }
  return BigInt(0);
}

export function resolveOptionalFeaturePolicy(
  input: OptionalFeaturePolicyInput,
): ResolvedFeaturePolicy {
  let access: AccessDecision = "allow";
  let accessSource: ResolvedFeaturePolicy["accessSource"] = "system_default";

  if (!input.featureActive) {
    access = "deny";
    accessSource = "feature_status";
  } else if (input.planInclusion !== null && input.planInclusion !== undefined) {
    access = input.planInclusion ? "allow" : "deny";
    accessSource = "plan_override";
  } else if (input.defaultAccess) {
    access = input.defaultAccess;
    accessSource = "feature_default";
  }

  const limit =
    input.limitValue === null || input.limitValue === undefined
      ? null
      : nonNegativeBigInt(input.limitValue);
  const pricingEnabled = input.pricingRuleActive === true;
  const creditCostPerUnit = pricingEnabled
    ? nonNegativeBigInt(input.creditCostPerUnit)
    : BigInt(0);
  const moneyCostPerUnit = pricingEnabled
    ? nonNegativeBigInt(input.moneyCostPerUnit)
    : BigInt(0);

  return {
    access,
    accessSource,
    limit,
    unlimited: limit === null,
    creditCostPerUnit,
    moneyCostPerUnit,
    free:
      creditCostPerUnit === BigInt(0) &&
      moneyCostPerUnit === BigInt(0),
  };
}

export function readDefaultAccess(metadata: unknown): AccessDecision | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).defaultAccess;
  return value === "allow" || value === "deny" ? value : null;
}
