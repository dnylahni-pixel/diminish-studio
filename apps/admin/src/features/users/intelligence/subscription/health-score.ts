import type { UserHealthSignals } from "../shared/dataset-types";
import type { ReasonedFinding } from "../shared/reason-code";

export type UserHealthReasonCode =
  | "SUBSCRIPTION_PAST_DUE"
  | "SUBSCRIPTION_PAUSED"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "OVERDUE_INVOICE"
  | "FAILED_PAYMENT"
  | "CREDIT_RUNWAY_CRITICAL"
  | "CREDIT_RUNWAY_WATCH"
  | "STORAGE_SATURATION"
  | "LOW_ACTIVITY";

export interface UserHealthResult {
  score: number;
  riskLevel: "healthy" | "watch" | "high" | "critical";
  reasons: ReasonedFinding<UserHealthReasonCode>[];
}

export function scoreUserHealth(signals: UserHealthSignals): UserHealthResult {
  let score = 100;
  const reasons: ReasonedFinding<UserHealthReasonCode>[] = [];

  if (signals.subscriptionStatus === "past_due") {
    score -= 35;
    reasons.push({
      code: "SUBSCRIPTION_PAST_DUE",
      severity: "critical",
      message: "The latest subscription is past due.",
      weight: 35,
    });
  } else if (signals.subscriptionStatus === "paused") {
    score -= 20;
    reasons.push({
      code: "SUBSCRIPTION_PAUSED",
      severity: "warning",
      message: "The latest subscription is paused.",
      weight: 20,
    });
  } else if (
    signals.subscriptionStatus === null ||
    ["canceled", "expired", "incomplete"].includes(signals.subscriptionStatus)
  ) {
    score -= 15;
    reasons.push({
      code: "NO_ACTIVE_SUBSCRIPTION",
      severity: "warning",
      message: "The account has no active commercial subscription.",
      weight: 15,
    });
  }

  if (signals.overdueInvoiceCount > 0) {
    const penalty = Math.min(30, signals.overdueInvoiceCount * 12);
    score -= penalty;
    reasons.push({
      code: "OVERDUE_INVOICE",
      severity: "critical",
      message: `${signals.overdueInvoiceCount} invoice(s) are overdue or uncollectible.`,
      weight: penalty,
    });
  } else if (signals.openInvoiceCount > 0) {
    score -= 5;
  }

  if (signals.failedPaymentCount > 0) {
    const penalty = Math.min(20, signals.failedPaymentCount * 7);
    score -= penalty;
    reasons.push({
      code: "FAILED_PAYMENT",
      severity: "warning",
      message: `${signals.failedPaymentCount} recent payment attempt(s) failed.`,
      weight: penalty,
    });
  }

  if (signals.runwayDays !== null && signals.runwayDays < 7) {
    score -= 20;
    reasons.push({
      code: "CREDIT_RUNWAY_CRITICAL",
      severity: "critical",
      message: "Available credit is projected to last less than 7 days.",
      weight: 20,
    });
  } else if (signals.runwayDays !== null && signals.runwayDays < 21) {
    score -= 10;
    reasons.push({
      code: "CREDIT_RUNWAY_WATCH",
      severity: "warning",
      message: "Available credit is projected to last less than 21 days.",
      weight: 10,
    });
  }

  if (signals.storageUtilization >= 0.9) {
    score -= 10;
    reasons.push({
      code: "STORAGE_SATURATION",
      severity: "warning",
      message: "Storage utilization is above 90%.",
      weight: 10,
    });
  }

  if (
    signals.daysSinceLastActivity !== null &&
    signals.daysSinceLastActivity > 45
  ) {
    score -= 10;
    reasons.push({
      code: "LOW_ACTIVITY",
      severity: "warning",
      message: "No commercial or usage activity was recorded in the last 45 days.",
      weight: 10,
    });
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const riskLevel =
    normalizedScore < 40
      ? "critical"
      : normalizedScore < 65
        ? "high"
        : normalizedScore < 80
          ? "watch"
          : "healthy";

  return { score: normalizedScore, riskLevel, reasons };
}
