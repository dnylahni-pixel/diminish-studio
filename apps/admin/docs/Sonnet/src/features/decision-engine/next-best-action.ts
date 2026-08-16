// =============================================================================
// Next Best Action Engine
// -----------------------------------------------------------------------------
// Capability: recommendNextBestAction
// Tables used: (via composed engines) subscriptions, trials, transactions,
//              payment_methods, usage_daily_aggregates, plan_limits,
//              credit_accounts, plan_change_rules
// Problem solved: turns the outputs of the health-score, quota-saturation,
// and credit-runway engines into one ranked recommendation per subscription,
// with an explicit reason trail and confidence — not just a risk number.
// This is a rule-based decision table, not a trained model; every rule and
// its priority is declared inline and is the single place to tune them.
// =============================================================================

import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { scoreSubscriptionHealth } from "@/features/subscription-intelligence/health-score";
import { calculateQuotaSaturation } from "@/features/usage-intelligence/anomaly-and-saturation";
import { calculateCreditBurnRateAndRunway } from "@/features/credit-intelligence/burn-rate-runway";
import type { ExplainableResult, ReasonedFinding } from "@/shared/reason-code";

export type NextBestActionType =
  | "DUNNING_OUTREACH"
  | "CONVERT_TRIAL_OUTREACH"
  | "RETENTION_OUTREACH"
  | "RECOMMEND_UPGRADE"
  | "RECOMMEND_CREDIT_TOPUP"
  | "NO_ACTION_HEALTHY";

export interface NextBestActionRecommendation {
  subscriptionId: UUID;
  userId: UUID;
  action: NextBestActionType;
  priorityScore: number;
}

export function recommendNextBestAction(
  dataset: IntelligenceDataset,
  subscriptionId: UUID,
  now: Date,
): ExplainableResult<string, NextBestActionRecommendation> {
  const subscription = dataset.subscriptions.find((row) => row.id === subscriptionId);
  if (!subscription) {
    return {
      payload: { subscriptionId, userId: "" as UUID, action: "NO_ACTION_HEALTHY", priorityScore: 0 },
      reasons: [{ code: "NOT_FOUND", severity: "critical", messageFa: "اشتراک یافت نشد.", weight: 1 }],
      confidence: "low",
      dataSufficiency: "insufficient",
    };
  }

  const reasons: ReasonedFinding[] = [];
  const candidates: { action: NextBestActionType; priorityScore: number }[] = [];

  const health = scoreSubscriptionHealth(dataset, subscriptionId, now);
  reasons.push(...health.reasons.filter((r) => r.code !== "HEALTHY_BASELINE"));

  const hasRecentFailure = health.reasons.some((r) => r.code === "RECENT_PAYMENT_FAILURE");
  if (subscription.status === "past_due" || hasRecentFailure) {
    candidates.push({ action: "DUNNING_OUTREACH", priorityScore: 95 });
  }

  const trial = dataset.trials.find((row) => row.subscriptionId === subscriptionId);
  if (trial && trial.status === "active") {
    candidates.push({ action: "CONVERT_TRIAL_OUTREACH", priorityScore: 80 });
  }

  if (health.payload.riskLevel === "high" || health.payload.riskLevel === "critical") {
    candidates.push({ action: "RETENTION_OUTREACH", priorityScore: 70 });
  }

  const quotaLimit = dataset.planLimits.find((limit) => limit.planVersionId === subscription.planVersionId && limit.limitType === "quota");
  if (quotaLimit) {
    const series = dataset.usageDailyAggregates.filter((row) => row.subscriptionId === subscriptionId && row.featureId === quotaLimit.featureId);
    if (series.length > 0) {
      const saturation = calculateQuotaSaturation(series, quotaLimit, subscription.currentPeriodStart, subscription.currentPeriodEnd, now, {
        subscriptionId,
        featureId: quotaLimit.featureId,
      });
      if (saturation.saturationLevel === "at-risk" || saturation.saturationLevel === "exceeded") {
        reasons.push({
          code: "QUOTA_SATURATION",
          severity: saturation.saturationLevel === "exceeded" ? "critical" : "warning",
          messageFa: `مصرف پیش‌بینی‌شده تا پایان دوره (${Math.round(saturation.projectedEndOfCycleUsage ?? 0)}) از سقف مجاز (${saturation.quotaLimit}) عبور می‌کند.`,
          weight: 1,
        });
        candidates.push({ action: "RECOMMEND_UPGRADE", priorityScore: 60 });
      }
    }
  }

  const creditAccount = dataset.creditAccounts.find((account) => account.userId === subscription.userId && account.currency === subscription.currency);
  if (creditAccount) {
    const burnRate = calculateCreditBurnRateAndRunway(dataset, creditAccount.id, now);
    if (burnRate.runwayLabel === "critical") {
      reasons.push({ code: "CREDIT_RUNWAY_CRITICAL", severity: "critical", messageFa: `اعتبار باقی‌مانده با نرخ مصرف فعلی کمتر از ۱۰ روز دوام می‌آورد.`, weight: 1 });
      candidates.push({ action: "RECOMMEND_CREDIT_TOPUP", priorityScore: 65 });
    }
  }

  if (candidates.length === 0) {
    candidates.push({ action: "NO_ACTION_HEALTHY", priorityScore: 0 });
    reasons.push({ code: "HEALTHY_BASELINE", severity: "info", messageFa: "هیچ اقدام فوری لازم نیست؛ وضعیت اشتراک سالم است.", weight: 0 });
  }

  const best = candidates.sort((a, b) => b.priorityScore - a.priorityScore)[0];

  return {
    payload: { subscriptionId, userId: subscription.userId, action: best.action, priorityScore: best.priorityScore },
    reasons,
    confidence: reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low",
    dataSufficiency: "sufficient",
  };
}
