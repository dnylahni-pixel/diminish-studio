# Prompt 08 — Subscription Detail

Implement `/subscriptions/[subscriptionId]` as a read-only lifecycle and billing view.

## Project Capsule

- Next.js 16; await route params.
- Validate UUID and call `notFound()` when appropriate.
- Reuse `Breadcrumb`, `Heading`, `StatusIndicator`, `Card`, `DescriptionList`, `Tabs`, `Timeline`, `DataTable`, `Alert`, `EmptyState`.
- Do not create mutation flows in this stage.

## Load This Graph

- Subscription and joined user, plan, version and price.
- `subscriptionEvents` ordered newest first.
- `subscriptionPeriods` ordered by periodIndex.
- pending/applied `subscriptionSchedules`.
- `subscriptionAddons` joined to addon and addon price.
- active/historical `subscriptionDiscounts` joined to coupon when available.
- related `trials`.
- related `invoices`.
- related `transactions`.
- related credit grants and usage aggregates for the same subscription.

## Header

- Breadcrumb: Subscriptions / short subscription ID.
- Customer identity links to `/users/[userId]`.
- Plan links to `/plans/[planId]`.
- Primary subscription status.
- Secondary flags: cancel-at-period-end, paused window or scheduled action.
- Show start date and current renewal date.

## Summary Cards

- Current Price
- Current Period
- Amount Due from latest relevant invoice
- Credits Used in current period

## Tabs

1. Overview
2. Timeline
3. Periods
4. Add-ons & Discounts
5. Invoices & Transactions
6. Usage

## Presentation

- Overview: customer, catalog snapshot and lifecycle dates in three concise cards.
- Timeline: combine subscription events and schedules chronologically; scheduled future events use `info`, failed/past due use `danger`.
- Periods: table with index, dates, status, amount due/paid and invoice link.
- Add-ons & Discounts: two separate tables.
- Invoices & Transactions: compact related tables linking to future billing detail routes.
- Usage: period totals by feature from `usageDailyAggregates`; do not scan all raw events.

## Integrity Signals

Show an `Alert` only when data indicates:

- active subscription with expired current period,
- plan/version mismatch,
- amount paid greater than amount due/total,
- scheduled action already effective but not applied,
- cancel-at-period-end without current period end.

Do not invent errors when data is absent.

## Files Allowed

- `src/app/(admin)/subscriptions/[subscriptionId]/page.tsx`
- `src/app/(admin)/subscriptions/[subscriptionId]/loading.tsx`
- `src/features/subscriptions/queries.ts`
- `src/features/subscriptions/types.ts`
- `src/features/subscriptions/components/subscription-*`

## Acceptance

- All data is scoped to the requested subscription.
- Timeline ordering is deterministic.
- Empty related sections remain readable.
- No sensitive provider payload or raw metadata is shown.
- Build and lint succeed.

If web-only, output every complete file.
