// =============================================================================
// Money & bigint safety kernel
// -----------------------------------------------------------------------------
// All monetary amounts in this codebase are minor-unit integers (e.g. Rial or
// cents) stored as PostgreSQL `bigint` and surfaced to TypeScript as `bigint`.
// This module centralizes every unsafe operation (bigint arithmetic, division,
// bigint -> JSON serialization, cross-currency guards) so no calculator ever
// improvises its own rounding or casting rule.
// =============================================================================

export type MinorUnitAmount = bigint;

export type CurrencyCode = string;

/** A monetary amount that always carries its currency next to it. */
export interface Money {
  readonly amount: MinorUnitAmount;
  readonly currency: CurrencyCode;
}

export function money(amount: MinorUnitAmount, currency: CurrencyCode): Money {
  return { amount, currency };
}

export const ZERO = BigInt(0);

/**
 * Thrown whenever code attempts to combine amounts of different currencies
 * without going through an explicit, documented conversion source. There is
 * no FX rate table in this domain model, so cross-currency aggregation is a
 * hard error rather than a silent sum.
 */
export class CurrencyMismatchError extends Error {
  constructor(public readonly currencies: CurrencyCode[]) {
    super(`Cannot combine amounts across mismatched currencies: ${currencies.join(", ")}`);
    this.name = "CurrencyMismatchError";
  }
}

export function assertSameCurrency(values: readonly Money[]): CurrencyCode {
  const distinct = Array.from(new Set(values.map((value) => value.currency)));
  if (distinct.length > 1) {
    throw new CurrencyMismatchError(distinct);
  }
  return distinct[0] ?? "N/A";
}

export function sumMoney(values: readonly Money[]): Money {
  if (values.length === 0) {
    return money(ZERO, "N/A");
  }
  const currency = assertSameCurrency(values);
  const amount = values.reduce((total, current) => total + current.amount, ZERO);
  return money(amount, currency);
}

/** Groups money values by currency instead of throwing, for multi-currency rollups. */
export function groupMoneyByCurrency(values: readonly Money[]): Map<CurrencyCode, MinorUnitAmount> {
  const totals = new Map<CurrencyCode, MinorUnitAmount>();
  for (const value of values) {
    totals.set(value.currency, (totals.get(value.currency) ?? ZERO) + value.amount);
  }
  return totals;
}

/**
 * Safe division for ratio/rate metrics. Returns `null` instead of throwing or
 * producing `Infinity`/`NaN` when the denominator is zero, forcing callers to
 * make an explicit decision about how to render "undefined" ratios.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

/** Same as {@link safeDivide} but for bigint minor-unit ratios, returned as a float. */
export function safeDivideBigint(numerator: bigint, denominator: bigint): number | null {
  if (denominator === ZERO) {
    return null;
  }
  return bigintToApproximateNumber(numerator) / bigintToApproximateNumber(denominator);
}

/**
 * Converts a bigint to `number` for display/ratio purposes only. Never use
 * this for a value that will be written back to a monetary column: bigint
 * precision must be preserved end-to-end for ledger and invoice amounts.
 */
export function bigintToApproximateNumber(value: bigint): number {
  return Number(value);
}

/** Formats a minor-unit amount as a major-unit decimal string (e.g. 123456 -> "1234.56"). */
export function formatMinorUnitsAsMajor(amount: bigint, minorUnitDigits = 2): string {
  const negative = amount < ZERO;
  const absolute = negative ? -amount : amount;
  const divisor = BigInt(10) ** BigInt(minorUnitDigits);
  const wholePart = absolute / divisor;
  const fractionPart = (absolute % divisor).toString().padStart(minorUnitDigits, "0");
  const sign = negative ? "-" : "";
  return minorUnitDigits > 0 ? `${sign}${wholePart}.${fractionPart}` : `${sign}${wholePart}`;
}

/** Rounds a fractional minor-unit amount (used by tiered/percentage pricing) using half-up rounding. */
export function roundToMinorUnit(value: number): bigint {
  return BigInt(Math.round(value));
}
