# Admin UI Rebuild — Handoff & Context

> Maintained for future AI sessions. Read this file before touching any Admin UI code.
>
> Anyone building UI is directed to `THEME-GUIDE.md` (the authoritative build
> process) and the official Appica docs (`FULL-SPEC.md` / `FULL-SPEC-INDEX.md`).
> `CONVENTIONS.md` is only the Review Lab's mechanical checklist.

## 🔒 Non-negotiable workflow rule (user-mandated)

For **any design task** (page, component, flow, screen, animation, style):

1. **ASK FIRST — never guess and never write code** before the user describes the flow.
2. Ask the user to specify, for every element, **which component** should be used.
3. Ask the user to specify the **animations/transitions** they want.
4. Only after the user answers, write/implement exactly what they described.

No assumptions about flows, component choices, or animations. If the user hasn't
answered one of these three, ask again before implementing.

## 🔒 Data-source rule (user-mandated) — build from the backend contract, NEVER the old UI

For the new admin UI (`apps/admin-new`), the ONLY source of truth for *what to build* is the
**real backend / data contract**, not the previous admin UI:

- **READ ONLY THIS** to know what must be built: the server **queries**, **actions**,
  **types**, and **DB schema** of the current admin data layer
  (`apps/admin/src/features/*/queries.ts`, `actions.ts`, `types.ts`, and
  `apps/admin/src/db/schema/`). These define the real data shapes and operations the new UI
  must support (fields, enums, statuses, validation rules, list/detail/create flows).
- **NEVER read or copy** the old admin's **UI/UX**: `apps/admin/src/features/*/components`,
  `apps/admin/src/components/ui/*`, and the pages under `apps/admin/src/app/**`. UI and UX
  are being rebuilt from scratch on Appica UI with the owner's **own new policies**. The old
  UI is not a template, not a reference, not a fallback.
- Backend = the contract (what data exists, what operations exist). New frontend = a fresh
  design of how to present and drive that data. The two are decoupled on purpose.
- If the old UI shows a flow the backend supports, that does NOT mean the new UI reuses its
  layout, components, steps, or copy. The new design is decided per the ASK-FIRST rule above.

Rule of thumb: **types, queries, actions, schema → read them. Components, pages, layouts → do not.**

## Mission

Total demolition and rebuild of the **Diminish Admin UI** (`apps/admin`). The user has been explicit:

> "وقتی میگم بکوبیم و از نو بسازیم یعنی هیچ اثری از قبلی نباید بمونه"

No trace of the current admin theme may remain: not tokens, not UI primitives, not the layout shell,
not page styling. Everything is rebuilt from zero on **Appica UI** (`@appica/ui-react`).

> ## ⭐ Source of truth for the admin theme & style
>
> `THEME-GUIDE.md` in this folder is the authoritative file the user fills with every
> guidance note for the admin theme and style. Before any theme/styling work, read
> `docs/admin-ui-rebuild/THEME-GUIDE.md` and follow it. It overrides assumptions in this index.

`FULL-SPEC.md` in this folder is the complete, detailed spec the user pastes (everything,
step by step). It complements THEME-GUIDE.md — read both before starting implementation.

`FULL-SPEC.md` currently contains the **entire official Appica UI documentation**
(20 guides + 62 component pages, 1.1 MB). Use `FULL-SPEC-INDEX.md` to navigate it
by section/line number. Key extracted facts are listed at the bottom of that index.

## Status (2026-08-05)

- Rebuild lives in `apps/admin-new` (fresh path, Appica UI only); old `apps/admin` is untouched.
- Shell v1 + Features + Review Lab (Settings / Plans / Audit) are implemented and connected to the real backend.
- Semantic feedback pass applied: Toast/Alert/FieldError, role-based status colors, lab skeleton, i18n on the demo page.
- UI/UX decisions follow `THEME-GUIDE.md` (primary) + `CONVENTIONS.md` (lab mechanics): official Appica docs → plan → implement → expert self-review.

