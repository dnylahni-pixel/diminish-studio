// =============================================================================
// Demo Mode — Credit wallet & usage metering fixtures
// -----------------------------------------------------------------------------
// Ledger semantics used consistently across this file (see
// docs/formulas-and-kpis.md "Credit ledger sign convention"):
//   grant     -> amount > 0, increases balance and lifetimeGranted
//   reserve   -> amount < 0, immediately decrements balance (a pessimistic
//                hold); credit_accounts.reservedBalance increases separately
//   capture   -> amount = 0 (money already left balance at reserve time);
//                increases lifetimeUsed, decreases reservedBalance
//   release   -> amount > 0, restores balance; decreases reservedBalance
//   expire    -> amount < 0, removes unused grant remainder from balance
//   refund    -> amount > 0, compensating entry for a prior capture
//   adjustment-> signed manual correction
//
// `credit_accounts.balance` must always equal `sum(credit_ledger.amount)` for
// that account. `credit_accounts.reservedBalance` must always equal
// `sum(credit_reservations.amount where status = 'held')`. Two accounts below
// (u1Usd, u4Usd) intentionally violate one of these invariants so the
// reconciliation engine has real breaks to report; u3Irr and u9Usd are clean.
// =============================================================================

import type {
  CreditAccountRow,
  CreditExpirationRow,
  CreditGrantRow,
  CreditLedgerRow,
  CreditPackagePriceRow,
  CreditPackageRow,
  CreditReservationRow,
  UsageDailyAggregateRow,
  UsageEventRow,
} from "@/shared/dataset-types";
import { IDS } from "./ids";

const GRANT_U1_DEC = "cg000000-0000-4000-8000-000000000001";
const GRANT_U1_JAN = "cg000000-0000-4000-8000-000000000002";
const GRANT_U3_NOV = "cg000000-0000-4000-8000-000000000003";
const GRANT_U3_DEC = "cg000000-0000-4000-8000-000000000004";
const GRANT_U3_JAN = "cg000000-0000-4000-8000-000000000005";
const GRANT_U4_OCT = "cg000000-0000-4000-8000-000000000006";
const GRANT_U4_NOV = "cg000000-0000-4000-8000-000000000007";
const GRANT_U4_DEC = "cg000000-0000-4000-8000-000000000008";
const GRANT_U9_PACKAGE = "cg000000-0000-4000-8000-000000000009";

export const CREDIT_ACCOUNTS: CreditAccountRow[] = [
  {
    // BROKEN: reservedBalance cached as 0 but reservation R4 is still "held"
    // for 200 — a stale-cache bug, not a balance bug (balance itself is correct).
    id: IDS.creditAccounts.u1Usd, userId: IDS.users.u1, currency: "USD",
    balance: BigInt(3300), reservedBalance: BigInt(0), lifetimeGranted: BigInt(10000), lifetimeUsed: BigInt(4500), status: "active",
  },
  {
    id: IDS.creditAccounts.u3Irr, userId: IDS.users.u3, currency: "IRR",
    balance: BigInt(2700000), reservedBalance: BigInt(0), lifetimeGranted: BigInt(6000000), lifetimeUsed: BigInt(3300000), status: "active",
  },
  {
    // BROKEN: cached balance (6500) does not equal the ledger-reconstructed
    // balance (7000) — a genuine ledger/cache drift, more severe than u1's.
    id: IDS.creditAccounts.u4Usd, userId: IDS.users.u4, currency: "USD",
    balance: BigInt(6500), reservedBalance: BigInt(1000), lifetimeGranted: BigInt(15000), lifetimeUsed: BigInt(7000), status: "active",
  },
  {
    id: IDS.creditAccounts.u9Usd, userId: IDS.users.u9, currency: "USD",
    balance: BigInt(800), reservedBalance: BigInt(0), lifetimeGranted: BigInt(1000), lifetimeUsed: BigInt(200), status: "active",
  },
];

