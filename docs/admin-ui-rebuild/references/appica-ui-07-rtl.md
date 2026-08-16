# Right-to-Left (RTL) (/ui/docs/react/rtl)



Appica UI supports right-to-left layouts. Most mirroring happens automatically
through CSS logical properties; a few components that compute layout in
JavaScript read the direction from [`DirectionProvider`](/ui/docs/react/direction-provider).

## Two things to set [#two-things-to-set]

For full RTL support, set the direction in **two** places:

**1. The `dir` attribute** on `<html>`, so the browser mirrors text flow and
logical CSS resolves correctly:

```html
<html dir="rtl" lang="ar"></html>
```

**2. `DirectionProvider`**, so components that position elements with JavaScript
(Slider, Switch, Carousel, menus, and other floating surfaces) know which way is
"end":

```tsx title="app/layout.tsx (Next.js)"
import { DirectionProvider } from '@appica/ui-react/providers/direction-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  )
}
```

<Callout type="note">
  `DirectionProvider` defaults to `ltr`, so you only need it when supporting RTL. With no provider, components behave
  left-to-right.
</Callout>

The example uses Next.js's root layout; for the equivalent root file in Vite,
React Router / Remix, TanStack Start, and Astro, see the
[Framework notes](/ui/docs/react/installation#framework-notes) in Installation.

## Why most things "just work" [#why-most-things-just-work]

Appica UI styles with **logical** properties rather than physical ones — padding
and margins use `ps`/`pe` and `ms`/`me` (inline-start/end) instead of left/right,
and positioning uses `start`/`end`. These resolve against the document direction,
so a component laid out for LTR mirrors for RTL without any extra work.

Write your own RTL-ready markup the same way:

```tsx
// ✅ Mirrors automatically
<div className="ps-4 border-s-2 text-start">…</div>

// ❌ Stays put in RTL
<div className="pl-4 border-l-2 text-left">…</div>
```

## Floating popups in a scoped RTL region [#floating-popups-in-a-scoped-rtl-region]

Menus, selects, popovers, and other floating surfaces render in a **portal** at
the end of `<body>`. Their `start` / `end` **alignment** mirrors based on the
direction the portalled element inherits from the document — read from CSS by the
positioning engine, **not** from `DirectionProvider`. With `dir="rtl"` on `<html>`
(as above) this is automatic, so you never think about it.

It only matters when you scope RTL to a **subtree** of an otherwise-LTR page. The
popup escapes that subtree to the (LTR) `<body>`, so its alignment stays
left-to-right even though the submenu *side* still follows `DirectionProvider`.
Give the popup's positioner the direction explicitly, or portal it into your RTL
container:

```tsx
// Set the direction on the positioner…
<DropdownMenuContent positionerProps={{ dir: 'rtl' }}>…</DropdownMenuContent>

// …or render the popup inside your RTL container instead of <body>
<DropdownMenuContent container={rtlContainerRef}>…</DropdownMenuContent>
```

<Callout type="note">
  Prefer setting `dir="rtl"` on `<html>` whenever the whole document is RTL — then every floating popup mirrors with no
  per-component setup. The positioner override above is only for mixed LTR/RTL pages.
</Callout>

## Reading the direction in code [#reading-the-direction-in-code]

When your own component needs to branch on direction, read it with
[`useDirection`](/ui/docs/react/use-direction):

```tsx
'use client'

import { useDirection } from '@appica/ui-react/hooks/use-direction'

function NextIcon() {
  const dir = useDirection()
  return <span>{dir === 'rtl' ? '←' : '→'}</span>
}
```

## Switching at runtime [#switching-at-runtime]

To toggle direction without a full reload, update both the `<html dir>` attribute
and the `DirectionProvider` value together so the CSS and JS channels stay in
sync.

See [`DirectionProvider`](/ui/docs/react/direction-provider) and
[`useDirection`](/ui/docs/react/use-direction) for the full reference.