## Resolved decisions (recorded)

1. Rebuild scope: keep DB schema + server actions; rebuild all UI/presentation from scratch.
2. Fresh path: build in `apps/admin-new` and swap later; old admin untouched.
3. Appica UI is the only source of components (subpath imports); missing pieces (DataTable recipe, Sidebar,
   Command, EmptyState, …) are built per official Appica docs/recipes, never copied from the old UI.
4. Visual direction: baseline = Appica default tokens (role-based colors incl. semantic accents); the
   appica.dev monochrome override is a borrowed pattern, not a mandate. Any owner decision is recorded in
   THEME-GUIDE.md.
5. RTL + Persian first-class: yes (root dir=rtl, DirectionProvider, logical CSS).
6. Routes/navigation: current structure kept for now; Catalog unification remains an owner decision.

## Current step — Admin shell (awaiting user spec)

User is writing the shell spec into `PENDING-SHELL.md`. Requirements already stated:

- Header must be **very small** and unobtrusive.
- Sidebar items must be **grouped** with **sub-items**.
- Sidebar must be **collapsible**.
- Header shape (confirmed): horizontal `Toolbar` (search input + ghost buttons + link), like `ToolbarDefault`.
- Sidebar collapsed state (confirmed): vertical `Toolbar` with icon-only ghost buttons grouped with separators, like `ToolbarVertical`.
- Sidebar expanded state (confirmed): `Accordion variant="flush"` — each nav group is an `AccordionItem`, sub-items live in `AccordionContent`.
- Shortcuts: `Kbd` / `KbdGroup` (pin `dir="ltr"` in RTL).

**Not determined yet:** brand colors, dark palette, fonts (user asked whether the sent code determines them — it does not; only structure).

Process: read the spec → present our understanding → wait for approval → then implement.

### Shell v1 — implemented (2026-08-04), final sidebar shape (2026-08-05)

- `apps/admin-new/src/components/shell/admin-shell.tsx` — **single sliding sidebar on every screen
  size**: an off-canvas `Drawer` that slides over the content (never pushes it aside) and contains the
  full navigation. No persistent inline sidebar and no collapsed icon rail — the nav is not
  conditionally rendered by available space. Drawer opens **below the header** (`top-11`), side
  follows direction (`rtl` → right, `ltr` → left), scrim below header via
  `backdropProps className="top-11"`, `closeButton={false}` and no `DrawerHeader`/title so it reads as
  a sidebar rather than a dialog. Toggle from the header button or `⌘/Ctrl+B`.
- The intermediate 2026-08-05 attempt (persistent inline sidebar on desktop + drawer on mobile) was
  rejected by the owner: it pushed content aside and rendered an icon-only rail based on space.
- `apps/admin-new/src/components/shell/header.tsx` — tiny `Toolbar` header: sidebar toggle (Tooltip + Kbd ⌘B),
  search icon, theme toggle (useTheme), notifications, avatar DropdownMenu. Header is the original
  flat full-width bar (`h-11`, `border-b`); the floating/rounded header experiment was reverted by
  the owner. Drawer offset stays `top-11` so it opens below the flat header. The `BackgroundPattern`
  covers the **whole shell** (including behind the header), not just the main content area.
- `apps/admin-new/src/components/shell/sidebar.tsx` — `Accordion variant="flush"` groups (5 groups:
  Workspace / Monetization / Integrations / Intelligence / System), active group auto-opens, active
  item highlighted; `nav.ts` holds group data with Appica icons.

### Future idea (owner, 2026-08-05 — not implemented)

- Header could become **several floating buttons** instead of one full-width bar. Owner may ask for
  it later; do not implement without a new decision.
- `apps/admin-new/src/app/(admin)/layout.tsx` + `(admin)/page.tsx` — route-group layout wraps the demo page.

