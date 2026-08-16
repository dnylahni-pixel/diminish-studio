# Prompt 02 — Overview Dashboard

Build the real `/` overview page for Diminish Super Admin. Do not redesign the shared shell and do not use fake data.

## Project Capsule

- Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Drizzle + Neon.
- Reuse UI from `src/components/ui`; install no dependency and create no replacement primitive.
- Page is a Server Component. Only date/filter controls may be client leaves.
- Domain priority: Users, Subscriptions, Plans, Credits, Billing.

## Data Sources

Use these tables and fields:

- `users`: `id`, `createdAt`
- `subscriptions`: `id`, `status`, `planId`, `planVersionId`, `planPriceId`, `currentPeriodEnd`, `createdAt`
- `plans`: `id`, `name`, `status`
- `planPrices`: `id`, `amount`, `currency`, `billingInterval`, `billingIntervalCount`
- `transactions`: `status`, `type`, `amount`, `currency`, `createdAt`
- `invoices`: `status`, `totalAmount`, `amountPaid`, `amountDue`, `currency`, `dueAt`
- `creditAccounts`: `balance`, `reservedBalance`, `lifetimeGranted`, `lifetimeUsed`
- `usageDailyAggregates`: `dateBucket`, `totalCredits`, `totalMoney`, `currency`
- `trials`: `status`, `startsAt`, `endsAt`, `convertedSubscriptionId`

## Metric Definitions

- Total Users: count of `users`.
- New Users: count created inside selected date range.
- Active Subscriptions: status `active`.
- At Risk: status `past_due` plus open overdue invoices.
- Available Credits: sum `balance - reservedBalance`.
- Credit Utilization: `sum(lifetimeUsed) / sum(lifetimeGranted)`, zero-safe.
- Revenue: sum succeeded charge transactions, minus succeeded refunds, for one selected currency only.
- MRR: recurring active subscription price normalized monthly; never mix currencies.
- Trial Conversion: converted trials divided by trials ended/started in range, zero-safe.

## Page Composition

1. Page header: title `Overview`, short subtitle, `DateRangePicker`, currency `Select`.
2. First row: four equal KPI cards for Revenue, MRR, Active Subscriptions and Available Credits.
3. Second row, 2/3 + 1/3:
   - Revenue trend in `ChartContainer`.
   - Subscription health card with status distribution and compact progress rows.
4. Third row, 1/2 + 1/2:
   - Credit usage trend using daily aggregates.
   - Attention Required list: past due subscriptions, overdue invoices, trials ending soon.
5. Final row: plan performance table with Plan, Active Subscribers, MRR and Share.

Use `Card`, `NumericText`, `Badge`, `StatusIndicator`, `Progress`, `ChartContainer`, `ChartHeader`, `Sparkline`, `Table` or `DataTable`, and `EmptyState`. With no records, show calm zero values and a meaningful empty state; never draw random trends.

## Query Architecture

- Create `src/features/overview/queries.ts`.
- Create `src/features/overview/types.ts` only if required.
- Perform parallel aggregate queries where safe.
- Avoid loading full tables into memory.
- Accept `from`, `to` and `currency` from URL search params.
- Validate params and apply safe defaults.

## Files Allowed

- `src/app/(admin)/page.tsx`
- `src/app/(admin)/loading.tsx`
- `src/features/overview/queries.ts`
- `src/features/overview/types.ts`
- `src/features/overview/components/*`

## Acceptance

- Works with the current empty billing dataset.
- No mixed-currency totals.
- No client import of `db`.
- Layout is dense, calm and enterprise; no hero section.
- Responsive from mobile to wide desktop.
- Build and lint succeed.

If repository access is unavailable, output complete file contents with exact paths.
