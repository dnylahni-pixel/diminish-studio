# Prompt 09 — Credits & Usage

Implement `/credits` as the enterprise credit control center. Keep it read-only.

## Project Capsule

- Next.js 16, Drizzle + Neon, existing UI primitives only.
- Credit is an accounting domain: accuracy is more important than decoration.
- bigint values must not lose precision.
- Do not expose Songs/Artists/Chords.

## Data Sources

- `creditAccounts`: userId, status, balance, reservedBalance, lifetimeGranted, lifetimeUsed, updatedAt
- `users`: username, email, avatarUrl
- `creditLedger`: entryType, amount, balanceAfter, description, createdAt, reference IDs
- `creditGrants`: source, amountGranted, amountRemaining, grantedAt, expiresAt
- `creditReservations`: reservedAmount, capturedAmount, releasedAmount, status, expiresAt
- `creditExpirations`: expiredAmount, expiredAt
- `usageEvents`: userId, featureId, quantity, status, creditCost, moneyCost, createdAt
- `usageDailyAggregates`: dateBucket, featureId, totalQuantity, totalCredits, totalMoney, currency
- `features`: code, name, kind, unitName

## Page Layout

1. Header with date range and optional feature filter.
2. Four KPI cards:
   - Total Balance
   - Reserved Balance
   - Lifetime Granted
   - Lifetime Used
3. Two-column trend row:
   - Daily credit consumption using `usageDailyAggregates`.
   - Grant versus expiration summary.
4. Risk row:
   - Reservations expiring soon.
   - Grants expiring soon with remaining amount.
5. Tabs:
   - Accounts
   - Ledger
   - Grants
   - Reservations
   - Usage

## Accounts Table

- User
- Account status
- Balance
- Reserved
- Available = balance - reserved
- Lifetime used
- Utilization = used / granted
- Updated
- Action links to `/users/[userId]`

## Other Tables

- Ledger: timestamp, user, entry type, signed amount, balance after, description.
- Grants: user, source, granted, remaining, utilization, expiry.
- Reservations: user, reserved/captured/released, remaining hold, status, expiry.
- Usage: date, user, feature, quantity, credit cost, money cost, status.

## UX and Accounting Rules

- Debit ledger entries must visibly keep their sign.
- Available balance may be negative only if actual data is negative; use warning/danger tone.
- Distinguish `0`, `null` and `Not applicable`.
- Highlight stale active reservations whose `expiresAt` is in the past.
- Use daily aggregates for charts and raw events only for paginated inspection.
- Filters and tab state belong in URL.
- No Grant/Deduct buttons until mutation/audit architecture exists.

## Files Allowed

- `src/app/(admin)/credits/page.tsx`
- `src/app/(admin)/credits/loading.tsx`
- `src/features/credits/queries.ts`
- `src/features/credits/types.ts`
- `src/features/credits/components/*`

## Acceptance

- Ledger and account totals are precision-safe.
- Empty credit database looks intentional.
- Tables are paginated and queries aggregate server-side.
- No mock usage trend.
- Build and lint succeed.

If web-only, output complete file contents.
