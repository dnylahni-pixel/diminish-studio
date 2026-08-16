// =============================================================================
// Usage Anomaly & Quota Saturation Engine
// -----------------------------------------------------------------------------
// Capabilities: detectUsageAnomalies, calculateQuotaSaturation
// Tables used: usage_daily_aggregates (trend surface — raw usage_events is
// intentionally NOT scanned here per the brief's guidance to keep trend
// queries on the pre-aggregated table), plan_limits
// Method: robust z-score using median + MAD (median absolute deviation)
// instead of mean/stddev, because a single spike would otherwise inflate the
// mean and hide itself. This is a documented heuristic, not a trained model —
// no ML claim is made. A day is flagged anomalous when
// |value - median| / (1.4826 * MAD) > threshold (default 3.5, the commonly
// cited robust-z-score cutoff). If MAD is 0 (perfectly flat history) we fall
// back to a simple percentage-above-median rule to avoid dividing by zero.
// =============================================================================

import type { PlanLimitRow, UsageDailyAggregateRow, UUID } from "@/shared/dataset-types";
import { medianAbsoluteDeviation, median } from "@/shared/date";
import { safeDivide } from "@/shared/money";

const ROBUST_Z_SCORE_CONSTANT = 1.4826;

export interface UsageAnomalyPoint {
  usageDate: string;
  quantity: number;
  robustZScore: number | null;
  isAnomalous: boolean;
}

export interface UsageAnomalyReport {
  subscriptionId: UUID;
  featureId: UUID;
  medianDailyUsage: number;
  medianAbsoluteDeviation: number;
  anomalies: UsageAnomalyPoint[];
  method: "robust-z-score" | "percentage-above-median-fallback";
}

export function detectUsageAnomalies(
  series: UsageDailyAggregateRow[],
  options: { subscriptionId: UUID; featureId: UUID; threshold?: number } ,
): UsageAnomalyReport {
  const threshold = options.threshold ?? 3.5;
  const sorted = [...series].sort((a, b) => a.usageDate.localeCompare(b.usageDate));
  const values = sorted.map((row) => row.quantity);
  const centre = median(values);
  const mad = medianAbsoluteDeviation(values);

  const usesFallback = mad === 0;
  const anomalies: UsageAnomalyPoint[] = sorted.map((row) => {
    if (usesFallback) {
      const percentAboveMedian = centre === 0 ? (row.quantity > 0 ? Infinity : 0) : (row.quantity - centre) / centre;
      return { usageDate: row.usageDate, quantity: row.quantity, robustZScore: null, isAnomalous: percentAboveMedian > 2 };
    }
    const robustZScore = (row.quantity - centre) / (ROBUST_Z_SCORE_CONSTANT * mad);
    return { usageDate: row.usageDate, quantity: row.quantity, robustZScore, isAnomalous: Math.abs(robustZScore) > threshold };
  });

  return {
    subscriptionId: options.subscriptionId,
    featureId: options.featureId,
    medianDailyUsage: centre,
    medianAbsoluteDeviation: mad,
    anomalies,
    method: usesFallback ? "percentage-above-median-fallback" : "robust-z-score",
  };
}

export interface QuotaSaturationReport {
  subscriptionId: UUID;
  featureId: UUID;
  quotaLimit: string | null;
  consumedInCycle: number;
  utilizationRatio: number | null;
  saturationLevel: "unlimited" | "no-quota-defined" | "healthy" | "elevated" | "at-risk" | "exceeded";
  daysElapsedInCycle: number;
  daysRemainingInCycle: number;
  projectedEndOfCycleUsage: number | null;
  overageLikely: boolean;
}

export function calculateQuotaSaturation(
  series: UsageDailyAggregateRow[],
  limit: PlanLimitRow | undefined,
  cycleStart: Date,
  cycleEnd: Date,
  now: Date,
  context: { subscriptionId: UUID; featureId: UUID },
): QuotaSaturationReport {
  const inCycle = series.filter((row) => {
    const date = new Date(`${row.usageDate}T00:00:00.000Z`);
    return date >= cycleStart && date < cycleEnd;
  });
  const consumedInCycle = inCycle.reduce((sum, row) => sum + row.quantity, 0);

  const totalCycleDays = Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000)));
  const daysElapsedInCycle = Math.max(1, Math.min(totalCycleDays, Math.round((now.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000))));
  const daysRemainingInCycle = Math.max(0, totalCycleDays - daysElapsedInCycle);

  if (!limit || limit.limitValue === null) {
    return {
      subscriptionId: context.subscriptionId, featureId: limit?.featureId ?? context.featureId,
      quotaLimit: null, consumedInCycle,
      utilizationRatio: null,
      saturationLevel: limit ? "unlimited" : "no-quota-defined",
      daysElapsedInCycle, daysRemainingInCycle, projectedEndOfCycleUsage: null, overageLikely: false,
    };
  }

  const quota = Number(limit.limitValue);
  const utilizationRatio = safeDivide(consumedInCycle, quota);
  const dailyRate = consumedInCycle / daysElapsedInCycle;
  const projectedEndOfCycleUsage = dailyRate * totalCycleDays;
  const overageLikely = projectedEndOfCycleUsage > quota;

  let saturationLevel: QuotaSaturationReport["saturationLevel"];
  if (utilizationRatio === null) saturationLevel = "no-quota-defined";
  else if (utilizationRatio >= 1) saturationLevel = "exceeded";
  else if (overageLikely || utilizationRatio >= 0.85) saturationLevel = "at-risk";
  else if (utilizationRatio >= 0.6) saturationLevel = "elevated";
  else saturationLevel = "healthy";

  return {
    subscriptionId: context.subscriptionId, featureId: limit.featureId,
    quotaLimit: limit.limitValue.toString(), consumedInCycle, utilizationRatio, saturationLevel,
    daysElapsedInCycle, daysRemainingInCycle, projectedEndOfCycleUsage, overageLikely,
  };
}