## Technical facts learned from the real package

- Package: `@appica/ui-react@1.0.0`, MIT, repo `github.com/appica-dev/appica-ui`.
- Prerequisites: React >= 19, Tailwind CSS >= 4. Our admin already has React 19.2.4, Next 16.2.11,
  Tailwind 4 (installed 4.3.0), `@tailwindcss/postcss`.
- Built on Base UI primitives, styled with Tailwind v4 design tokens, animated with Motion.
- **63 components** (see references); notable gaps: no `Command`/⌘K, no `Sidebar`, no `DataTable`,
  no `Sheet` (has `Drawer`), no `EmptyState`, no `Stepper`.
- Import convention: subpath imports for app code (`@appica/ui-react/button`); root import only for prototyping.
- Styling: `variant` + `size` props; `className` is merged and overrides win; `render` prop enables
  composition with Next Link etc. Components work in RSC; interactive pieces carry their own `'use client'`.
- Tailwind wiring needed:
  ```css
  @import 'tailwindcss';
  @import '@appica/ui-react/styles.css';
  @source '@appica/ui-react'; /* package README: works on Tailwind >= 4.2 */
  ```
  (The pasted official installation doc still shows the older relative path
  `@source '../node_modules/@appica/ui-react/dist';` — the installed README says the bare package name works
  on Tailwind >= 4.2, which we have.)
- Wrap app in `ThemeProvider` (`@appica/ui-react/providers/theme-provider`) in root layout `<body>`;
  optional `DirectionProvider` (RTL) and `ReducedMotionProvider`.
- Appica token vocabulary differs from current Aurora tokens (e.g. `--primary`, `--background`,
  `--foreground` vs `--color-neutral-0`, `--color-primary-500`). The new `globals.css` must be written
  around Appica's token names.

## Saved reference documents

- [01 — Installation](references/appica-ui-01-installation.md)
- [02 — Usage](references/appica-ui-02-usage.md)
- [03 — Theming](references/appica-ui-03-theming.md)
- [04 — Colors](references/appica-ui-04-colors.md)
- [05 — Fonts](references/appica-ui-05-fonts.md)
- [06 — Dark Mode](references/appica-ui-06-dark-mode.md)
- [07 — RTL](references/appica-ui-07-rtl.md)
- [08 — Composition](references/appica-ui-08-composition.md)
- [09 — Animation](references/appica-ui-09-animation.md)
- [10 — Accessibility](references/appica-ui-10-accessibility.md)
- [11 — Forms & Validation](references/appica-ui-11-forms.md)
- [12 — Direction Provider](references/appica-ui-12-direction-provider.md)
- [13 — Reduced Motion Provider](references/appica-ui-13-reduced-motion-provider.md)
- [14 — useTheme](references/appica-ui-14-usetheme.md)
- [15 — useDirection](references/appica-ui-15-usedirection.md)
- [16 — useMediaQuery](references/appica-ui-16-usemediaquery.md)
- [17 — useLocalStorage](references/appica-ui-17-uselocalstorage.md)
- [18 — useDismissible](references/appica-ui-18-usedismissible.md)
- [19 — useReducedMotion](references/appica-ui-19-usereducedmotion.md)
- [20 — Theme Provider](references/appica-ui-20-theme-provider.md)
- [21 — Toolbar / Accordion / Kbd (shell components chosen by user)](references/appica-ui-21-toolbar-accordion-kbd.md)
- [22 — appica.dev site theme (pattern source: monochrome tokens + system font)](references/appica-dev-site-theme.md)
- [23 — appica.dev site fonts (@font-face dump: Geist default + alternatives, not portable as-is)](references/appica-dev-site-fonts.md)
- [24 — appica.dev rendered DOM notes (real class patterns for buttons, tabs, inputs, drawer, toc…)](references/appica-dev-rendered-dom-notes.md)
- [25 — Token Field pattern (NameThatUI; the assembly input for puzzle pieces)](references/token-field-pattern.md)
- [26 — Hamburger Menu / Nav Drawer (NameThatUI; "drawer below header" variant decided)](references/hamburger-nav-drawer-pattern.md)
- [27 — Chip (tags/selectable filters; likely for feature `kind` + dependency tags)](references/appica-ui-27-chip.md)
- [28 — Combobox (searchable picker; likely for feature `dependencies` multi-select with chips)](references/appica-ui-28-combobox.md)

