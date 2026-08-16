import {
  calculateCreditBurnRateAndRunway,
  type CreditRunwayResult,
} from "../credits/burn-rate-runway";
import {
  reconcileCreditAccountBalance,
  type CreditReconciliationResult,
} from "../credits/ledger-reconciliation";
import {
  scoreUserHealth,
  type UserHealthResult,
} from "../subscription/health-score";
import type {
  CreditLedgerSnapshot,
  DailyCreditUsage,
  UserHealthSignals,
} from "../shared/dataset-types";

export interface UserIntelligenceInput {
  accountBalance: number | null;
  reservedBalance: number | null;
  ledger: CreditLedgerSnapshot[];
  usage: DailyCreditUsage[];
  healthSignals: Omit<UserHealthSignals, "availableCredit" | "runwayDays">;
  now: Date;
}

export interface UserIntelligenceProfile {
  availableCredit: number | null;
  creditReconciliation: CreditReconciliationResult | null;
  creditRunway: CreditRunwayResult | null;
  health: UserHealthResult;
}

export function buildUserAccountIntelligenceProfile(
  input: UserIntelligenceInput,
): UserIntelligenceProfile {
  const availableCredit =
    input.accountBalance === null
      ? null
      : input.accountBalance - (input.reservedBalance ?? 0);
  const creditReconciliation =
    input.accountBalance === null
      ? null
      : reconcileCreditAccountBalance(input.accountBalance, input.ledger);
  const creditRunway =
    availableCredit === null
      ? null
      : calculateCreditBurnRateAndRunway(availableCredit, input.usage, input.now);
  const health = scoreUserHealth({
    ...input.healthSignals,
    availableCredit,
    runwayDays: creditRunway?.runwayDays ?? null,
  });

  return {
    availableCredit,
    creditReconciliation,
    creditRunway,
    health,
  };
}
