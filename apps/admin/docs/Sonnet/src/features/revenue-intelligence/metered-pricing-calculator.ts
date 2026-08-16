// =============================================================================
// Metered Feature Pricing Calculator (flat / tiered / volume)
// -----------------------------------------------------------------------------
// Capability: calculateMeteredFeatureCharge
// Tables used: feature_pricing_rules (`tiers` JSONB)
// Problem solved: `feature_pricing_rules.tiers` is opaque JSONB; nothing in
// the schema evaluates it. This calculator is the single place that turns a
// tier definition + a usage quantity into a minor-unit charge, so invoice
// simulation, revenue-leakage detection, and the what-if pricing sandbox in
// the UI all agree on one arithmetic implementation.
// Tier semantics:
//   - "flat": tiers[0] is used for every unit; `flatAmount` is a one-time fee,
//     `unitAmount` is charged per unit, regardless of the `upTo` boundaries.
//   - "tiered" (graduated): quantity is split across ascending tiers; each
//     tier is charged only for the portion of quantity that falls inside it.
//   - "volume": the *entire* quantity is charged at the single tier rate that
//     contains the total quantity (a step function, not graduated).
// `upTo: null` marks the final, unbounded tier. Tiers must be provided sorted
// ascending by `upTo` (null last); this function validates that invariant.
// =============================================================================

import { roundToMinorUnit } from "@/shared/money";
import type { FeaturePricingRuleRow, PricingTier } from "@/shared/dataset-types";

export class InvalidPricingTiersError extends Error {}

function assertTiersAreSorted(tiers: PricingTier[]): void {
  let lastUpTo = -Infinity;
  for (let i = 0; i < tiers.length; i += 1) {
    const upTo = tiers[i].upTo === null ? Infinity : Number(tiers[i].upTo);
    if (tiers[i].upTo === null && i !== tiers.length - 1) {
      throw new InvalidPricingTiersError("The unbounded tier (upTo: null) must be the last tier.");
    }
    if (upTo <= lastUpTo) {
      throw new InvalidPricingTiersError("Tiers must be strictly ascending by upTo.");
    }
    lastUpTo = upTo;
  }
}

export interface MeteredChargeBreakdownLine {
  tierIndex: number;
  unitsInTier: number;
  unitAmount: string;
  tierCharge: string;
}

export interface MeteredChargeResult {
  totalCharge: bigint;
  breakdown: MeteredChargeBreakdownLine[];
}

export function calculateMeteredFeatureCharge(rule: FeaturePricingRuleRow, quantity: number): MeteredChargeResult {
  if (quantity < 0) throw new InvalidPricingTiersError("quantity must be non-negative");
  assertTiersAreSorted(rule.tiers);

  if (rule.tiers.length === 0) {
    return { totalCharge: BigInt(0), breakdown: [] };
  }

  if (rule.pricingModel === "flat") {
    const tier = rule.tiers[0];
    const charge = roundToMinorUnit(Number(tier.flatAmount)) + roundToMinorUnit(Number(tier.unitAmount) * quantity);
    return {
      totalCharge: charge,
      breakdown: [{ tierIndex: 0, unitsInTier: quantity, unitAmount: tier.unitAmount, tierCharge: charge.toString() }],
    };
  }

  if (rule.pricingModel === "volume") {
    const tierIndex = rule.tiers.findIndex((tier) => tier.upTo === null || quantity <= Number(tier.upTo));
    const resolvedIndex = tierIndex === -1 ? rule.tiers.length - 1 : tierIndex;
    const tier = rule.tiers[resolvedIndex];
    const charge = roundToMinorUnit(Number(tier.flatAmount)) + roundToMinorUnit(Number(tier.unitAmount) * quantity);
    return {
      totalCharge: charge,
      breakdown: [{ tierIndex: resolvedIndex, unitsInTier: quantity, unitAmount: tier.unitAmount, tierCharge: charge.toString() }],
    };
  }

  // "tiered" (graduated)
  let remaining = quantity;
  let previousBoundary = 0;
  let total = BigInt(0);
  const breakdown: MeteredChargeBreakdownLine[] = [];

  for (let i = 0; i < rule.tiers.length && remaining > 0; i += 1) {
    const tier = rule.tiers[i];
    const boundary = tier.upTo === null ? Infinity : Number(tier.upTo);
    const capacityInTier = boundary - previousBoundary;
    const unitsInTier = Math.min(remaining, capacityInTier);
    if (unitsInTier > 0) {
      const tierCharge = roundToMinorUnit(Number(tier.flatAmount)) + roundToMinorUnit(Number(tier.unitAmount) * unitsInTier);
      total += tierCharge;
      breakdown.push({ tierIndex: i, unitsInTier, unitAmount: tier.unitAmount, tierCharge: tierCharge.toString() });
      remaining -= unitsInTier;
    }
    previousBoundary = boundary;
  }

  return { totalCharge: total, breakdown };
}
