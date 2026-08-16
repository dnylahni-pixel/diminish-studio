# Prompt 03 — Users List

Implement the enterprise `/users` page. Preserve all previous UI and routing.

## Project Capsule

- Next.js 16 App Router; `searchParams` is asynchronous.
- Use Drizzle through `src/db/index.ts`.
- Reuse existing `DataTable`, `Pagination`, `SearchInput`, `Select`, `DateRangePicker`, `Badge`, `Avatar`, `DropdownMenu`, `Drawer`, `EmptyState` and typography primitives.
- Do not invent an application user status: the `users` table currently has no status column.

## Data Join

Base table `users`:

- `id`, `username`, `email`, `avatarUrl`, `preferredInstrument`, `createdAt`
- `storageUsedBytes`, `storageQuotaBytes`

Join at most one current subscription:

- `subscriptions.id`, `status`, `planId`, `currentPeriodEnd`
- `plans.name`

Join credit wallet:

- `creditAccounts.balance`, `reservedBalance`, `lifetimeUsed`

## Table Columns

1. User: Avatar + username + email.
2. Joined: formatted `createdAt`.
3. Plan: plan name or `No plan`.
4. Subscription: semantic status badge or `None`.
5. Available Credit: `balance - reservedBalance`.
6. Storage: used/quota and compact `Progress`; handle zero quota.
7. Renewal: `currentPeriodEnd` or em dash.
8. Actions: `DropdownMenu` containing only `View user`.

Clicking the row or action navigates to `/users/[userId]`.

## Toolbar

- Search by exact numeric ID, email or username.
- Filter by subscription status.
- Filter by plan.
- Filter by joined date range.
- Clear filters action appears only when filters are active.
- Desktop controls stay inline; mobile secondary filters move into `Drawer`.

## Server Pagination

- Default page size 25; allowed 25, 50, 100.
- URL keys: `q`, `subscription`, `plan`, `from`, `to`, `page`, `pageSize`, `sort`, `direction`.
- Allow sort only on joined date, username and credit balance.
- Validate every parameter against an allowlist.
- Query only the requested page and a separate total count.

## Supporting Summary

Above the table show only three compact cards:

- Total users.
- Users with active subscriptions.
- Users without subscriptions.

Do not add product-content metrics.

## Files Allowed

- `src/app/(admin)/users/page.tsx`
- `src/app/(admin)/users/loading.tsx`
- `src/features/users/queries.ts`
- `src/features/users/types.ts`
- `src/features/users/components/users-table.tsx`
- `src/features/users/components/users-filters.tsx`

## Acceptance

- Zero users produces `EmptyState`.
- Search/filter changes update URL and reset page to 1.
- No N+1 query.
- bigint values cross to client as strings or safe formatted values.
- Existing shell and primitives are not redesigned.
- Build and lint succeed.

If you are a web-only model, return complete code for every file, with no omitted imports or placeholders.
