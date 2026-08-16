// =============================================================================
// Subscription State Timeline Reconstruction + Health & Churn-Risk Engine
// -----------------------------------------------------------------------------
// Capabilities: reconstructSubscriptionStateTimeline, scoreSubscriptionHealth
// Tables used: subscriptions, subscription_events, subscription_schedules,
//              trials, payment_methods, transactions
// Problem solved: `subscriptions.status` is a single mutable column with no
// guarantee it agrees with the append-only `subscription_events` history.
// `scoreSubscriptionHealth` turns that plus payment/trial/schedule signals
// into one explainable 0-100 score with named reason codes instead of a
// black-box "risk: high/low" label — every point deducted is traceable.
// This is a documented heuristic scoring model, not a trained classifier;
// weights are fixed constants declared below and are the single place to
// tune them.
// =============================================================================

import type { IntelligenceDataset, SubscriptionEventRow, UUID } from "@/shared/dataset-types";
import { daysBetween } from "@/shared/date";
import type { ExplainableResult, ReasonedFinding } from "@/shared/reason-code";

export type SubscriptionRiskReasonCode =
  | "STATUS_PAST_DUE"
  | "EVENT_STATE_DRIFT"
  | "TRIAL_ENDING_SOON_UNCONVERTED"
  | "PAYMENT_METHOD_EXPIRED_OR_EXPIRING"
  | "STUCK_SCHEDULE"
  | "RECENT_PAYMENT_FAILURE"
  | "HEALTHY_BASELINE";

const RISK_WEIGHTS: Record<Exclude<SubscriptionRiskReasonCode, "HEALTHY_BASELINE">, number> = {
  STATUS_PAST_DUE: 35,
  EVENT_STATE_DRIFT: 15,
  TRIAL_ENDING_SOON_UNCONVERTED: 20,
  PAYMENT_METHOD_EXPIRED_OR_EXPIRING: 20,
  STUCK_SCHEDULE: 10,
  RECENT_PAYMENT_FAILURE: 25,
};

export interface SubscriptionStateTimelineReport {
  subscriptionId: UUID;
  orderedEvents: SubscriptionEventRow[];
  driftDetected: boolean;
  driftReasons: string[];
}

/**
 * Replays `subscription_events` in chronological order and checks that the
 * last recorded `toStatus` agrees with `subscriptions.status`, and that a
 * `past_due`/`canceled` current status is actually explained by some event.
 */
export function reconstructSubscriptionStateTimeline(dataset: IntelligenceDataset, subscriptionId: UUID): SubscriptionStateTimelineReport {
  const subscription = dataset.subscriptions.find((row) => row.id === subscriptionId);
  const orderedEvents = dataset.subscriptionEvents
    .filter((event) => event.subscriptionId === subscriptionId)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const driftReasons: string[] = [];
  if (!subscription) {
    return { subscriptionId, orderedEvents, driftDetected: true, driftReasons: ["اشتراک یافت نشد."] };
  }

  const lastEventWithToStatus = [...orderedEvents].reverse().find((event) => event.toStatus !== null);
  if (lastEventWithToStatus && lastEventWithToStatus.toStatus !== subscription.status) {
    driftReasons.push(
      `آخرین رویداد ثبت‌شده وضعیت را «${lastEventWithToStatus.toStatus}» اعلام می‌کند اما وضعیت فعلی رکورد «${subscription.status}» است.`,
    );
  }

  const explainedByEvent = orderedEvents.some((event) => event.toStatus === subscription.status);
  if (!explainedByEvent && subscription.status !== "trialing") {
    driftReasons.push(`هیچ رویدادی در تاریخچه، رسیدن به وضعیت فعلی «${subscription.status}» را ثبت نکرده است.`);
  }

  return { subscriptionId, orderedEvents, driftDetected: driftReasons.length > 0, driftReasons };
}

