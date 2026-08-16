# FULL-SPEC.md — Section Index

`FULL-SPEC.md` contains the complete official Appica UI documentation (20 guides +
62 component pages, 82 sections). Line numbers below point into that file; use
`sed -n '<start>,<end>p'` or jump straight to the heading with `rg -n '^# <title>'`.

> Note: this index is a navigation aid into the SAVED official Appica docs.
> Before any design decision, read the relevant sections completely. If the
> saved copy is stale or unclear, consult the official Appica docs online
> (appica.dev / github.com/appica-dev/appica-ui) and update the copy.

## Guides (/ui/docs/react/*)

| Section | Line |
| --- | --- |
| Accessibility | 2 |
| Animation | 91 |
| Colors | 208 |
| Composition | 314 |
| Dark Mode | 462 |
| Direction Provider | 575 |
| Fonts | 619 |
| Forms & Validation | 814 |
| Installation | 981 |
| Reduced Motion Provider | 1139 |
| Right-to-Left (RTL) | 1187 |
| Theme Provider | 1303 |
| Theming | 1380 |
| Usage | 1508 |
| useDirection | 1622 |
| useDismissible | 1659 |
| useLocalStorage | 1722 |
| useMediaQuery | 1791 |
| useReducedMotion | 1836 |
| useTheme | 1877 |

## Components (/ui/components/react/*)

| Section | Line |
| --- | --- |
| Accordion | 1934 |
| Alert Dialog | 2347 |
| Alert | 2693 |
| Autocomplete | 3012 |
| Avatar | 3640 |
| Background Pattern | 3998 |
| Badge | 4180 |
| Breadcrumb | 4436 |
| Button Group | 4848 |
| Button | 5049 |
| Calendar | 5248 |
| Carousel | 5412 |
| Checkbox | 6675 |
| Chip | 6936 |
| Collapsible | 7242 |
| Combobox | 7626 |
| Context Menu | 8659 |
| Copy Button | 9108 |
| Countdown | 9260 |
| Data Table (recipe, TanStack Table) | 9514 |
| Date Field | 10142 |
| Date Picker | 10323 |
| Dialog | 10592 |
| Drawer | 11190 |
| Dropdown Menu | 11651 |
| Field | 12606 |
| Form | 12847 |
| Gradient Glow | 13083 |
| Input | 13319 |
| Kbd | 13524 |
| Loader | 13776 |
| Menubar | 14023 |
| Meter | 14738 |
| Navigation Menu | 15011 |
| Navigation | 15763 |
| Number Field | 16191 |
| OTP Field | 16415 |
| Pagination | 16716 |
| Popover | 17129 |
| Preview Card | 17516 |
| Progress | 17777 |
| Radio | 18041 |
| Scroll Area | 18304 |
| Select | 18534 |
| Separator | 19127 |
| Skeleton | 19319 |
| Slider | 19572 |
| Sparkline | 19784 |
| Spinner | 20136 |
| Switch | 20401 |
| Table | 20585 |
| Tabs | 21166 |
| Text Animate | 21550 |
| Textarea | 21957 |
| Thumbnail | 22158 |
| Time Field | 22467 |
| Toast | 22648 |
| Table of Content (TOC) | 23201 |
| Toggle Group | 23614 |
| Toggle | 23939 |
| Toolbar | 24136 |
| Tooltip | 24473 |

## Key facts extracted so far (for quick orientation)

- **Token model**: raw value tokens per theme (`:root`/`.light` and `.dark`) +
  `@theme inline` aliases. Override **raw** tokens (`--primary`, `--background`,
  `--radius`, `--font-sans`, …), never the `--color-*` aliases.
- **Colors are role-based** (foreground/background/border + primary, secondary,
  error, success, warning, info) with a shared scale: subtle, soft, muted, base,
  strong, emphasis, intense, foreground. All in oklch.
- **Radius**: single `--radius` base drives the whole scale via calc().
- **Dark mode**: class-based (`.dark` on `<html>`), managed by `ThemeProvider`
  (no-flash inline script, `suppressHydrationWarning` expected on `<html>`).
- **RTL**: set `dir` on `<html>` + wrap in `DirectionProvider`; use logical CSS
  properties (`ps/pe/ms/me/start/end`). Floating popups portal to `<body>` and
  follow the document direction.
- **Fonts**: load font, then override `--font-sans`/`--font-mono` at `:root`
  (e.g. `--font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;`).
- **Forms**: `Field` (label/description/error + a11y wiring) and `Form`
  (server errors, uncontrolled inputs by default). `Fieldset` for groups.
- **Composition**: `render` prop swaps elements (keep semantics); exported
  variants helpers (`buttonVariants`, `inputVariants`, `navigationLinkVariants`)
  style any element like a component. `className` on the **wrapper**, structural
  props on the inner JSX. tailwind-merge dedupes conflicting classes.
- **Data Table is NOT a packaged component**: it is a recipe using
  `@tanstack/react-table` (must be installed separately) + Appica Table/Checkbox/
  Badge/Dropdown Menu/Scroll Area. The docs example also imports icons from
  `@appica/icons-react` (installed in this repo and already used across admin-new).
- **Not present in docs/package**: Command/⌘K palette, Sidebar, EmptyState,
  Stepper, DataList. These must be built custom if the design needs them.
