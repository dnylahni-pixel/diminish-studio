# Prompt 14 — Integration & Hardening

Perform the final integration pass across the completed Diminish Super Admin. Do not add new product features or redesign pages.

## Project Capsule

- Next.js 16.2.11, React 19, TypeScript, Tailwind 4, Drizzle + Neon.
- The dashboard should now contain Overview, Users, Plans, Subscriptions, Credits, Billing, Promotions, Reports, Alerts, Admin and Settings.
- Existing UI primitives and visual language are authoritative.

## Mission

Make independently generated puzzle pieces feel like one deliberate application.

## Required Audit

### Routing

- Verify every sidebar link exists.
- Verify active navigation for root, list and nested detail routes.
- Add route-level `loading.tsx`, `error.tsx` and relevant not-found handling where missing.
- No dead link, duplicate route or full-page anchor navigation.

### Shared Formatting

Find duplicate local implementations and consolidate only when behavior is identical:

- money formatting by currency/minor units,
- credit formatting,
- compact numeric formatting,
- exact and relative date formatting,
- short UUID formatting,
- status-to-tone mapping,
- safe bigint serialization.

Place shared admin-specific utilities under `src/lib/admin/`. Update consumers and delete true duplicates. Do not perform unrelated refactors.

### Visual Consistency

- All page headers use the same title/subtitle/action rhythm.
- Content padding and vertical spacing are consistent.
- KPI cards have consistent height and number alignment.
- Toolbars behave consistently on mobile.
- Tables use the same empty, loading and pagination patterns.
- Status labels use the master tone contract.
- No isolated custom hex colors, arbitrary shadows or competing radius system.

### Data Correctness

- No currency mixing.
- No unsafe bigint crossing Server/Client.
- No full-table client pagination.
- No N+1 queries.
- No raw JSON metadata, provider payload or sensitive config leakage.
- Empty databases produce intentional zero/empty states.
- Dates use deterministic timezone-aware formatting.

### Accessibility

- Keyboard access for navigation, menus, tabs and filters.
- Icon-only buttons have labels.
- Table controls have accessible names.
- Status is not communicated by color alone.
- Focus rings remain visible.
- Heading hierarchy is valid.
- No nested interactive controls.

### Performance

- Run production build.
- Check repeated aggregate queries and combine only where safe.
- Confirm charts use aggregates rather than raw usage scans.
- Document recommended database indexes for actual dashboard query patterns in `docs/dashboard-query-indexes.md`; do not create migrations automatically.

## Files Allowed

- Existing dashboard route and feature files
- `src/components/admin/*`
- `src/lib/admin/*`
- `docs/dashboard-query-indexes.md`

Do not alter core database tables, install dependencies or introduce mutations.

## Validation

Run:

- `npm run lint`
- `npm run build`

Fix only issues caused by dashboard work. Report unrelated pre-existing warnings separately.

## Acceptance

- The app feels authored by one team.
- All routes build and render with empty as well as populated data.
- No fake data, dead UI or silent security assumptions.
- Final response lists changed files, validation results and any deliberately deferred enterprise foundation.

If repository access is unavailable, return precise full-file replacements only for files that truly require changes.
