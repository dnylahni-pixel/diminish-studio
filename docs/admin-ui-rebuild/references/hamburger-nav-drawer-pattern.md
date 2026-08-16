# Hamburger Menu / Nav Drawer — pattern reference (NameThatUI)

> Source: https://namethatui.com/web/hamburger-menu (pasted by user, 2026-08-04).

## What it is

A hamburger button (three stacked lines, usually at the bar's edge) toggles an
off-canvas `<nav>` drawer that slides over the page above a scrim.

- ARIA contract: `aria-expanded` + `aria-controls` on the toggle button.
- HTML: drawer content is a `<nav>`.
- React equivalents: shadcn `Sheet side="left"`, Material `NavigationDrawer`.

Behaviors: body scroll locked while open, close on Escape / scrim tap,
`aria-expanded` kept in sync, focus returns to the button on close.

## Diminish Admin v2 variant — "drawer below the header" (user decision, 2026-08-04, final 2026-08-05)

> **Final shape (2026-08-05):** the owner re-confirmed a single **sliding sidebar on every screen
> size** — off-canvas, overlays the content (no layout push), always renders the full nav (no
> icon-only/collapsed variant). The dialog-like chrome is removed (`closeButton={false}`, no
> `DrawerHeader`/title). The "drawer below the header" details below apply.

User's requirement:

- The hamburger (sidebar toggle) button lives in the **header**.
- The header **never moves** and always keeps its full area (full width, top of screen).
- The sidebar/drawer opens **below the header** — its top edge starts under the header;
  the scrim covers the content area only, not the header.

Implementation implication: restructure the shell from
`[aside | header+main]` to a top-header layout:

```text
┌──────────────────────────────────┐
│           Header (full width)    │
├───────────────┬──────────────────┤
│ Sidebar       │ Main content     │
│ (below header)│                  │
└───────────────┴──────────────────┘
```

On mobile, the Drawer panel gets a top offset equal to the header height
(e.g. `top-11`) so it slides in below the header instead of covering it.