export interface SubscriptionHealthScore {
  subscriptionId: UUID;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export function scoreSubscriptionHealth(
  dataset: IntelligenceDataset,
  subscriptionId: UUID,
  now: Date,
): ExplainableResult<SubscriptionRiskReasonCode, SubscriptionHealthScore> {
  const subscription = dataset.subscriptions.find((row) => row.id === subscriptionId);
  if (!subscription) {
    return {
      payload: { subscriptionId, score: 0, riskLevel: "critical" },
      reasons: [{ code: "STATUS_PAST_DUE", severity: "critical", messageFa: "اشتراک یافت نشد.", weight: 1 }],
      confidence: "low",
      dataSufficiency: "insufficient",
    };
  }

  const reasons: ReasonedFinding<SubscriptionRiskReasonCode>[] = [];

  if (subscription.status === "past_due") {
    reasons.push({ code: "STATUS_PAST_DUE", severity: "critical", messageFa: "اشتراک در وضعیت past_due (پرداخت معوق) قرار دارد.", weight: RISK_WEIGHTS.STATUS_PAST_DUE });
  }

  const timeline = reconstructSubscriptionStateTimeline(dataset, subscriptionId);
  if (timeline.driftDetected) {
    reasons.push({
      code: "EVENT_STATE_DRIFT",
      severity: "warning",
      messageFa: `ناسازگاری بین وضعیت فعلی و تاریخچه رویدادها: ${timeline.driftReasons.join(" ")}`,
      weight: RISK_WEIGHTS.EVENT_STATE_DRIFT,
    });
  }

  const trial = dataset.trials.find((row) => row.subscriptionId === subscriptionId);
  if (trial && trial.status === "active") {
    const daysUntilTrialEnd = daysBetween(now, trial.endAt);
    if (daysUntilTrialEnd <= 5) {
      reasons.push({
        code: "TRIAL_ENDING_SOON_UNCONVERTED",
        severity: daysUntilTrialEnd <= 2 ? "critical" : "warning",
        messageFa: `دوره آزمایشی تا ${Math.max(0, Math.round(daysUntilTrialEnd))} روز دیگر بدون تبدیل به اشتراک پولی به پایان می‌رسد.`,
        weight: RISK_WEIGHTS.TRIAL_ENDING_SOON_UNCONVERTED,
      });
    }
  }

  const paymentMethod = dataset.paymentMethods.find((pm) => pm.userId === subscription.userId && pm.isDefault);
  if (paymentMethod && paymentMethod.expMonth && paymentMethod.expYear) {
    const expiry = new Date(Date.UTC(paymentMethod.expYear, paymentMethod.expMonth, 0));
    const daysUntilExpiry = daysBetween(now, expiry);
    if (daysUntilExpiry <= 45) {
      reasons.push({
        code: "PAYMENT_METHOD_EXPIRED_OR_EXPIRING",
        severity: daysUntilExpiry < 0 ? "critical" : "warning",
        messageFa: daysUntilExpiry < 0
          ? "روش پرداخت پیش‌فرض این کاربر قبلاً منقضی شده است."
          : `روش پرداخت پیش‌فرض تا ${Math.round(daysUntilExpiry)} روز دیگر منقضی می‌شود.`,
        weight: RISK_WEIGHTS.PAYMENT_METHOD_EXPIRED_OR_EXPIRING,
      });
    }
  }

  const stuckSchedules = dataset.subscriptionSchedules.filter(
    (schedule) => schedule.subscriptionId === subscriptionId && schedule.status === "pending" && schedule.effectiveAt < now,
  );
  if (stuckSchedules.length > 0) {
    reasons.push({
      code: "STUCK_SCHEDULE",
      severity: "warning",
      messageFa: `${stuckSchedules.length} زمان‌بندی معلق وجود دارد که زمان اجرای آن گذشته اما هنوز اجرا نشده است.`,
      weight: RISK_WEIGHTS.STUCK_SCHEDULE,
    });
  }

  const recentFailedTransaction = dataset.transactions.find(
    (t) => t.subscriptionId === subscriptionId && t.type === "charge" && t.status === "failed" && daysBetween(t.occurredAt, now) <= 14,
  );
  if (recentFailedTransaction) {
    reasons.push({
      code: "RECENT_PAYMENT_FAILURE",
      severity: "critical",
      messageFa: `یک تراکنش شارژ در ۱۴ روز اخیر با خطای «${recentFailedTransaction.failureReason ?? "نامشخص"}» ناموفق بوده است.`,
      weight: RISK_WEIGHTS.RECENT_PAYMENT_FAILURE,
    });
  }

  if (reasons.length === 0) {
    reasons.push({ code: "HEALTHY_BASELINE", severity: "info", messageFa: "هیچ نشانه ریسکی شناسایی نشد.", weight: 0 });
  }

  const totalPenalty = reasons.reduce((sum, reason) => sum + reason.weight, 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const riskLevel: SubscriptionHealthScore["riskLevel"] = score >= 80 ? "low" : score >= 55 ? "medium" : score >= 30 ? "high" : "critical";

  return {
    payload: { subscriptionId, score, riskLevel },
    reasons,
    confidence: reasons.length >= 2 ? "high" : "medium",
    dataSufficiency: dataset.subscriptionEvents.length > 0 ? "sufficient" : "partial",
  };
}
