// =============================================================================
// Credit Burn Rate / Runway / Expiry-Risk Engine
// -----------------------------------------------------------------------------
// Capability: calculateCreditBurnRateAndRunway
// Tables used: credit_accounts, credit_ledger, credit_grants
// Metric definitions (see docs/formulas-and-kpis.md for the formal spec):
//   dailyBurnRate = sum(|reserve ledger amounts| in window) / windowDays
//   runwayDays    = spendableBalance / dailyBurnRate  (null if burn is 0)
//   expiringWithin(N days) = sum(grant.remainingAmount) for active grants
//                            whose expiresAt falls within [now, now+N]
// Grain: one result per credit account. Currency is inherited from the
// account and never mixed with another account's currency.
// Consumer: credit-intelligence UI tab, decision-engine (low runway or high
// near-term expiration is a direct "recommend top-up" trigger).
// =============================================================================

import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { daysBetween } from "@/shared/date";
import { safeDivideBigint, ZERO } from "@/shared/money";

export interface CreditAgingBucket {
  bucketLabel: string;
  minDays: number;
  maxDays: number | null;
  amount: string;
}

export interface CreditBurnRateReport {
  creditAccountId: UUID;
  currency: string;
  windowDays: number;
  totalConsumedInWindow: string;
  dailyBurnRate: number | null;
  spendableBalance: string;
  runwayDays: number | null;
  runwayLabel: "insufficient-data" | "no-burn" | "healthy" | "watch" | "critical";
  agingBuckets: CreditAgingBucket[];
  expiringWithin30Days: string;
  expiringWithin7Days: string;
}

export function calculateCreditBurnRateAndRunway(
  dataset: IntelligenceDataset,
  creditAccountId: UUID,
  now: Date,
  windowDays = 30,
): CreditBurnRateReport {
  const account = dataset.creditAccounts.find((row) => row.id === creditAccountId);
  if (!account) throw new Error(`Unknown credit account: ${creditAccountId}`);

  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const consumedInWindow = dataset.creditLedger
    .filter((entry) => entry.creditAccountId === creditAccountId && entry.entryType === "reserve" && entry.createdAt >= windowStart && entry.createdAt <= now)
    .reduce((sum, entry) => sum - entry.amount, ZERO); // reserve amounts are negative

  const observedLedgerSpanDays = Math.max(
    1,
    daysBetween(
      dataset.creditLedger.filter((e) => e.creditAccountId === creditAccountId).reduce((min, e) => (e.createdAt < min ? e.createdAt : min), now),
      now,
    ),
  );
  const effectiveWindowDays = Math.min(windowDays, observedLedgerSpanDays);
  const dailyBurnRate = effectiveWindowDays > 0 ? safeDivideBigint(consumedInWindow, BigInt(Math.round(effectiveWindowDays))) : null;

  const spendableBalance = account.balance - account.reservedBalance;
  const runwayDays = dailyBurnRate && dailyBurnRate > 0 ? Number(spendableBalance) / dailyBurnRate : null;

  let runwayLabel: CreditBurnRateReport["runwayLabel"];
  if (dataset.creditLedger.filter((e) => e.creditAccountId === creditAccountId).length < 2) {
    runwayLabel = "insufficient-data";
  } else if (dailyBurnRate === null || dailyBurnRate === 0) {
    runwayLabel = "no-burn";
  } else if (runwayDays === null) {
    runwayLabel = "insufficient-data";
  } else if (runwayDays >= 30) {
    runwayLabel = "healthy";
  } else if (runwayDays >= 10) {
    runwayLabel = "watch";
  } else {
    runwayLabel = "critical";
  }

  const activeGrants = dataset.creditGrants.filter((grant) => grant.creditAccountId === creditAccountId && grant.status === "active" && grant.remainingAmount > ZERO);

  const bucketDefs: { label: string; min: number; max: number | null }[] = [
    { label: "already-expired", min: -Infinity, max: 0 },
    { label: "0-7-days", min: 0, max: 7 },
    { label: "8-30-days", min: 7, max: 30 },
    { label: "31-90-days", min: 30, max: 90 },
    { label: "90-plus-days", min: 90, max: null },
    { label: "no-expiry", min: NaN, max: NaN },
  ];

  const agingBuckets: CreditAgingBucket[] = bucketDefs.map((bucket) => {
    const amount = activeGrants
      .filter((grant) => {
        if (bucket.label === "no-expiry") return grant.expiresAt === null;
        if (grant.expiresAt === null) return false;
        const daysUntilExpiry = daysBetween(now, grant.expiresAt);
        const withinMin = bucket.min === -Infinity || daysUntilExpiry >= bucket.min;
        const withinMax = bucket.max === null ? true : daysUntilExpiry < bucket.max;
        return withinMin && withinMax;
      })
      .reduce((sum, grant) => sum + grant.remainingAmount, ZERO);
    return { bucketLabel: bucket.label, minDays: bucket.min, maxDays: bucket.max, amount: amount.toString() };
  });

  const expiringWithin30Days = activeGrants
    .filter((grant) => grant.expiresAt && daysBetween(now, grant.expiresAt) >= 0 && daysBetween(now, grant.expiresAt) <= 30)
    .reduce((sum, grant) => sum + grant.remainingAmount, ZERO);
  const expiringWithin7Days = activeGrants
    .filter((grant) => grant.expiresAt && daysBetween(now, grant.expiresAt) >= 0 && daysBetween(now, grant.expiresAt) <= 7)
    .reduce((sum, grant) => sum + grant.remainingAmount, ZERO);

  return {
    creditAccountId,
    currency: account.currency,
    windowDays: effectiveWindowDays,
    totalConsumedInWindow: consumedInWindow.toString(),
    dailyBurnRate,
    spendableBalance: spendableBalance.toString(),
    runwayDays,
    runwayLabel,
    agingBuckets,
    expiringWithin30Days: expiringWithin30Days.toString(),
    expiringWithin7Days: expiringWithin7Days.toString(),
  };
}