export const CREDIT_GRANTS: CreditGrantRow[] = [
  { id: GRANT_U1_DEC, creditAccountId: IDS.creditAccounts.u1Usd, source: "plan_policy", amount: BigInt(5000), remainingAmount: BigInt(0), currency: "USD", grantedAt: new Date("2025-12-01T00:00:00Z"), expiresAt: new Date("2025-12-31T00:00:00Z"), status: "expired" },
  { id: GRANT_U1_JAN, creditAccountId: IDS.creditAccounts.u1Usd, source: "plan_policy", amount: BigInt(5000), remainingAmount: BigInt(3300), currency: "USD", grantedAt: new Date("2026-01-01T00:00:00Z"), expiresAt: new Date("2026-01-31T00:00:00Z"), status: "active" },

  { id: GRANT_U3_NOV, creditAccountId: IDS.creditAccounts.u3Irr, source: "plan_policy", amount: BigInt(2000000), remainingAmount: BigInt(0), currency: "IRR", grantedAt: new Date("2025-11-01T00:00:00Z"), expiresAt: new Date("2026-01-30T00:00:00Z"), status: "exhausted" },
  { id: GRANT_U3_DEC, creditAccountId: IDS.creditAccounts.u3Irr, source: "plan_policy", amount: BigInt(2000000), remainingAmount: BigInt(700000), currency: "IRR", grantedAt: new Date("2025-12-01T00:00:00Z"), expiresAt: new Date("2026-03-01T00:00:00Z"), status: "active" },
  { id: GRANT_U3_JAN, creditAccountId: IDS.creditAccounts.u3Irr, source: "plan_policy", amount: BigInt(2000000), remainingAmount: BigInt(2000000), currency: "IRR", grantedAt: new Date("2026-01-01T00:00:00Z"), expiresAt: new Date("2026-04-01T00:00:00Z"), status: "active" },

  { id: GRANT_U4_OCT, creditAccountId: IDS.creditAccounts.u4Usd, source: "plan_policy", amount: BigInt(5000), remainingAmount: BigInt(0), currency: "USD", grantedAt: new Date("2025-10-01T00:00:00Z"), expiresAt: new Date("2025-10-31T00:00:00Z"), status: "exhausted" },
  { id: GRANT_U4_NOV, creditAccountId: IDS.creditAccounts.u4Usd, source: "plan_policy", amount: BigInt(5000), remainingAmount: BigInt(2000), currency: "USD", grantedAt: new Date("2025-11-01T00:00:00Z"), expiresAt: new Date("2025-11-30T00:00:00Z"), status: "active" },
  { id: GRANT_U4_DEC, creditAccountId: IDS.creditAccounts.u4Usd, source: "plan_policy", amount: BigInt(5000), remainingAmount: BigInt(5000), currency: "USD", grantedAt: new Date("2025-12-01T00:00:00Z"), expiresAt: new Date("2025-12-31T00:00:00Z"), status: "active" },

  { id: GRANT_U9_PACKAGE, creditAccountId: IDS.creditAccounts.u9Usd, source: "package_purchase", amount: BigInt(1000), remainingAmount: BigInt(800), currency: "USD", grantedAt: new Date("2026-01-02T00:00:00Z"), expiresAt: new Date("2026-07-01T00:00:00Z"), status: "active" },
];

export const CREDIT_EXPIRATIONS: CreditExpirationRow[] = [
  { id: "ce000000-0000-4000-8000-000000000001", creditGrantId: GRANT_U1_DEC, expiredAmount: BigInt(2000), expiredAt: new Date("2025-12-31T00:00:00Z") },
];

export const CREDIT_RESERVATIONS: CreditReservationRow[] = [
  { id: "cr000000-0000-4000-8000-000000000001", creditAccountId: IDS.creditAccounts.u1Usd, usageEventId: "ue000000-0000-4000-8000-000000000001", amount: BigInt(1000), status: "captured", idempotencyKey: "res-u1-dec-1", heldAt: new Date("2025-12-05T00:00:00Z"), resolvedAt: new Date("2025-12-05T00:05:00Z"), expiresAt: new Date("2025-12-05T01:00:00Z") },
  { id: "cr000000-0000-4000-8000-000000000002", creditAccountId: IDS.creditAccounts.u1Usd, usageEventId: "ue000000-0000-4000-8000-000000000002", amount: BigInt(2000), status: "captured", idempotencyKey: "res-u1-dec-2", heldAt: new Date("2025-12-12T00:00:00Z"), resolvedAt: new Date("2025-12-12T00:05:00Z"), expiresAt: new Date("2025-12-12T01:00:00Z") },
  {
    // STUCK: expired 9+ days ago but never resolved (still "held").
    id: "cr000000-0000-4000-8000-000000000003", creditAccountId: IDS.creditAccounts.u1Usd, usageEventId: "ue000000-0000-4000-8000-000000000003", amount: BigInt(200), status: "held", idempotencyKey: "res-u1-jan-4", heldAt: new Date("2026-01-05T00:00:00Z"), resolvedAt: null, expiresAt: new Date("2026-01-06T00:00:00Z"),
  },
  { id: "cr000000-0000-4000-8000-000000000004", creditAccountId: IDS.creditAccounts.u1Usd, usageEventId: "ue000000-0000-4000-8000-000000000004", amount: BigInt(1500), status: "captured", idempotencyKey: "res-u1-jan-6", heldAt: new Date("2026-01-06T00:00:00Z"), resolvedAt: new Date("2026-01-06T00:05:00Z"), expiresAt: new Date("2026-01-06T01:00:00Z") },
  { id: "cr000000-0000-4000-8000-000000000005", creditAccountId: IDS.creditAccounts.u4Usd, usageEventId: "ue000000-0000-4000-8000-000000000010", amount: BigInt(1000), status: "held", idempotencyKey: "res-u4-jan-1", heldAt: new Date("2026-01-12T00:00:00Z"), resolvedAt: null, expiresAt: new Date("2026-01-19T00:00:00Z") },
];

