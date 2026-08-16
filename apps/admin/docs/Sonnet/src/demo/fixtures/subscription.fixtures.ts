// =============================================================================
// Demo Mode — Users & subscription lifecycle fixtures
// -----------------------------------------------------------------------------
// Encodes nine subscriptions covering: new, expansion (upgrade), contraction
// (downgrade), full churn, reactivation after churn, trialing (unconverted),
// past_due with event/state drift, a stuck schedule, and one true zero-data
// account. This is the backbone dataset for subscription & revenue engines.
// =============================================================================

import type {
  SubscriptionAddonRow,
  SubscriptionDiscountRow,
  SubscriptionEventRow,
  SubscriptionPeriodRow,
  SubscriptionRow,
  SubscriptionScheduleRow,
  TrialRow,
  UserRow,
} from "@/shared/dataset-types";
import { IDS, PERIOD_M0_END, PERIOD_M0_START, PERIOD_M1_END, PERIOD_M1_START, PERIOD_M2_END, PERIOD_M2_START } from "./ids";

export const USERS: UserRow[] = [
  { id: IDS.users.u1, email: "u1@example.com", fullName: "سارا احمدی", status: "active", acquisitionSource: "organic", createdAt: new Date("2025-09-01T00:00:00Z") },
  { id: IDS.users.u2, email: "u2@example.com", fullName: "رضا کریمی", status: "active", acquisitionSource: "referral", createdAt: new Date("2025-12-01T00:00:00Z") },
  { id: IDS.users.u3, email: "u3@example.com", fullName: "مریم حسینی", status: "active", acquisitionSource: "partner", createdAt: new Date("2025-07-01T00:00:00Z") },
  { id: IDS.users.u4, email: "u4@example.com", fullName: "علی نوری", status: "active", acquisitionSource: "ads", createdAt: new Date("2025-10-01T00:00:00Z") },
  { id: IDS.users.u5, email: "u5@example.com", fullName: "نگار صادقی", status: "active", acquisitionSource: "organic", createdAt: new Date("2026-01-10T00:00:00Z") },
  { id: IDS.users.u6, email: "u6@example.com", fullName: "امیر رستمی", status: "active", acquisitionSource: "ads", createdAt: new Date("2025-11-01T00:00:00Z") },
  { id: IDS.users.u7, email: "u7@example.com", fullName: "لیلا محمدی", status: "active", acquisitionSource: "organic", createdAt: new Date("2025-10-01T00:00:00Z") },
  { id: IDS.users.u8, email: "u8@example.com", fullName: "حسین قاسمی", status: "active", acquisitionSource: "referral", createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: IDS.users.u9, email: "u9@example.com", fullName: "فاطمه یوسفی", status: "active", acquisitionSource: "partner", createdAt: new Date("2025-11-01T00:00:00Z") },
];

