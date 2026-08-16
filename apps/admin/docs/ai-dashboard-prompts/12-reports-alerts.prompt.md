# Prompt 12 — Reports & Alerts

Implement `/reports` and `/alerts` using derived data from existing tables. Do not create a new alert table and do not invent monitoring data.

## Project Capsule

- Next.js 16, Drizzle + Neon, existing UI primitives only.
- Reports are aggregate, read-only and currency-aware.
- Alerts are deterministic findings computed from current database state.
- Keep both routes visually consistent with previous pages.

## Reports Route

Create these report sections:

1. Revenue
   - succeeded charges, refunds, net revenue and outstanding invoices by day
   - one currency at a time
2. Subscription
   - new, active, canceled, past_due and trialing counts over time
   - plan distribution
3. Credits
   - granted, used, expired and reserved over time
   - top consuming features from `usageDailyAggregates`
4. Trials
   - started, converted and expired
   - conversion grouped by plan/source

Use `ChartContainer`, `ChartHeader`, `ChartLegend`, `Sparkline`, tables and KPI cards. No dependency installation. If the current chart primitives cannot express a complex visualization, prefer an accurate table plus compact SVG/CSS visualization over adding a library.

Report URL params: `report`, `from`, `to`, `currency`, `plan`, `granularity`.

Allowed granularity: day, week, month. Aggregate on the server.

## Alerts Route

Compute these alert categories:

- Critical:
  - failed financial integrity formula if detectable
  - active subscription pointing to missing plan/version/price
  - negative available credit when policy does not allow it
- Warning:
  - past_due subscription
  - open invoice past `dueAt`
  - active reservation past `expiresAt`
  - scheduled subscription action past `effectiveAt` without `appliedAt` or `canceledAt`
  - active trial ending within 3 days
  - credit grant expiring within 7 days with remaining amount
- Info:
  - subscription canceling at period end
  - coupon nearing redemption limit

## Alerts UX

- Header contains severity counts and last evaluated timestamp.
- Toolbar filters severity, category and owner domain.
- Main list uses `Alert`, `Badge`, `Text` and relevant entity links.
- Each item explains:
  - what is wrong,
  - why it matters,
  - affected entity,
  - detected time or deadline.
- Do not add Resolve buttons because no alert persistence exists.
- If no findings, show a strong healthy-state `EmptyState`.

## Files Allowed

- `src/app/(admin)/reports/page.tsx`
- `src/app/(admin)/reports/loading.tsx`
- `src/app/(admin)/alerts/page.tsx`
- `src/app/(admin)/alerts/loading.tsx`
- `src/features/reports/*`
- `src/features/alerts/*`

## Acceptance

- Reports use real aggregate data only.
- Alert conditions are testable pure functions where practical.
- Current zero billing dataset does not generate false critical alerts.
- Entity links point to existing user, plan or subscription routes.
- Build and lint succeed.

If web-only, provide complete file contents with paths.
