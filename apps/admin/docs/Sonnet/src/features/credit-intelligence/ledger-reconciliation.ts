// =============================================================================
// Credit Ledger Reconciliation Engine
// -----------------------------------------------------------------------------
// Capability: reconcileCreditAccountBalance
// Tables used: credit_accounts, credit_ledger, credit_reservations,
//              credit_grants
// Problem solved: `credit_accounts.balance`/`reservedBalance` are caches.
// `credit_ledger` is the append-only source of truth. This engine rebuilds
// both numbers purely from the ledger/reservations and diffs them against the
// cache, plus validates the four core invariants the brief calls out
// explicitly:
//   1) balance == sum(ledger.amount)
//   2) reservedBalance == sum(reservations.amount where status = 'held')
//   3) lifetimeUsed == sum(ledger.amount where entryType='reserve', negated)
//      (capture itself carries amount=0 under our sign convention — see
//      credit-and-usage.fixtures.ts header comment — so "used" is measured at
//      the reserve step, which is when money actually leaves the balance)
//   4) every credit_grant.remainingAmount is within [0, amount]
// Consumer: credit-intelligence UI tab, data-quality scorecard, decision engine
// (an account failing reconciliation is an automatic high-priority work item).
// =============================================================================

import type { CreditAccountRow, IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { ZERO } from "@/shared/money";
import type { ReasonedFinding } from "@/shared/reason-code";

export type CreditReconciliationReasonCode =
  | "BALANCE_CACHE_DRIFT"
  | "RESERVED_BALANCE_CACHE_DRIFT"
  | "LIFETIME_USED_DRIFT"
  | "GRANT_REMAINING_OUT_OF_BOUNDS"
  | "DUPLICATE_LEDGER_IDEMPOTENCY_KEY"
  | "STUCK_RESERVATION";

export interface CreditAccountReconciliationReport {
  creditAccountId: UUID;
  userId: UUID;
  currency: string;
  cachedBalance: string;
  reconstructedBalance: string;
  cachedReservedBalance: string;
  reconstructedReservedBalance: string;
  cachedLifetimeUsed: string;
  reconstructedLifetimeUsed: string;
  isFullyReconciled: boolean;
  findings: ReasonedFinding<CreditReconciliationReasonCode>[];
}

export function reconcileCreditAccountBalance(dataset: IntelligenceDataset, creditAccountId: UUID): CreditAccountReconciliationReport {
  const account = dataset.creditAccounts.find((row) => row.id === creditAccountId);
  if (!account) {
    throw new Error(`Unknown credit account: ${creditAccountId}`);
  }

  const ledgerEntries = dataset.creditLedger.filter((row) => row.creditAccountId === creditAccountId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const reconstructedBalance = ledgerEntries.reduce((sum, entry) => sum + entry.amount, ZERO);
  const reconstructedLifetimeUsed = ledgerEntries
    .filter((entry) => entry.entryType === "reserve")
    .reduce((sum, entry) => sum - entry.amount, ZERO); // reserve amounts are negative; negate to report a positive "used" figure

  const heldReservations = dataset.creditReservations.filter((row) => row.creditAccountId === creditAccountId && row.status === "held");
  const reconstructedReservedBalance = heldReservations.reduce((sum, row) => sum + row.amount, ZERO);

  const findings: ReasonedFinding<CreditReconciliationReasonCode>[] = [];

  if (reconstructedBalance !== account.balance) {
    findings.push({
      code: "BALANCE_CACHE_DRIFT",
      severity: "critical",
      messageFa: `موجودی کش‌شده (${account.balance.toString()}) با موجودی بازسازی‌شده از دفترکل (${reconstructedBalance.toString()}) مغایرت دارد.`,
      weight: 3,
      evidence: { cached: account.balance.toString(), reconstructed: reconstructedBalance.toString() },
    });
  }

  if (reconstructedReservedBalance !== account.reservedBalance) {
    findings.push({
      code: "RESERVED_BALANCE_CACHE_DRIFT",
      severity: "warning",
      messageFa: `موجودی رزروشده کش‌شده (${account.reservedBalance.toString()}) با مجموع رزروهای فعال (${reconstructedReservedBalance.toString()}) مطابقت ندارد.`,
      weight: 2,
      evidence: { cached: account.reservedBalance.toString(), reconstructed: reconstructedReservedBalance.toString() },
    });
  }

  if (reconstructedLifetimeUsed !== account.lifetimeUsed) {
    findings.push({
      code: "LIFETIME_USED_DRIFT",
      severity: "warning",
      messageFa: `lifetimeUsed کش‌شده (${account.lifetimeUsed.toString()}) با مقدار محاسبه‌شده از دفترکل (${reconstructedLifetimeUsed.toString()}) هم‌خوانی ندارد.`,
      weight: 1,
      evidence: { cached: account.lifetimeUsed.toString(), reconstructed: reconstructedLifetimeUsed.toString() },
    });
  }

  const now = ledgerEntries.at(-1)?.createdAt ?? new Date();
  for (const reservation of heldReservations) {
    if (reservation.expiresAt && reservation.expiresAt.getTime() < now.getTime()) {
      findings.push({
        code: "STUCK_RESERVATION",
        severity: "critical",
        messageFa: `رزرو ${reservation.id} از تاریخ انقضای خود (${reservation.expiresAt.toISOString()}) گذشته اما هنوز در وضعیت «held» است.`,
        weight: 2,
        evidence: { reservationId: reservation.id },
      });
    }
  }

  const idempotencyKeys = new Map<string, number>();
  for (const entry of dataset.creditLedger) {
    if (!entry.idempotencyKey) continue;
    idempotencyKeys.set(entry.idempotencyKey, (idempotencyKeys.get(entry.idempotencyKey) ?? 0) + 1);
  }
  for (const [key, count] of idempotencyKeys) {
    if (count > 1) {
      findings.push({
        code: "DUPLICATE_LEDGER_IDEMPOTENCY_KEY",
        severity: "critical",
        messageFa: `کلید idempotency «${key}» در دفترکل اعتبار ${count} بار تکرار شده است؛ احتمال ثبت تکراری یک عملیات وجود دارد.`,
        weight: 3,
        evidence: { idempotencyKey: key, occurrences: count },
      });
    }
  }

  for (const grant of dataset.creditGrants.filter((row) => row.creditAccountId === creditAccountId)) {
    if (grant.remainingAmount < ZERO || grant.remainingAmount > grant.amount) {
      findings.push({
        code: "GRANT_REMAINING_OUT_OF_BOUNDS",
        severity: "critical",
        messageFa: `grant ${grant.id} مقدار باقی‌مانده (${grant.remainingAmount.toString()}) خارج از بازه مجاز [0, ${grant.amount.toString()}] است.`,
        weight: 3,
        evidence: { grantId: grant.id },
      });
    }
  }

  return {
    creditAccountId,
    userId: account.userId,
    currency: account.currency,
    cachedBalance: account.balance.toString(),
    reconstructedBalance: reconstructedBalance.toString(),
    cachedReservedBalance: account.reservedBalance.toString(),
    reconstructedReservedBalance: reconstructedReservedBalance.toString(),
    cachedLifetimeUsed: account.lifetimeUsed.toString(),
    reconstructedLifetimeUsed: reconstructedLifetimeUsed.toString(),
    isFullyReconciled: findings.length === 0,
    findings,
  };
}

export function reconcileAllCreditAccounts(dataset: IntelligenceDataset): CreditAccountReconciliationReport[] {
  return dataset.creditAccounts.map((account: CreditAccountRow) => reconcileCreditAccountBalance(dataset, account.id));
}
