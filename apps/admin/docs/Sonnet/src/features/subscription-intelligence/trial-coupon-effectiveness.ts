// =============================================================================
// Trial / Coupon / Promotion Effectiveness Analysis
// -----------------------------------------------------------------------------
// Capability: analyzeTrialAndCouponEffectiveness
// Tables used: trials, subscriptions, coupons, coupon_redemptions,
//              subscription_discounts
// Metric definitions:
//   trialConversionRate = converted / (converted + expired + canceled)
//     — trials still `active` are excluded from the denominator because their
//     outcome is not yet known (avoids understating the rate mid-flight).
//   averageDaysToConvert = mean(convertedAt - startAt) over converted trials.
//   couponRetentionRate  = share of a coupon's redeemers whose subscription
//     is still in a non-churned status as of `now`.
// Explicit limitation: true "trial abuse" detection requires device/IP/email
// fingerprint data that is not present anywhere in the 38-table schema, so
// this module only reports structural signals (repeat trials per user,
// stale coupon status) rather than claiming to detect abuse rings.
// =============================================================================

import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { daysBetween } from "@/shared/date";
import { ZERO } from "@/shared/money";

export interface TrialEffectivenessReport {
  totalTrials: number;
  convertedCount: number;
  expiredCount: number;
  canceledCount: number;
  activeCount: number;
  conversionRate: number | null;
  averageDaysToConvert: number | null;
  usersWithMultipleTrials: UUID[];
}

export function analyzeTrialEffectiveness(dataset: IntelligenceDataset): TrialEffectivenessReport {
  const trialsByUser = new Map<UUID, number>();
  for (const trial of dataset.trials) {
    const subscription = dataset.subscriptions.find((s) => s.id === trial.subscriptionId);
    if (!subscription) continue;
    trialsByUser.set(subscription.userId, (trialsByUser.get(subscription.userId) ?? 0) + 1);
  }

  const convertedCount = dataset.trials.filter((t) => t.status === "converted").length;
  const expiredCount = dataset.trials.filter((t) => t.status === "expired").length;
  const canceledCount = dataset.trials.filter((t) => t.status === "canceled").length;
  const activeCount = dataset.trials.filter((t) => t.status === "active").length;

  const decidedCount = convertedCount + expiredCount + canceledCount;
  const conversionRate = decidedCount > 0 ? convertedCount / decidedCount : null;

  const convertedTrials = dataset.trials.filter((t) => t.status === "converted" && t.convertedAt);
  const averageDaysToConvert = convertedTrials.length > 0
    ? convertedTrials.reduce((sum, t) => sum + daysBetween(t.startAt, t.convertedAt as Date), 0) / convertedTrials.length
    : null;

  return {
    totalTrials: dataset.trials.length,
    convertedCount,
    expiredCount,
    canceledCount,
    activeCount,
    conversionRate,
    averageDaysToConvert,
    usersWithMultipleTrials: Array.from(trialsByUser.entries()).filter(([, count]) => count > 1).map(([userId]) => userId),
  };
}

export interface CouponEffectivenessLine {
  couponId: UUID;
  code: string;
  redemptionCount: number;
  totalDiscountGranted: string;
  currency: string | null;
  retainedRedeemers: number;
  churnedRedeemers: number;
  retentionRate: number | null;
  isTemporallyInvalid: boolean;
}

export function analyzeCouponEffectiveness(dataset: IntelligenceDataset, now: Date): CouponEffectivenessLine[] {
  return dataset.coupons.map((coupon) => {
    const redemptions = dataset.couponRedemptions.filter((r) => r.couponId === coupon.id);
    const currency = redemptions.find((r) => r.currency)?.currency ?? coupon.currency;
    const totalDiscount = redemptions.reduce((sum, r) => sum + (r.amountDiscounted ?? ZERO), ZERO);

    let retained = 0;
    let churned = 0;
    for (const redemption of redemptions) {
      if (!redemption.subscriptionId) continue;
      const subscription = dataset.subscriptions.find((s) => s.id === redemption.subscriptionId);
      if (!subscription) continue;
      if (subscription.status === "canceled" || subscription.status === "expired") churned += 1;
      else retained += 1;
    }
    const retentionRate = retained + churned > 0 ? retained / (retained + churned) : null;

    const isTemporallyInvalid = coupon.status === "active" && coupon.redeemBy !== null && coupon.redeemBy.getTime() < now.getTime();

    return {
      couponId: coupon.id,
      code: coupon.code,
      redemptionCount: redemptions.length,
      totalDiscountGranted: totalDiscount.toString(),
      currency,
      retainedRedeemers: retained,
      churnedRedeemers: churned,
      retentionRate,
      isTemporallyInvalid,
    };
  });
}
