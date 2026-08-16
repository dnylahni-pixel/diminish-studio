// =============================================================================
// MRR Waterfall & Revenue Movement Engine
// -----------------------------------------------------------------------------
// Capability: calculateMonthlyRecurringRevenueWaterfall
// Tables used: subscriptions, subscription_periods, plan_versions,
//              plan_prices, subscription_addons, addon_prices
// Metric grain: one row per (user, currency, month). MRR is normalized to a
// monthly amount: `year` interval prices are divided by 12; `month` interval
// prices are used as-is. `week`/`day` interval plans are excluded from MRR
// with an explicit caveat (see docs/formulas-and-kpis.md) because a
// month-normalized rate for sub-monthly billing is not defined by the brief.
// Inclusion rule: only `subscription_periods` with status in
// ('current','closed') count as "billed" for a month; `trialing` and
// `voided`/`upcoming` periods contribute zero MRR. Currencies are NEVER
// summed together — the waterfall is always computed per single currency.
// Consumer: revenue-intelligence UI tab, decision-engine profitability proxy.
// =============================================================================

import type { IntelligenceDataset, PlanVersionRow, SubscriptionAddonRow, UUID } from "@/shared/dataset-types";
import { monthKey } from "@/shared/date";
import { ZERO, type CurrencyCode, type MinorUnitAmount } from "@/shared/money";

export type MrrMovementType = "new" | "expansion" | "contraction" | "reactivation" | "churn" | "flat";

export interface MrrMovementLine {
  userId: UUID;
  subscriptionId: UUID | null;
  movementType: MrrMovementType;
  previousAmount: string;
  currentAmount: string;
  deltaAmount: string;
}

export interface MrrWaterfallResult {
  currency: CurrencyCode;
  previousMonth: string;
  currentMonth: string;
  startingMrr: string;
  endingMrr: string;
  totalsByMovement: Record<MrrMovementType, string>;
  lines: MrrMovementLine[];
  caveats: string[];
}

function normalizeMonthlyAmount(planVersion: PlanVersionRow, unitAmount: bigint): bigint | null {
  if (planVersion.billingIntervalUnit === "month" && planVersion.billingIntervalCount === 1) return unitAmount;
  if (planVersion.billingIntervalUnit === "year" && planVersion.billingIntervalCount === 1) return unitAmount / BigInt(12);
  return null; // week/day or multi-interval plans are excluded — see module caveat.
}

function activeAddonMonthlyTotal(
  dataset: IntelligenceDataset,
  subscriptionId: UUID,
  currency: CurrencyCode,
  atDate: Date,
): bigint {
  const addonRows: SubscriptionAddonRow[] = dataset.subscriptionAddons.filter(
    (row) => row.subscriptionId === subscriptionId && row.status === "active" && row.startAt <= atDate && (row.endAt === null || row.endAt > atDate),
  );
  let total = ZERO;
  for (const addonRow of addonRows) {
    const price = dataset.addonPrices.find((p) => p.addonId === addonRow.addonId && p.currency === currency && p.billingIntervalUnit === "month");
    if (price) total += price.unitAmount * BigInt(addonRow.quantity);
  }
  return total;
}

/** Recurring monthly amount per user for a given month & currency, summed across all of that user's subscriptions active that month. */
function monthlyRecurringByUser(
  dataset: IntelligenceDataset,
  targetMonthKey: string,
  currency: CurrencyCode,
  caveats: Set<string>,
): Map<UUID, { amount: MinorUnitAmount; subscriptionId: UUID }> {
  const planVersionById = new Map(dataset.planVersions.map((pv) => [pv.id, pv]));
  const result = new Map<UUID, { amount: MinorUnitAmount; subscriptionId: UUID }>();

  for (const period of dataset.subscriptionPeriods) {
    if (period.status !== "current" && period.status !== "closed") continue;
    if (monthKey(period.periodStart) !== targetMonthKey) continue;

    const subscription = dataset.subscriptions.find((s) => s.id === period.subscriptionId);
    if (!subscription || subscription.currency !== currency) continue;
    if (subscription.status === "trialing") continue;

    const planVersion = planVersionById.get(period.planVersionId);
    if (!planVersion) continue;
    const price = dataset.planPrices.find((p) => p.planVersionId === period.planVersionId && p.currency === currency);
    if (!price) continue;

    const normalized = normalizeMonthlyAmount(planVersion, price.unitAmount);
    if (normalized === null) {
      caveats.add(`پلن با دوره صورتحساب ${planVersion.billingIntervalUnit} از محاسبه MRR ماهانه مستثنی شد (تعریف نشده در این نسخه).`);
      continue;
    }

    const addonMonthly = activeAddonMonthlyTotal(dataset, subscription.id, currency, period.periodStart);
    const total = normalized + addonMonthly;
    const existing = result.get(subscription.userId);
    result.set(subscription.userId, { amount: (existing?.amount ?? ZERO) + total, subscriptionId: subscription.id });
  }

  return result;
}

