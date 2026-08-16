# Review Lab — Conventions (MUST follow)

> Anyone building UI must FIRST read the authoritative build guide:
> `docs/admin-ui-rebuild/THEME-GUIDE.md`, plus the official Appica docs
> (`FULL-SPEC.md` / `FULL-SPEC-INDEX.md` in that folder).
> This file only holds lab-specific mechanics and repo rules.

## What the Review Lab is

The Review Lab (`/lab`, group **Review Lab / آزمایشگاه** in the sidebar) is an
**UNVERIFIED / DRAFT container**. New hub screens are scaffolded here first and
stay in this draft area until the product owner approves them; after approval
they move to their final routes. Nothing here is production-approved yet.

- Container landing page: `src/app/(admin)/lab/page.tsx` (server) →
  `src/components/lab/review-lab.tsx` (client, tabbed).
- Current tabs: **Settings**, **Plans**, **Audit & Versions**.
- Replace or upgrade a tab's screen in place; do not delete the container.

## Non-negotiable repo rules (owner/domain rules — keep them)

1. **Data-source rule — build from the backend contract, NEVER the old admin UI.**
   The ONLY source of truth for *what data exists* is
   `apps/admin/src/features/*/{queries,actions,types}.ts` and
   `apps/admin/src/db/schema/`. Never read or copy old admin UI
   (`apps/admin/src/features/*/components`, `apps/admin/src/components/ui/*`,
   `apps/admin/src/app/**`).
   Rule of thumb: **types, queries, actions, schema → read. Components, pages, layouts → do not.**
2. **Product-flow decisions stay with the owner.** Anything that changes product
   behavior, domain semantics, routes or flows is confirmed with the owner first.
   Component and visual choices are decided professionally per THEME-GUIDE.md.
3. **BEUI only (تصمیم مالک ۲۰۲۶-۰۸-۰۸).** Primitives از BEUI می‌آیند:
   `apps/admin-new/src/components/beui/` (کامپوننت‌های محلی) + مستندات beui.dev / MCP beui.
   کامپوننت‌های Appica برای صفحه‌های جدید استفاده نمی‌شوند؛ اگر BEUI قطعه‌ای لازم را
   ندارد، آن را طبق الگوهای beui.dev با Tailwind/Motion بساز — هرگز از UI قدیمی ادمین.
4. **i18n (fa/en), RTL-first, build green.** All user-facing copy goes through
   i18n; use logical CSS properties only; after data-layer changes run
   `pnpm --filter @workspace/admin-new typecheck`. No new packages beyond the
   lockfile.

## Where files live

Follow the same layout the Features screen uses (it is the reference):

| Concern | Location |
| --- | --- |
| Page route | `src/app/(admin)/<screen>/page.tsx` (server component: fetch + pass props, `metadata` export) |
| Client screen component | `src/components/<screen>/*.tsx` (e.g. `settings-dashboard.tsx`) |
| Data layer — queries | `src/features/<screen>/queries.ts` |
| Data layer — server actions | `src/features/<screen>/actions.ts` (`"use server"`) |
| Data layer — types | `src/features/<screen>/types.ts` |
| i18n | `src/i18n/<screen>.ts` + keys already wired in `src/i18n/shell.ts` for nav |
| Shared meta (icons/labels per enum) | `src/components/<screen>/kind.ts` (see `features/kind.ts`) |

For the lab screens specifically:

- Settings → `src/features/settings/*`, `src/components/settings/*`.
- Plans → `src/features/plans/*`, `src/components/plans/*`.
- Audit & Versions → `src/features/audit/*`, `src/components/audit/*`.

## The `{actions,queries,types}.ts` triad pattern

- `types.ts` — plain TS types/interfaces for the screen (dto-like shapes, enums,
  filter/search params, action state). Re-export through
  `src/components/<screen>/types.ts` when the component layer needs them.
- `queries.ts` — read-only server functions (no directive needed) using
  `drizzle-orm` against `@/db` + `@/db/schema`. Follow `features/queries.ts`:
  parse search params with tiny local helpers (`firstParam`, `isOneOf`), return
  a single `…ListData` object, format relative timestamps via
  `Intl.RelativeTimeFormat` using the active locale.
- `actions.ts` — `"use server"` mutations. Validate with **zod**, return a
  typed `…ActionState` (`{ status, message, fieldErrors }`), use localized
  messages, and call `revalidatePath` on success.

Server pages pull data with `getServerLocale()`/`getServerI18n()` from
`src/i18n/server.ts`; client components read the locale via `useLocale()` from
`src/components/providers/locale-provider`.

## i18n (fa/en)

- One file per screen: `src/i18n/<screen>.ts` — `export type <Screen>Key = …`
  union + `Record` maps for `fa` and `en` + `translate(locale, key)`. Follow
  `src/i18n/features.ts` exactly.
- All user-facing strings go through `translate(locale, key)`; no hardcoded copy.
- Add any nav keys to `src/i18n/shell.ts` (`ShellKey` union + both records).
- Keep placeholder/interstitial copy minimal — these screens are WIP.

## RTL

The app is RTL-first (root `dir="rtl"`, `LocaleProvider` wraps a
`DirectionProvider`). Use **logical CSS properties** (`ps/pe/ms/me/start/end`)
never `left/right`. Icon-only/labeled direction-sensitive bits follow
`useDirection()` (see `admin-shell.tsx`). When you must pin a key chord, pin
`dir="ltr"` (see the `Kbd` group in `header.tsx`).

## Keeping the build green

- After changing server actions/queries run `pnpm --filter @workspace/admin-new typecheck`
  (or `pnpm run build` from the repo root which typechecks everything except admin).
- Never add a package unless it is already in the pnpm lockfile; Appica UI,
  `@tanstack/react-table`, `zod` and `drizzle-orm` are already available.
- Generated code (`packages/*/src/generated`) is never edited by hand.
