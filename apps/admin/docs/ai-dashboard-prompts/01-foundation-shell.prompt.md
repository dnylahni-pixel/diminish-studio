# Prompt 01 — Foundation Shell

You are implementing the routing foundation of an enterprise Super Admin. Work conservatively and finish the task without asking questions.

## Project Capsule

- Next.js 16.2.11 App Router, React 19, TypeScript, Tailwind 4.
- Existing UI primitives live in `src/components/ui`; reuse them and do not recreate Button, Card, NavItem, Drawer, typography or feedback components.
- The current sidebar/header visual in `src/app/page.tsx` is approved. Preserve its spacing, colors, labels and responsive collapsed state.
- The approved shell is light: `bg-neutral-50` main canvas, `bg-neutral-0` sidebar/header, primary purple active state. Never convert it to a dark theme.
- Read `AGENTS.md` and relevant local Next documentation before editing.

## Goal

Convert the current one-page shell into a reusable App Router admin layout so future models can add routes without duplicating or redesigning the shell.

## Required Structure

- Keep `src/app/layout.tsx` as the root HTML/body/metadata layout.
- Create `src/app/(admin)/layout.tsx` for the shared admin shell.
- Move the `/` page to `src/app/(admin)/page.tsx`.
- Create one app-specific client composition such as `src/components/admin/admin-shell.tsx`.
- Route groups must not change public URLs.
- Remove the old conflicting `src/app/page.tsx`.

## Navigation

Use these exact URLs and labels:

- `/` — Overview
- `/users` — Users
- `/subscriptions` — Subscriptions
- `/plans` — Plans & Pricing
- `/credits` — Credits & Usage
- `/billing` — Billing
- `/promotions` — Trials & Promotions
- `/reports` — Reports
- `/alerts` — Alerts
- `/admin` — Admin & Security
- `/settings` — Settings

Extend the existing `NavItem` minimally so it can render a semantic Next `Link` when `href` is supplied while preserving its current button API. Do not wrap a button inside an anchor. Use `usePathname` only inside the app-specific client shell to calculate active state. `/` must only be active on exact match; other routes may match nested paths.

`NavItem` currently uses `children`, not a `label` prop. Preserve this call shape:

```tsx
<NavItem href="/users" icon={<Users className="size-4" />} active={active}>
  Users
</NavItem>
```

Modify only the `NavItem` section and necessary import in `src/components/ui/navigation.tsx`. Do not replace or delete Breadcrumb, Pagination, Stepper, DropdownMenu, ContextMenu or CommandMenu exports.

Use Lucide icons already installed. Do not use Unicode glyphs such as `◫`, `◎`, `⚙`, `⌕` or `◔`.

## Header

- Preserve the 72px height and existing visual.
- Title must be derived from pathname using the navigation labels.
- Keep Search and Notifications using the existing `IconButton` and Lucide icons; do not replace them with raw custom buttons.
- Keep the main content area as `{children}`.

The app-specific shell must continue composing the existing `IconButton`, `Avatar`, `Badge`, `LayoutSeparator`, `ScrollArea`, `NavItem`, `Caption`, `Heading` and `Text` components. Do not rewrite their styling locally.

## Files Allowed

- `src/app/page.tsx`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/page.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/components/ui/navigation.tsx`

Do not touch database code, global tokens or other UI primitives.

## Acceptance

- Every navigation item produces valid client-side navigation.
- Active state works for list and nested detail routes.
- Sidebar remains expanded on desktop and icon-only on small screens.
- Visual output matches the approved pre-refactor shell; this is an architecture extraction, not a redesign.
- `/` renders an intentionally empty Overview content area.
- No hydration warning, invalid nested interactive element or duplicate route.
- `npm run lint` has no new warnings and `npm run build` succeeds.

If you cannot edit the repository, return the complete contents of every created or modified file.
