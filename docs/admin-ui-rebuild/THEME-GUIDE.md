# Admin Build & Theme Guide — Primary Source for Anyone Building UI

> Anyone who is going to build a screen in this admin is directed HERE first.
> This file does NOT invent design rules: every decision comes from the
> official Appica documentation (saved locally, or official sources online)
> plus professional design judgment.

## Source of truth

1. Official Appica docs saved in this folder: `FULL-SPEC.md`,
   `FULL-SPEC-INDEX.md`, `references/`.
2. Official Appica sources online when needed: appica.dev documentation and
   `github.com/appica-dev/appica-ui`.
3. If the local copy conflicts with the official source, the official source
   wins — and the local copy should be updated.

## Current baseline (facts, not rules)

- The app runs Appica's default token system: role-based colors
  (foreground/background/border + primary/secondary/error/success/warning/info),
  oklch values, light/dark via `.dark` + `ThemeProvider`.
- `src/app/globals.css` currently overrides only neutral and primary tokens,
  borrowing the monochrome pattern from appica.dev. That is a recorded state,
  not a requirement; the semantic tokens (error/success/warning/info) remain
  available and MUST be used for status feedback.
- Owner-recorded decisions, when made, are appended below. Current recorded
  decisions: RTL-first with fa/en; Geist + Geist Mono + Vazirmatn fonts.

## Owner decisions (append here as they are made)

- **2026-08-08 — مالک تصمیم گرفت:** برای صفحه‌ها/کامپوننت‌های جدید، منبع UI از Appica به
  **BEUI** تغییر کرد (`apps/admin-new/src/components/beui/` + مستندات beui.dev / MCP beui).
  کامپوننت‌های Appica برای ساخت جدید استفاده نمی‌شوند؛ کد موجود (شل فعلی و صفحات قبلی)
  تا بازسازی بعدی دست‌نخورده می‌ماند. توکن‌های تم فعلی همچنان پایه‌اند.

## Mandatory build workflow (read before writing any UI code)

### Step 1 — Research: source of truth is Appica

- Read the official Appica docs saved in this folder: `FULL-SPEC.md`,
  `FULL-SPEC-INDEX.md`, `references/`. Read the relevant sections completely:
  Colors, Forms & Validation, Animation, RTL, Accessibility, Theming, and the
  component pages for whatever you need.
- If the saved copy is unclear, incomplete or stale, search the internet for
  the official Appica docs (appica.dev / github.com/appica-dev/appica-ui) and
  verify what actually exists and how it is meant to be used.
- Never decide "we should use X" from memory; verify it in the official docs.
- **Full-catalog sweep (mandatory):** before choosing anything, scan the whole
  component list in `FULL-SPEC-INDEX.md` (56+ component types) and note every
  component that could serve the need — including the expressive ones
  (Thumbnail, PreviewCard, Sparkline, Meter, Progress, Popover, Chip,
  Toggle/ToggleGroup, ButtonGroup, Breadcrumb, CopyButton, NumberField,
  Pagination, Autocomplete, Collapsible, GradientGlow, TextAnimate, Carousel,
  Calendar/Date/Time fields, Slider, Radio, …). Picking the first familiar
  component without checking the rest is a failed research step.

### Step 2 — Plan: decide before you draw

Before writing any UI code, produce a short design plan:

- What each screen/element needs: data, states, actions.
- Which Appica component/token exists for each need (verified in Step 1) and
  exactly how it will be used: variant, size, placement, animation,
  accessibility.
- How status semantics are handled: success → green, error → red,
  warning → amber, info → blue, using Appica's role-based tokens and components
  (Badge, Alert, Toast, FieldError, …).
- Loading, empty, error, focus, RTL and reduced-motion handling for every screen.
- For each element, list at least 2–3 candidate Appica patterns and state why
  the chosen one is the best (expressiveness, clarity, motion, a11y, fit).
  "It works" is not a justification.

The plan is written down before the code. If implementation proves the plan
wrong, update the plan first, then the code.

### Step 3 — Implement

- Follow the plan exactly. Subpath imports, i18n, logical CSS, no invented
  color classes.
- Use Appica's actual components for what they are for: in-page messages →
  `Alert`; transient results → `Toast`; field errors → `FieldError`;
  destructive confirmation → `AlertDialog`; status → `Badge` variants; and so
  on — each still verified against the docs in Step 1.

### Step 4 — Inspect: judge your own work as an expert

After implementing, switch roles to an expert UI/UX/product inspector and
review the result against the plan and professional standards:

- Does every user-facing state have the right semantic treatment (success green,
  error red, warning amber, info blue)?
- Are loading, empty, error and focus states present and consistent?
- Is the component choice the documented Appica pattern, or a custom
  reinvention where Appica already has the piece?
- RTL, reduced motion, aria-labels, keyboard access?
- Is the flow obvious and professional from a product perspective?
- **Richness check:** is this the most expressive, eye-pleasing Appica pattern
  for the need, or the laziest one that happens to work? Would Thumbnail /
  PreviewCard / Sparkline / Meter / Progress / Popover / Chip / GradientGlow /
  motion utilities elevate it without hurting clarity or accessibility? If yes,
  use them.
- **Creativity check:** did the result surprise in a good way, or is it a plain
  table/button/input stack? A professional screen stays rich through states,
  previews, micro-interactions and meaningful visuals.

If any check fails, fix it and re-inspect. Only report the work as done after
the inspector approves it.

## Lab mechanics

For Review Lab specifics (file layout, the `{actions,queries,types}.ts` triad,
i18n, RTL, keeping the build green), see
`apps/admin-new/src/components/lab/CONVENTIONS.md` — it is the lab's mechanical
checklist, not the design authority.