export const SUBSCRIPTIONS: SubscriptionRow[] = [
  { id: IDS.subscriptions.s1, userId: IDS.users.u1, planVersionId: IDS.planVersions.proV2, status: "active", currency: "USD", startAt: new Date("2025-09-14T00:00:00Z"), currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s2, userId: IDS.users.u2, planVersionId: IDS.planVersions.starterV1, status: "active", currency: "USD", startAt: PERIOD_M1_START, currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s3, userId: IDS.users.u3, planVersionId: IDS.planVersions.enterpriseV1, status: "active", currency: "IRR", startAt: new Date("2025-07-01T00:00:00Z"), currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s4, userId: IDS.users.u4, planVersionId: IDS.planVersions.proV2, status: "past_due", currency: "USD", startAt: new Date("2025-10-01T00:00:00Z"), currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s5, userId: IDS.users.u5, planVersionId: IDS.planVersions.starterV1, status: "trialing", currency: "USD", startAt: new Date("2026-01-10T00:00:00Z"), currentPeriodStart: new Date("2026-01-10T00:00:00Z"), currentPeriodEnd: new Date("2026-01-18T00:00:00Z"), cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s6, userId: IDS.users.u6, planVersionId: IDS.planVersions.proV2, status: "canceled", currency: "USD", startAt: new Date("2025-11-01T00:00:00Z"), currentPeriodStart: PERIOD_M1_START, currentPeriodEnd: PERIOD_M1_END, cancelAt: PERIOD_M1_END, canceledAt: new Date("2026-01-01T00:00:00Z"), endedAt: new Date("2026-01-01T00:00:00Z") },
  { id: IDS.subscriptions.s7a, userId: IDS.users.u7, planVersionId: IDS.planVersions.starterV1, status: "canceled", currency: "USD", startAt: new Date("2025-10-01T00:00:00Z"), currentPeriodStart: PERIOD_M2_START, currentPeriodEnd: PERIOD_M2_END, cancelAt: PERIOD_M2_END, canceledAt: new Date("2025-12-01T00:00:00Z"), endedAt: new Date("2025-12-01T00:00:00Z") },
  { id: IDS.subscriptions.s7b, userId: IDS.users.u7, planVersionId: IDS.planVersions.starterV1, status: "active", currency: "USD", startAt: PERIOD_M0_START, currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s8, userId: IDS.users.u8, planVersionId: IDS.planVersions.starterV1, status: "active", currency: "USD", startAt: PERIOD_M0_START, currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
  { id: IDS.subscriptions.s9, userId: IDS.users.u9, planVersionId: IDS.planVersions.starterV1, status: "active", currency: "USD", startAt: new Date("2025-11-01T00:00:00Z"), currentPeriodStart: PERIOD_M0_START, currentPeriodEnd: PERIOD_M0_END, cancelAt: null, canceledAt: null, endedAt: null },
];

export const SUBSCRIPTION_PERIODS: SubscriptionPeriodRow[] = [
  // s1: starter (M-2) -> pro (M-1, M0) = expansion in M-1
  { id: "sp00000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s1, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000003", subscriptionId: IDS.subscriptions.s1, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
  // s2: new in M-1
  { id: "sp00000-0000-4000-8000-000000000004", subscriptionId: IDS.subscriptions.s2, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000005", subscriptionId: IDS.subscriptions.s2, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
  // s3: flat enterprise, IRR
  { id: "sp00000-0000-4000-8000-000000000006", subscriptionId: IDS.subscriptions.s3, planVersionId: IDS.planVersions.enterpriseV1, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000007", subscriptionId: IDS.subscriptions.s3, planVersionId: IDS.planVersions.enterpriseV1, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000008", subscriptionId: IDS.subscriptions.s3, planVersionId: IDS.planVersions.enterpriseV1, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
  // s4: flat pro, unpaid current period (past_due)
  { id: "sp00000-0000-4000-8000-000000000009", subscriptionId: IDS.subscriptions.s4, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000010", subscriptionId: IDS.subscriptions.s4, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000011", subscriptionId: IDS.subscriptions.s4, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
  // s6: starter (M-2) -> pro (M-1), churned before M0 => full churn contribution in M0
  { id: "sp00000-0000-4000-8000-000000000012", subscriptionId: IDS.subscriptions.s6, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000013", subscriptionId: IDS.subscriptions.s6, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  // s7a: churned after M-2 (present M-2, absent M-1)
  { id: "sp00000-0000-4000-8000-000000000014", subscriptionId: IDS.subscriptions.s7a, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  // s7b: reactivated in M0 (absent M-1, present M0, same user as s7a)
  { id: "sp00000-0000-4000-8000-000000000015", subscriptionId: IDS.subscriptions.s7b, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
  // s8: intentionally zero periods (zero-data edge case)
  // s9: pro (M-2) -> starter (M-1, M0) = contraction in M-1
  { id: "sp00000-0000-4000-8000-000000000016", subscriptionId: IDS.subscriptions.s9, planVersionId: IDS.planVersions.proV2, periodStart: PERIOD_M2_START, periodEnd: PERIOD_M2_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000017", subscriptionId: IDS.subscriptions.s9, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M1_START, periodEnd: PERIOD_M1_END, status: "closed" },
  { id: "sp00000-0000-4000-8000-000000000018", subscriptionId: IDS.subscriptions.s9, planVersionId: IDS.planVersions.starterV1, periodStart: PERIOD_M0_START, periodEnd: PERIOD_M0_END, status: "current" },
];

export const SUBSCRIPTION_EVENTS: SubscriptionEventRow[] = [
  { id: "se000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, eventType: "created", fromStatus: null, toStatus: "trialing", metadata: null, occurredAt: new Date("2025-09-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s1, eventType: "trial_converted", fromStatus: "trialing", toStatus: "active", metadata: null, occurredAt: new Date("2025-09-14T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000003", subscriptionId: IDS.subscriptions.s1, eventType: "paused", fromStatus: "active", toStatus: "paused", metadata: null, occurredAt: new Date("2025-10-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000004", subscriptionId: IDS.subscriptions.s1, eventType: "resumed", fromStatus: "paused", toStatus: "active", metadata: null, occurredAt: new Date("2025-10-15T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000005", subscriptionId: IDS.subscriptions.s1, eventType: "discount_applied", fromStatus: "active", toStatus: "active", metadata: { couponCode: "WELCOME10" }, occurredAt: new Date("2025-12-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000006", subscriptionId: IDS.subscriptions.s1, eventType: "plan_changed", fromStatus: "active", toStatus: "active", metadata: { fromPlanVersionId: IDS.planVersions.starterV1, toPlanVersionId: IDS.planVersions.proV2 }, occurredAt: new Date("2025-12-01T00:00:00Z") },

  { id: "se000000-0000-4000-8000-000000000010", subscriptionId: IDS.subscriptions.s2, eventType: "created", fromStatus: null, toStatus: "active", metadata: null, occurredAt: PERIOD_M1_START },

  { id: "se000000-0000-4000-8000-000000000020", subscriptionId: IDS.subscriptions.s4, eventType: "created", fromStatus: null, toStatus: "active", metadata: null, occurredAt: new Date("2025-10-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000021", subscriptionId: IDS.subscriptions.s4, eventType: "renewed", fromStatus: "active", toStatus: "active", metadata: null, occurredAt: PERIOD_M1_START },
  // NOTE: no `payment_failed` event exists even though subscriptions.status is
  // currently "past_due" for s4 — this is the intentional event/state drift.

  { id: "se000000-0000-4000-8000-000000000030", subscriptionId: IDS.subscriptions.s6, eventType: "created", fromStatus: null, toStatus: "active", metadata: null, occurredAt: new Date("2025-11-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000031", subscriptionId: IDS.subscriptions.s6, eventType: "plan_changed", fromStatus: "active", toStatus: "active", metadata: { fromPlanVersionId: IDS.planVersions.starterV1, toPlanVersionId: IDS.planVersions.proV2 }, occurredAt: PERIOD_M1_START },
  { id: "se000000-0000-4000-8000-000000000032", subscriptionId: IDS.subscriptions.s6, eventType: "canceled", fromStatus: "active", toStatus: "canceled", metadata: null, occurredAt: new Date("2026-01-01T00:00:00Z") },

  { id: "se000000-0000-4000-8000-000000000040", subscriptionId: IDS.subscriptions.s7a, eventType: "created", fromStatus: null, toStatus: "active", metadata: null, occurredAt: new Date("2025-10-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000041", subscriptionId: IDS.subscriptions.s7a, eventType: "canceled", fromStatus: "active", toStatus: "canceled", metadata: null, occurredAt: new Date("2025-12-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000042", subscriptionId: IDS.subscriptions.s7b, eventType: "created", fromStatus: null, toStatus: "active", metadata: { reactivationOfSubscriptionId: IDS.subscriptions.s7a }, occurredAt: PERIOD_M0_START },

  { id: "se000000-0000-4000-8000-000000000050", subscriptionId: IDS.subscriptions.s9, eventType: "created", fromStatus: null, toStatus: "active", metadata: null, occurredAt: new Date("2025-11-01T00:00:00Z") },
  { id: "se000000-0000-4000-8000-000000000051", subscriptionId: IDS.subscriptions.s9, eventType: "plan_changed", fromStatus: "active", toStatus: "active", metadata: { fromPlanVersionId: IDS.planVersions.proV2, toPlanVersionId: IDS.planVersions.starterV1 }, occurredAt: PERIOD_M1_START },
];

export const SUBSCRIPTION_SCHEDULES: SubscriptionScheduleRow[] = [
  { id: "ss000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s2, scheduleType: "plan_change", targetPlanVersionId: IDS.planVersions.proV2, effectiveAt: new Date("2026-02-01T00:00:00Z"), status: "pending", executedAt: null },
  // Intentional: stuck schedule — effectiveAt is well in the past but still "pending".
  { id: "ss000000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s9, scheduleType: "plan_change", targetPlanVersionId: IDS.planVersions.proV2, effectiveAt: new Date("2025-12-20T00:00:00Z"), status: "pending", executedAt: null },
];

export const TRIALS: TrialRow[] = [
  { id: "tr000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, startAt: new Date("2025-09-01T00:00:00Z"), endAt: new Date("2025-09-14T00:00:00Z"), convertedAt: new Date("2025-09-14T00:00:00Z"), status: "converted" },
  { id: "tr000000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s5, startAt: new Date("2026-01-10T00:00:00Z"), endAt: new Date("2026-01-18T00:00:00Z"), convertedAt: null, status: "active" },
  { id: "tr000000-0000-4000-8000-000000000003", subscriptionId: IDS.subscriptions.s7a, startAt: new Date("2025-09-20T00:00:00Z"), endAt: new Date("2025-10-01T00:00:00Z"), convertedAt: null, status: "expired" },
];

export const SUBSCRIPTION_ADDONS: SubscriptionAddonRow[] = [
  { id: "sa000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, addonId: IDS.addons.extraSeats, quantity: 2, status: "active", startAt: PERIOD_M0_START, endAt: null },
];

export const SUBSCRIPTION_DISCOUNTS: SubscriptionDiscountRow[] = [
  { id: "sd000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, couponId: IDS.coupons.welcome10, appliedAt: new Date("2025-12-01T00:00:00Z"), expiresAt: new Date("2026-03-01T00:00:00Z"), status: "active" },
];
