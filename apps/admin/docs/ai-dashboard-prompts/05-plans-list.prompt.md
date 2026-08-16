# Prompt 05 — Plans List

Implement `/plans` as the catalog command page. Preserve the shell and all earlier pages.

## Project Capsule

- Next.js 16, TypeScript, Drizzle + Neon.
- Use existing `Card`, `DataTable`, `Badge`, `StatusIndicator`, `SearchInput`, `Select`, `Tabs`, `DropdownMenu`, `EmptyState` and typography.
- Do not implement plan creation/editing in this stage.

## Data

Use:

- `plans`: `id`, `code`, `name`, `description`, `status`, `isPublic`, `sortOrder`, `createdAt`, `updatedAt`
- latest `planVersions`: `id`, `versionNumber`, `status`, `effectiveFrom`
- active/default `planPrices`: `amount`, `currency`, `priceType`, `billingInterval`, `billingIntervalCount`
- aggregate active subscription count from `subscriptions`
- aggregate active subscription revenue grouped by currency; do not merge currencies

## Page Layout

1. Header:
   - `Plans & Pricing`
   - subtitle describing versioned catalog management
   - no Create button until mutation flow exists
2. Compact summary row:
   - Total Plans
   - Active Public Plans
   - Draft Plans
   - Active Subscribers
3. `Tabs`:
   - All
   - Active
   - Draft
   - Archived
4. Toolbar:
   - Search by plan name or code
   - Public visibility filter
   - Currency filter
   - Sort by order, name or updated date
5. Main `DataTable`.

## Table Columns

1. Plan: name, code and short description.
2. Status: plan status plus Public/Private badge.
3. Current Version: version number and version status.
4. Pricing: default active price with interval; show `Multiple currencies` when needed.
5. Subscribers: count of active subscriptions.
6. Updated: relative time with exact tooltip.
7. Action: `View plan`.

Row navigation goes to `/plans/[planId]`.

## Query Rules

- Use server pagination even if the current plan count is small.
- Select the latest version deterministically by `versionNumber`, not arbitrary row order.
- Do not compute revenue from invoice drafts or pending transactions.
- Do not mutate catalog data.
- URL params: `q`, `status`, `visibility`, `currency`, `sort`, `direction`, `page`.

## Files Allowed

- `src/app/(admin)/plans/page.tsx`
- `src/app/(admin)/plans/loading.tsx`
- `src/features/plans/queries.ts`
- `src/features/plans/types.ts`
- `src/features/plans/components/plans-table.tsx`
- `src/features/plans/components/plans-filters.tsx`

## Acceptance

- Current empty plan database renders a polished empty state.
- Status tabs and filters are URL-driven.
- Currency display is honest and never combined incorrectly.
- Existing UI primitives remain unchanged.
- Build and lint succeed.

If working without repo access, output complete paste-ready files.
