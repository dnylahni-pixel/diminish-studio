# Prompt 07 — Subscriptions List

Implement `/subscriptions` as the operational subscription center.

## Project Capsule

- Next.js 16 App Router, Drizzle + Neon.
- Use existing UI primitives only.
- Keep filtering and pagination in URL.
- This stage is read-only.

## Data Join

- `subscriptions`: `id`, `userId`, `planId`, `planVersionId`, `planPriceId`, `status`, `currency`, `startedAt`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `canceledAt`, `pauseStartsAt`, `pauseEndsAt`, `createdAt`
- `users`: username, email, avatarUrl
- `plans`: name, code
- `planVersions`: versionNumber
- `planPrices`: amount, currency, billingInterval, billingIntervalCount
- aggregate active addon count from `subscriptionAddons`
- active discount summary from `subscriptionDiscounts`
- latest event type/time from `subscriptionEvents`

## Summary Cards

- Active
- Trialing
- Past Due
- Canceling at Period End

Use counts, not fabricated percentages.

## Toolbar

- Search by subscription UUID, user email, username or numeric user ID.
- Multi-status filter.
- Plan filter.
- Currency filter.
- Renewal date range.
- Toggle `Canceling only`.
- Secondary filters move into `Drawer` on narrow screens.

## Table Columns

1. Customer: avatar, username, email.
2. Subscription: short ID plus creation date.
3. Plan: plan name and version.
4. Status: semantic badge; show secondary `Ends this period` badge when relevant.
5. Price: formatted price and interval.
6. Current Period: start → end.
7. Add-ons/Discount: compact counts or labels.
8. Last Event: type and relative timestamp.
9. Action: `View subscription`.

Rows navigate to `/subscriptions/[subscriptionId]`.

## Server Behavior

- Page size 25/50/100.
- Allowed sort: created date, renewal date, customer email and price.
- Default sort newest first.
- Query page and count separately.
- Avoid correlated N+1 lookups for latest event/addon/discount.
- `past_due` rows receive subtle warning emphasis, not a full red background.

## Files Allowed

- `src/app/(admin)/subscriptions/page.tsx`
- `src/app/(admin)/subscriptions/loading.tsx`
- `src/features/subscriptions/queries.ts`
- `src/features/subscriptions/types.ts`
- `src/features/subscriptions/components/subscriptions-table.tsx`
- `src/features/subscriptions/components/subscriptions-filters.tsx`

## Acceptance

- Handles zero subscriptions cleanly.
- URL is shareable and preserves filters.
- No mutation actions or fake status transitions.
- bigint/date values serialize safely.
- Build and lint succeed.

If no repository access, return complete paste-ready files.
