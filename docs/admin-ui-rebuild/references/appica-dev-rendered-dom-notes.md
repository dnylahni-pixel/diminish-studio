# appica.dev Rendered DOM — pattern notes

> Source: user-pasted HTML dump of https://appica.dev/ui/components/react/autocomplete (2026-08-04).
> Raw dump: `/home/danial/.codex/attachments/5810feb5-0673-4144-9453-d07a79e60833/pasted-text.txt`

What it is: the real rendered DOM of the Appica docs page. Useful as the ground truth
for class names, slots, and composition before writing our own markup.

## Page-level layout (docs site)

- `<main class="container flex flex-1 items-start gap-10 pt-10 pb-12 sm:px-6 ...">`
  with an `<article class="min-w-0 flex-1">` content column, a "Customize" aside
  (`hidden ... 2xl:block`) and a right TOC `<nav>` inside a vertical `ScrollArea`.
- Playground is a `Tabs` with `Preview` / `Code` triggers and a custom `DrawerTrigger`
  for mobile ("Customize" button, `2xl:hidden`).

## Component patterns observed

- **Button** (ghost/outline): long class list; key utilities: `bg-background`,
  `text-foreground-emphasis`, `hover:text-foreground-intense`, `before:bg-background`,
  `before:border-border`, `hover:before:bg-background-subtle`,
  `hover:before:border-border-strong`, `outline-ring`, `motion-reduce:transition-none`,
  press effect: `not-data-popup-open:active:scale-[0.97] ... translate-y-px`.
- **Tabs**: `TabsList` on `bg-background-muted` with an absolutely positioned
  `TabsIndicator` (white pill, `shadow-lg`) driven by CSS vars
  (`--active-tab-left/right/width`), RTL-aware (`rtl:-translate-x-(--active-tab-right)`).
- **Input/Autocomplete**: `role="group"` wrapper `bg-background border-border-strong
  h-10 px-3.5 text-sm rounded-md gap-2 flex items-center`, focus ring via
  `has-focus:ring-[3px] has-focus:ring-ring-input`; error state via
  `data-invalid:bg-error-subtle data-invalid:border-error`.
- **Select**: trigger `bg-background-muted border-transparent` (soft variant),
  `data-placeholder:text-foreground-subtle`, `flex items-center justify-between w-full`.
- **Drawer trigger**: same Button classes + `aria-haspopup="dialog"`.
- **Tooltip trigger**: ghost icon button; `TooltipProvider` wraps.
- **ScrollArea**: scrollbar is `absolute inset-inline-end-0`, thumb `bg-background-strong`,
  `data-[hovering]` / `data-[scrolling]` visibility, width `w-1.25 hover:w-2`.
- **Progress (circular)**: `role="progressbar"`, track `stroke-background-strong`,
  indicator stroke `var(--progress-color)` with `transition-[stroke-dashoffset]`.
- **GradientGlow**: `data-slot="gradient-glow"` + aura/border spans with a
  conic/linear gradient (#8EC5FF → #EFADF7 → #FFD69B), hover-revealed
  (`group-hover/glow:opacity-(--gradient-glow-opacity)`).
- **TOC links**: `text-foreground-muted ... hover:text-foreground-intense
  data-active:text-foreground-intense`, `py-1.5 text-sm`, indent via `ps-4/ps-7`.
- **RTL/motion discipline**: every interactive element carries logical utilities
  (`ms/me/ps/pe/start/end`) and `motion-reduce:transition-none`.

Use these exact utility patterns when hand-styling shell pieces (sidebar links,
header buttons, active states) so they match Appica visually.
