// =============================================================================
// Atomic, Idempotent Credit Wallet Operations
// -----------------------------------------------------------------------------
// Capability: reserve / capture / release / grant / refund / expire credits
// Tables used: credit_accounts, credit_ledger, credit_grants,
//              credit_reservations, credit_expirations
// Design note on Neon HTTP vs this sandbox: the brief requires every
// multi-step mutation to be safe under a driver that cannot hold a
// long-lived transaction (`drizzle-orm/neon-http`). This module is written
// so each operation is a SINGLE deterministic state transition over an
// in-memory `CreditWalletState` snapshot that a caller loaded in one round
// trip; the caller then persists the resulting `ledgerEntry` +
// `updatedAccount` (+ any grant/reservation rows) in one `INSERT ... ON
// CONFLICT DO NOTHING` per idempotency key, which is safe on both neon-http
// and this sandbox's real `pg` Pool. No operation here assumes an open
// multi-statement transaction is available.
// Idempotency: every operation takes an `idempotencyKey`. If a ledger entry
// with that key already exists in the state, the operation is a no-op that
// returns the previously recorded outcome (`replayed: true`) instead of
// double-applying the effect — this is what the `uq_credit_ledger__idempotency_key`
// and `uq_credit_reservations__idempotency_key` unique indexes enforce at the
// database layer; this module enforces the same rule at the domain layer so
// the exact same guarantee is testable without a database.
// =============================================================================

import type { CreditAccountRow, CreditExpirationRow, CreditGrantRow, CreditLedgerRow, CreditReservationRow } from "@/shared/dataset-types";
import { ZERO } from "@/shared/money";

export interface CreditWalletState {
  account: CreditAccountRow;
  grants: CreditGrantRow[];
  reservations: CreditReservationRow[];
  ledger: CreditLedgerRow[];
  expirations: CreditExpirationRow[];
}

export interface WalletOperationResult {
  state: CreditWalletState;
  replayed: boolean;
  error?: WalletOperationErrorCode;
}

