# Prompt 11 — Trials & Promotions

Implement `/promotions` for trial performance, coupons, redemptions and active subscription discounts.

## Project Capsule

- Next.js 16, Drizzle + Neon, existing UI only.
- Read-only stage: no Create Coupon or Extend Trial action.
- Use URL-driven tabs and filters.
- Never combine monetary discounts across currencies.

## Data Sources

Trials:

- `trials`: userId, planId, planVersionId, status, startsAt, endsAt, convertedSubscriptionId, source, createdAt
- join `users`, `plans`

Coupons:

- `coupons`: code, name, type, percentageOff, amountOff, currency, creditAmount, maxRedemptions, redeemedCount, perUserLimit, startsAt, expiresAt, appliesToPlanId, isActive, createdAt

Redemptions:

- `couponRedemptions`: couponId, userId, subscriptionId, invoiceId, transactionId, status, discountType, discountAmount, discountPercentBps, creditAmount, currency, redeemedAt, reversedAt

Subscription discounts:

- `subscriptionDiscounts`: subscriptionId, sourceType, couponId, name, amountOff, percentageOff, startsAt, endsAt, isActive

## KPI Definitions

- Active Trials: status `active`.
- Trials Ending Soon: active trials ending within the next 7 days from current time.
- Trial Conversion: converted divided by converted + expired, zero-safe.
- Active Coupons: `isActive` and inside valid time range.
- Redemption Utilization: redeemedCount / maxRedemptions only when max exists.

## Layout

1. Header with date range, plan filter and currency filter.
2. Four KPI cards: Active Trials, Ending Soon, Trial Conversion, Active Coupons.
3. Trial conversion trend and trial status distribution.
4. Tabs:
   - Trials
   - Coupons
   - Redemptions
   - Subscription Discounts

## Tables

Trials:

- Customer, Plan, Status, Source, Start, End, Remaining Time, Conversion link.

Coupons:

- Code/name, Type, Benefit, Applies To, Redemption count/limit, Per-user limit, Validity, Effective status.
- Benefit rendering depends on type: percentage, fixed money or credit grant.

Redemptions:

- Date, Coupon, Customer, Status, Benefit snapshot, Subscription/Invoice reference.

Subscription Discounts:

- Subscription, Customer, Source, Benefit, Start/End, Effective status.

## UX Rules

- Calculate effective coupon status from `isActive`, startsAt, expiresAt and maxRedemptions; do not trust one field alone.
- Expired or exhausted promotions use neutral/danger tone according to reason.
- Reversed redemptions must not count as successful usage.
- Show an `Alert` for coupons whose type has no matching benefit value.
- Do not expose raw couponSnapshot or metadata.

## Files Allowed

- `src/app/(admin)/promotions/page.tsx`
- `src/app/(admin)/promotions/loading.tsx`
- `src/features/promotions/queries.ts`
- `src/features/promotions/types.ts`
- `src/features/promotions/components/*`

## Acceptance

- Time-sensitive status uses the actual current time.
- Percent, money and credit benefits are never confused.
- Empty tabs render intentional states.
- Build and lint succeed.

If web-only, return complete files.