export function calculateMonthlyRecurringRevenueWaterfall(
  dataset: IntelligenceDataset,
  currency: CurrencyCode,
  previousMonthKey: string,
  currentMonthKeyValue: string,
): MrrWaterfallResult {
  const caveats = new Set<string>();
  const previous = monthlyRecurringByUser(dataset, previousMonthKey, currency, caveats);
  const current = monthlyRecurringByUser(dataset, currentMonthKeyValue, currency, caveats);

  // A user is eligible for "reactivation" only if they had non-zero MRR in
  // some month strictly before `previousMonthKey` (i.e. they are a lapsed
  // customer returning), not merely a first-time signup.
  const usersWithHistoryBeforePrevious = new Set<UUID>();
  for (const period of dataset.subscriptionPeriods) {
    if (period.status !== "current" && period.status !== "closed") continue;
    if (monthKey(period.periodStart) >= previousMonthKey) continue;
    const subscription = dataset.subscriptions.find((s) => s.id === period.subscriptionId);
    if (subscription && subscription.currency === currency) {
      usersWithHistoryBeforePrevious.add(subscription.userId);
    }
  }

  const allUserIds = new Set<UUID>([...previous.keys(), ...current.keys()]);
  const lines: MrrMovementLine[] = [];
  const totals: Record<MrrMovementType, bigint> = { new: ZERO, expansion: ZERO, contraction: ZERO, reactivation: ZERO, churn: ZERO, flat: ZERO };

  for (const userId of allUserIds) {
    const prev = previous.get(userId)?.amount ?? ZERO;
    const curr = current.get(userId)?.amount ?? ZERO;
    const subscriptionId = current.get(userId)?.subscriptionId ?? previous.get(userId)?.subscriptionId ?? null;
    let movementType: MrrMovementType;
    let delta: bigint;

    if (prev === ZERO && curr > ZERO) {
      movementType = usersWithHistoryBeforePrevious.has(userId) ? "reactivation" : "new";
      delta = curr;
    } else if (prev > ZERO && curr === ZERO) {
      movementType = "churn";
      delta = -prev;
    } else if (curr > prev) {
      movementType = "expansion";
      delta = curr - prev;
    } else if (curr < prev) {
      movementType = "contraction";
      delta = curr - prev;
    } else {
      movementType = "flat";
      delta = ZERO;
    }

    totals[movementType] += movementType === "new" || movementType === "reactivation" ? curr : movementType === "churn" ? -prev : delta;
    lines.push({ userId, subscriptionId, movementType, previousAmount: prev.toString(), currentAmount: curr.toString(), deltaAmount: delta.toString() });
  }

  const startingMrr = Array.from(previous.values()).reduce((sum, v) => sum + v.amount, ZERO);
  const endingMrr = Array.from(current.values()).reduce((sum, v) => sum + v.amount, ZERO);

  return {
    currency,
    previousMonth: previousMonthKey,
    currentMonth: currentMonthKeyValue,
    startingMrr: startingMrr.toString(),
    endingMrr: endingMrr.toString(),
    totalsByMovement: {
      new: totals.new.toString(),
      expansion: totals.expansion.toString(),
      contraction: totals.contraction.toString(),
      reactivation: totals.reactivation.toString(),
      churn: totals.churn.toString(),
      flat: totals.flat.toString(),
    },
    lines: lines.sort((a, b) => a.movementType.localeCompare(b.movementType)),
    caveats: Array.from(caveats),
  };
}