export const CREDIT_LEDGER: CreditLedgerRow[] = [
  { id: "cl000000-0000-4000-8000-000000000001", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "grant", amount: BigInt(5000), balanceAfter: BigInt(5000), referenceType: "credit_grant", referenceId: GRANT_U1_DEC, idempotencyKey: "ledger-u1-grant-dec", createdAt: new Date("2025-12-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000002", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "reserve", amount: BigInt(-1000), balanceAfter: BigInt(4000), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000001", idempotencyKey: "ledger-u1-reserve-1", createdAt: new Date("2025-12-05T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000003", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(4000), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000001", idempotencyKey: "ledger-u1-capture-1", createdAt: new Date("2025-12-05T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000004", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "reserve", amount: BigInt(-2000), balanceAfter: BigInt(2000), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000002", idempotencyKey: "ledger-u1-reserve-2", createdAt: new Date("2025-12-12T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000005", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(2000), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000002", idempotencyKey: "ledger-u1-capture-2", createdAt: new Date("2025-12-12T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000006", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "expire", amount: BigInt(-2000), balanceAfter: BigInt(0), referenceType: "credit_grant", referenceId: GRANT_U1_DEC, idempotencyKey: "ledger-u1-expire-dec", createdAt: new Date("2025-12-31T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000007", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "grant", amount: BigInt(5000), balanceAfter: BigInt(5000), referenceType: "credit_grant", referenceId: GRANT_U1_JAN, idempotencyKey: "ledger-u1-grant-jan", createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000008", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "reserve", amount: BigInt(-200), balanceAfter: BigInt(4800), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000003", idempotencyKey: "ledger-u1-reserve-3", createdAt: new Date("2026-01-05T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000009", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "reserve", amount: BigInt(-1500), balanceAfter: BigInt(3300), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000004", idempotencyKey: "ledger-u1-reserve-4", createdAt: new Date("2026-01-06T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000010", creditAccountId: IDS.creditAccounts.u1Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(3300), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000004", idempotencyKey: "ledger-u1-capture-4", createdAt: new Date("2026-01-06T00:05:00Z") },

  { id: "cl000000-0000-4000-8000-000000000020", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "grant", amount: BigInt(2000000), balanceAfter: BigInt(2000000), referenceType: "credit_grant", referenceId: GRANT_U3_NOV, idempotencyKey: "ledger-u3-grant-nov", createdAt: new Date("2025-11-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000021", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "reserve", amount: BigInt(-1200000), balanceAfter: BigInt(800000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-reserve-nov", createdAt: new Date("2025-11-20T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000022", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(800000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-capture-nov", createdAt: new Date("2025-11-20T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000023", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "grant", amount: BigInt(2000000), balanceAfter: BigInt(2800000), referenceType: "credit_grant", referenceId: GRANT_U3_DEC, idempotencyKey: "ledger-u3-grant-dec", createdAt: new Date("2025-12-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000024", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "reserve", amount: BigInt(-1500000), balanceAfter: BigInt(1300000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-reserve-dec", createdAt: new Date("2025-12-20T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000025", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(1300000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-capture-dec", createdAt: new Date("2025-12-20T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000026", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "grant", amount: BigInt(2000000), balanceAfter: BigInt(3300000), referenceType: "credit_grant", referenceId: GRANT_U3_JAN, idempotencyKey: "ledger-u3-grant-jan", createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000027", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "reserve", amount: BigInt(-600000), balanceAfter: BigInt(2700000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-reserve-jan", createdAt: new Date("2026-01-10T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000028", creditAccountId: IDS.creditAccounts.u3Irr, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(2700000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u3-capture-jan", createdAt: new Date("2026-01-10T00:05:00Z") },

  { id: "cl000000-0000-4000-8000-000000000040", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "grant", amount: BigInt(5000), balanceAfter: BigInt(5000), referenceType: "credit_grant", referenceId: GRANT_U4_OCT, idempotencyKey: "ledger-u4-grant-oct", createdAt: new Date("2025-10-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000041", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "reserve", amount: BigInt(-4000), balanceAfter: BigInt(1000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u4-reserve-oct", createdAt: new Date("2025-10-20T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000042", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(1000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u4-capture-oct", createdAt: new Date("2025-10-20T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000043", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "grant", amount: BigInt(5000), balanceAfter: BigInt(6000), referenceType: "credit_grant", referenceId: GRANT_U4_NOV, idempotencyKey: "ledger-u4-grant-nov", createdAt: new Date("2025-11-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000044", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "reserve", amount: BigInt(-3000), balanceAfter: BigInt(3000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u4-reserve-nov", createdAt: new Date("2025-11-20T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000045", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(3000), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u4-capture-nov", createdAt: new Date("2025-11-20T00:05:00Z") },
  { id: "cl000000-0000-4000-8000-000000000046", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "grant", amount: BigInt(5000), balanceAfter: BigInt(8000), referenceType: "credit_grant", referenceId: GRANT_U4_DEC, idempotencyKey: "ledger-u4-grant-dec", createdAt: new Date("2025-12-01T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000047", creditAccountId: IDS.creditAccounts.u4Usd, entryType: "reserve", amount: BigInt(-1000), balanceAfter: BigInt(7000), referenceType: "credit_reservation", referenceId: "cr000000-0000-4000-8000-000000000005", idempotencyKey: "ledger-u4-reserve-jan", createdAt: new Date("2026-01-12T00:00:00Z") },

  { id: "cl000000-0000-4000-8000-000000000060", creditAccountId: IDS.creditAccounts.u9Usd, entryType: "grant", amount: BigInt(1000), balanceAfter: BigInt(1000), referenceType: "credit_grant", referenceId: GRANT_U9_PACKAGE, idempotencyKey: "ledger-u9-grant-package", createdAt: new Date("2026-01-02T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000061", creditAccountId: IDS.creditAccounts.u9Usd, entryType: "reserve", amount: BigInt(-200), balanceAfter: BigInt(800), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u9-reserve-1", createdAt: new Date("2026-01-08T00:00:00Z") },
  { id: "cl000000-0000-4000-8000-000000000062", creditAccountId: IDS.creditAccounts.u9Usd, entryType: "capture", amount: BigInt(0), balanceAfter: BigInt(800), referenceType: "usage_events", referenceId: null, idempotencyKey: "ledger-u9-capture-1", createdAt: new Date("2026-01-08T00:05:00Z") },
];

export const CREDIT_PACKAGES: CreditPackageRow[] = [
  { id: IDS.creditPackages.top1000, key: "topup_1000", name: "بسته ۱۰۰۰ اعتباری", creditAmount: BigInt(1000), status: "active" },
];

export const CREDIT_PACKAGE_PRICES: CreditPackagePriceRow[] = [
  { id: "cpp00000-0000-4000-8000-000000000001", creditPackageId: IDS.creditPackages.top1000, currency: "USD", unitAmount: BigInt(1500) },
];

// ---------------------------------------------------------------------------
// Usage: raw forensic events (small, hand-picked) + daily aggregates (trend).
// ---------------------------------------------------------------------------

export const USAGE_EVENTS: UsageEventRow[] = [
  { id: "ue000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, featureId: IDS.features.apiCalls, userId: IDS.users.u1, quantity: 1000, occurredAt: new Date("2025-12-05T00:00:00Z"), recordedAt: new Date("2025-12-05T00:00:05Z"), status: "recorded", idempotencyKey: "usage-u1-1", creditReservationId: "cr000000-0000-4000-8000-000000000001" },
  { id: "ue000000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s1, featureId: IDS.features.apiCalls, userId: IDS.users.u1, quantity: 2000, occurredAt: new Date("2025-12-12T00:00:00Z"), recordedAt: new Date("2025-12-12T00:00:05Z"), status: "recorded", idempotencyKey: "usage-u1-2", creditReservationId: "cr000000-0000-4000-8000-000000000002" },
  { id: "ue000000-0000-4000-8000-000000000003", subscriptionId: IDS.subscriptions.s1, featureId: IDS.features.apiCalls, userId: IDS.users.u1, quantity: 200, occurredAt: new Date("2026-01-05T00:00:00Z"), recordedAt: new Date("2026-01-05T00:00:05Z"), status: "recorded", idempotencyKey: "usage-u1-3", creditReservationId: "cr000000-0000-4000-8000-000000000003" },
  {
    // Late-arriving event: occurred 3 days before it was recorded.
    id: "ue000000-0000-4000-8000-000000000004", subscriptionId: IDS.subscriptions.s1, featureId: IDS.features.apiCalls, userId: IDS.users.u1, quantity: 1500, occurredAt: new Date("2026-01-03T00:00:00Z"), recordedAt: new Date("2026-01-06T00:00:00Z"), status: "recorded", idempotencyKey: "usage-u1-4", creditReservationId: "cr000000-0000-4000-8000-000000000004",
  },
  { id: "ue000000-0000-4000-8000-000000000005", subscriptionId: IDS.subscriptions.s1, featureId: IDS.features.apiCalls, userId: IDS.users.u1, quantity: 300, occurredAt: new Date("2026-01-10T00:00:00Z"), recordedAt: new Date("2026-01-10T00:00:05Z"), status: "reversed", idempotencyKey: "usage-u1-5", creditReservationId: null },
  { id: "ue000000-0000-4000-8000-000000000010", subscriptionId: IDS.subscriptions.s4, featureId: IDS.features.apiCalls, userId: IDS.users.u4, quantity: 1000, occurredAt: new Date("2026-01-12T00:00:00Z"), recordedAt: new Date("2026-01-12T00:00:05Z"), status: "recorded", idempotencyKey: "usage-u4-1", creditReservationId: "cr000000-0000-4000-8000-000000000005" },
];

function buildDailySeries(
  subscriptionId: string,
  featureId: string,
  startIso: string,
  values: number[],
): UsageDailyAggregateRow[] {
  const start = new Date(startIso);
  return values.map((quantity, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const usageDate = date.toISOString().slice(0, 10);
    return {
      id: `ud${subscriptionId.slice(2, 8)}${index.toString().padStart(3, "0")}-0000-4000-8000-000000000000`.slice(0, 36),
      subscriptionId,
      featureId,
      usageDate,
      quantity,
      eventCount: Math.max(1, Math.round(quantity / 50)),
    };
  });
}

// s1 (pro, USD): stable ~850-1150/day, one clear spike (anomaly) on day 40.
const s1Series = [
  900, 950, 1000, 1050, 980, 1020, 900, 970, 1010, 1040,
  960, 990, 1030, 1000, 950, 980, 1020, 970, 1000, 1010,
  990, 950, 1000, 1030, 970, 990, 1010, 960, 1000, 980,
  1020, 990, 970, 1000, 950, 1010, 980, 1000, 990, 9200,
];
// s2 (starter, USD, quota 1000/cycle): trending toward overage across Jan.
const s2Series = [60, 65, 70, 68, 72, 75, 70, 74, 78, 80, 76, 79, 82, 85, 88];
// s9 (starter, USD, downgraded from pro): comfortably under quota.
const s9Series = [15, 18, 20, 17, 19, 22, 20, 18, 21, 19, 20, 18, 17, 19, 20];
// s3 (enterprise, IRR): 15 days at ~100,000/day => 1,500,000 total (matches invoice).
const s3Series = new Array(15).fill(100000);

export const USAGE_DAILY_AGGREGATES: UsageDailyAggregateRow[] = [
  ...buildDailySeries(IDS.subscriptions.s1, IDS.features.apiCalls, "2025-12-01", s1Series),
  ...buildDailySeries(IDS.subscriptions.s2, IDS.features.apiCalls, "2026-01-01", s2Series),
  ...buildDailySeries(IDS.subscriptions.s9, IDS.features.apiCalls, "2026-01-01", s9Series),
  ...buildDailySeries(IDS.subscriptions.s3, IDS.features.apiCalls, "2026-01-01", s3Series),
];
