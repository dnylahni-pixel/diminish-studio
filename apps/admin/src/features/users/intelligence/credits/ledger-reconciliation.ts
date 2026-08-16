import type { CreditLedgerSnapshot } from "../shared/dataset-types";

export interface CreditReconciliationResult {
  reconciled: boolean;
  cachedBalance: number;
  ledgerBalance: number | null;
  discrepancy: number | null;
  checkedEntryId: string | null;
  checkedAt: Date | null;
  confidence: "high" | "medium" | "low";
}

export function reconcileCreditAccountBalance(
  cachedBalance: number,
  entries: CreditLedgerSnapshot[],
): CreditReconciliationResult {
  const latestSnapshot = [...entries]
    .filter((entry) => entry.balanceAfter !== null)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  if (!latestSnapshot || latestSnapshot.balanceAfter === null) {
    return {
      reconciled: false,
      cachedBalance,
      ledgerBalance: null,
      discrepancy: null,
      checkedEntryId: null,
      checkedAt: null,
      confidence: "low",
    };
  }

  const discrepancy = cachedBalance - latestSnapshot.balanceAfter;

  return {
    reconciled: discrepancy === 0,
    cachedBalance,
    ledgerBalance: latestSnapshot.balanceAfter,
    discrepancy,
    checkedEntryId: latestSnapshot.id,
    checkedAt: latestSnapshot.createdAt,
    confidence: entries.length >= 3 ? "high" : "medium",
  };
}