## Feature-builder decisions so far (2026-08-05)

Flow approved by owner (revised — create form is a **Dialog**, not a page; the earlier Drawer idea was superseded):
1. **Trigger** — the «افزودن قابلیت» button on the features list page opens `FeatureCreateDialog`
   (Appica **`Dialog`**).
2. Kind (`boolean | metered | quota | package`) — **`Select`** dropdown (owner-chosen, replaces chips)
3. Name / Code (auto-slug from name) / Description — `Input`/`Textarea`
4. Unit — `Input`, shown only for `metered`/`quota` (soft fade `ds-fade-in`)
5. Active — `Switch` (isActive)
6. Active-by-default — **`Checkbox`** → maps to `defaultAccess = allow` (checked) / `deny` (unchecked)
7. Dependencies — multi-select `Combobox` with `ComboboxChips`; list items show kind icon + name + code
8. **«ساخت قابلیت» OR «لغو»** both open a confirmation **`AlertDialog`** (create → submit, cancel → discard)

Backend contract for this form (source of truth): `apps/admin/src/features/features/actions.ts`
(`createFeature`), `types.ts`, `db/schema/catalog/features.ts`. Per the data-source rule, do NOT
reference the old features UI components.

### Feature-catalog UI — implemented (2026-08-05)

- List page: `apps/admin-new/src/app/(admin)/features/page.tsx` → `features-dashboard.tsx`
- **Connected to the real backend/DB** (same Neon `DATABASE_URL` as old admin). The old admin's
  data layer was copied into `apps/admin-new/src/{db,shared,features,catalog-intelligence,i18n,messages}`
  so the new app runs the same queries/actions/schema. Old admin remains untouched.
- Table: TanStack Data Table per the Appica recipe (`@tanstack/react-table` + Appica
  Table/Checkbox/Badge/Input/Dropdown Menu/Scroll Area) with server-driven search, sorting and
  pagination (URL params) plus column visibility and row selection. Full-width container
  (`w-full px-6 py-8`), some columns hidden by default to avoid horizontal cramping.
- Create/edit: `feature-create-dialog.tsx` (Dialog) wired to `createFeature` / `updateFeature`.
- Archive/delete: `archiveFeature` server action — features are **archived** (`is_active=false`),
  never hard-deleted, per CONTEXT.md domain rule ("فقط قابلیت می‌تواند archive شود").
- Loading: `features/loading.tsx` uses Appica `Skeleton`; in-flight search/paging shows Appica
  `Loader` (dots); submit/archive buttons use `Spinner`.
- Shared kind meta/icons: `apps/admin-new/src/components/features/kind.ts`
- Data shapes: `src/features/features/types.ts` (FeatureKind, FeatureOption, FeatureListItem,
  FeatureEditData, …) — re-exported via `components/features/types.ts`.
- i18n: `apps/admin-new/src/i18n/features.ts` (fa/en)
- Old `/features/new` page + `feature-builder.tsx` were **removed** (drawer replaces the page).
- `mock-data.ts` is dead code (kept only as reference) — remove when convenient.

## Notes for future AI sessions

- Repo state: worktree was already dirty with a large unrelated refactor (artifacts/ → apps/ moves,
  many untracked files) before this task. Preserve those changes; do not reset or rewrite history.
- Current branch when work started: `unified-local-development`.
- Ask before destructive commands; commit/checkpoint only what the user approves.