export type WalletOperationErrorCode = "INSUFFICIENT_AVAILABLE_BALANCE" | "RESERVATION_NOT_FOUND" | "RESERVATION_NOT_HELD" | "GRANT_NOT_EXPIRED_YET";

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence.toString().padStart(8, "0")}-0000-4000-8000-000000000000`.slice(0, 36);
}

/** Exposed for deterministic tests; production callers should not need it. */
export function resetWalletOperationIdSequenceForTests(): void {
  sequence = 0;
}

function findByIdempotencyKey(state: CreditWalletState, idempotencyKey: string): CreditLedgerRow | undefined {
  return state.ledger.find((entry) => entry.idempotencyKey === idempotencyKey);
}

export function grantCredits(
  state: CreditWalletState,
  params: { amount: bigint; source: CreditGrantRow["source"]; currency: string; expiresAt: Date | null; idempotencyKey: string; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const grant: CreditGrantRow = {
    id: nextId("grant"), creditAccountId: state.account.id, source: params.source, amount: params.amount,
    remainingAmount: params.amount, currency: params.currency, grantedAt: params.now, expiresAt: params.expiresAt, status: "active",
  };
  const newBalance = state.account.balance + params.amount;
  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "grant", amount: params.amount, balanceAfter: newBalance,
    referenceType: "credit_grant", referenceId: grant.id, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };

  return {
    replayed: false,
    state: {
      ...state,
      account: { ...state.account, balance: newBalance, lifetimeGranted: state.account.lifetimeGranted + params.amount },
      grants: [...state.grants, grant],
      ledger: [...state.ledger, ledgerEntry],
    },
  };
}

/** FIFO-selects active, unexpired grants (oldest first) to cover `amount`. */
function selectFifoGrants(grants: CreditGrantRow[], amount: bigint, now: Date): { grantId: string; take: bigint }[] {
  const eligible = grants
    .filter((grant) => grant.status === "active" && grant.remainingAmount > ZERO && (!grant.expiresAt || grant.expiresAt > now))
    .sort((a, b) => a.grantedAt.getTime() - b.grantedAt.getTime());

  const allocations: { grantId: string; take: bigint }[] = [];
  let remaining = amount;
  for (const grant of eligible) {
    if (remaining <= ZERO) break;
    const take = grant.remainingAmount < remaining ? grant.remainingAmount : remaining;
    allocations.push({ grantId: grant.id, take });
    remaining -= take;
  }
  return allocations;
}

export function reserveCredits(
  state: CreditWalletState,
  params: { amount: bigint; idempotencyKey: string; usageEventId: string | null; expiresAt: Date | null; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const available = state.account.balance - state.account.reservedBalance;
  if (available < params.amount) {
    return { state, replayed: false, error: "INSUFFICIENT_AVAILABLE_BALANCE" };
  }

  const allocations = selectFifoGrants(state.grants, params.amount, params.now);
  const grants = state.grants.map((grant) => {
    const allocation = allocations.find((a) => a.grantId === grant.id);
    return allocation ? { ...grant, remainingAmount: grant.remainingAmount - allocation.take } : grant;
  });

  const reservation: CreditReservationRow = {
    id: nextId("reservation"), creditAccountId: state.account.id, usageEventId: params.usageEventId, amount: params.amount,
    status: "held", idempotencyKey: params.idempotencyKey, heldAt: params.now, resolvedAt: null, expiresAt: params.expiresAt,
  };
  const newBalance = state.account.balance - params.amount;
  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "reserve", amount: -params.amount, balanceAfter: newBalance,
    referenceType: "credit_reservation", referenceId: reservation.id, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };

  return {
    replayed: false,
    state: {
      ...state,
      account: { ...state.account, balance: newBalance, reservedBalance: state.account.reservedBalance + params.amount },
      grants,
      reservations: [...state.reservations, reservation],
      ledger: [...state.ledger, ledgerEntry],
    },
  };
}

export function captureReservation(
  state: CreditWalletState,
  params: { reservationId: string; idempotencyKey: string; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const reservation = state.reservations.find((r) => r.id === params.reservationId);
  if (!reservation) return { state, replayed: false, error: "RESERVATION_NOT_FOUND" };
  if (reservation.status !== "held") return { state, replayed: false, error: "RESERVATION_NOT_HELD" };

  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "capture", amount: ZERO, balanceAfter: state.account.balance,
    referenceType: "credit_reservation", referenceId: reservation.id, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };

  return {
    replayed: false,
    state: {
      ...state,
      account: {
        ...state.account,
        reservedBalance: state.account.reservedBalance - reservation.amount,
        lifetimeUsed: state.account.lifetimeUsed + reservation.amount,
      },
      reservations: state.reservations.map((r) => (r.id === reservation.id ? { ...r, status: "captured", resolvedAt: params.now } : r)),
      ledger: [...state.ledger, ledgerEntry],
    },
  };
}

export function releaseReservation(
  state: CreditWalletState,
  params: { reservationId: string; idempotencyKey: string; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const reservation = state.reservations.find((r) => r.id === params.reservationId);
  if (!reservation) return { state, replayed: false, error: "RESERVATION_NOT_FOUND" };
  if (reservation.status !== "held") return { state, replayed: false, error: "RESERVATION_NOT_HELD" };

  const newBalance = state.account.balance + reservation.amount;
  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "release", amount: reservation.amount, balanceAfter: newBalance,
    referenceType: "credit_reservation", referenceId: reservation.id, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };

  // Restore whatever was earmarked from grants for this reservation, oldest-drawn-first
  // grants get restored first since that is the reverse of FIFO draw order for a single
  // reservation created in one `reserveCredits` call (which only spans contiguous grants).
  let remainingToRestore = reservation.amount;
  const grants = [...state.grants].sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime()).map((grant) => grant);
  const restoredGrants = state.grants.map((grant) => grant);
  for (const grant of grants) {
    if (remainingToRestore <= ZERO) break;
    const capacity = grant.amount - grant.remainingAmount;
    if (capacity <= ZERO) continue;
    const restore = capacity < remainingToRestore ? capacity : remainingToRestore;
    const index = restoredGrants.findIndex((g) => g.id === grant.id);
    restoredGrants[index] = { ...restoredGrants[index], remainingAmount: restoredGrants[index].remainingAmount + restore };
    remainingToRestore -= restore;
  }

  return {
    replayed: false,
    state: {
      ...state,
      account: { ...state.account, balance: newBalance, reservedBalance: state.account.reservedBalance - reservation.amount },
      grants: restoredGrants,
      reservations: state.reservations.map((r) => (r.id === reservation.id ? { ...r, status: "released", resolvedAt: params.now } : r)),
      ledger: [...state.ledger, ledgerEntry],
    },
  };
}

export function expireGrant(
  state: CreditWalletState,
  params: { grantId: string; idempotencyKey: string; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const grant = state.grants.find((g) => g.id === params.grantId);
  if (!grant || !grant.expiresAt || grant.expiresAt > params.now || grant.remainingAmount <= ZERO) {
    return { state, replayed: false, error: "GRANT_NOT_EXPIRED_YET" };
  }

  const expiredAmount = grant.remainingAmount;
  const newBalance = state.account.balance - expiredAmount;
  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "expire", amount: -expiredAmount, balanceAfter: newBalance,
    referenceType: "credit_grant", referenceId: grant.id, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };
  const expiration: CreditExpirationRow = { id: nextId("expiration"), creditGrantId: grant.id, expiredAmount, expiredAt: params.now };

  return {
    replayed: false,
    state: {
      ...state,
      account: { ...state.account, balance: newBalance },
      grants: state.grants.map((g) => (g.id === grant.id ? { ...g, remainingAmount: ZERO, status: "expired" } : g)),
      expirations: [...state.expirations, expiration],
      ledger: [...state.ledger, ledgerEntry],
    },
  };
}

export function refundCredits(
  state: CreditWalletState,
  params: { amount: bigint; referenceId: string | null; idempotencyKey: string; now: Date },
): WalletOperationResult {
  const existing = findByIdempotencyKey(state, params.idempotencyKey);
  if (existing) return { state, replayed: true };

  const newBalance = state.account.balance + params.amount;
  const ledgerEntry: CreditLedgerRow = {
    id: nextId("ledger"), creditAccountId: state.account.id, entryType: "refund", amount: params.amount, balanceAfter: newBalance,
    referenceType: "transaction", referenceId: params.referenceId, idempotencyKey: params.idempotencyKey, createdAt: params.now,
  };

  return {
    replayed: false,
    state: { ...state, account: { ...state.account, balance: newBalance, lifetimeUsed: state.account.lifetimeUsed - params.amount }, ledger: [...state.ledger, ledgerEntry] },
  };
}
