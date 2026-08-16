
# Fonts (/ui/docs/react/fonts)



Typography in Appica UI is driven by two design tokens — `--font-sans` and
`--font-mono` — exactly like colors and radii. Switching fonts is a two-part job:
**load** the font in your app, then **point the token at it**. The first part is
framework-specific; the second is one line of CSS that's the same everywhere.

## The default fonts [#the-default-fonts]

Out of the box, `@appica/ui-react/styles.css` sets both tokens to native system
font stacks:

```css
:root {
  --font-sans:
    ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
```

System fonts download nothing, render instantly, and never cause layout shift — a
good default. They feed Tailwind's `font-sans` / `font-mono` utilities through the
`@theme inline` block, and Tailwind's preflight applies `--font-sans` as the base
family for the whole document. So **overriding the raw `--font-sans` token re-fonts
your entire UI** — every component included.

<Callout type="note">
  Override the raw `--font-sans` token at `:root`, not its alias inside the `@theme inline` block. This mirrors how
  [Theming](/ui/docs/react/theming) treats colors and radii — the theme layer is derived, so the raw token is the one to
  redefine.
</Callout>

## The one line that always applies [#the-one-line-that-always-applies]

Whatever loads the font, you finish by redefining the raw token after the import,
keeping a fallback stack so text stays readable while the web font loads:

```css title="globals.css"
@import 'tailwindcss';
@import '@appica/ui-react/styles.css';

@source '@appica/ui-react';

:root {
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
}
```

The font name on the left of the fallback list must match whatever the loading step
below makes available — a `font-family` from `@font-face`, an `@fontsource` package,
or the CSS variable `next/font` generates. The rest of this guide is just the
different ways to get that name onto the page.

## Loading the font [#loading-the-font]

How you load a font depends on your framework. Next.js has a first-class font
pipeline (`next/font`); everywhere else you self-host with [Fontsource](https://fontsource.org)
or a plain `@font-face`. All of these self-host the files, which is faster and more
private than linking to a third-party CDN.

### Next.js — `next/font` [#nextjs--nextfont]

`next/font` downloads the font at build time, self-hosts it, and hands you a CSS
variable with zero layout shift. Use `next/font/google` for a Google font:

```tsx title="app/layout.tsx"
import { Geist } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  )
}
```

…or `next/font/local` for font files you ship yourself:

```tsx title="app/layout.tsx"
import localFont from 'next/font/local'

const brand = localFont({
  src: [
    { path: './fonts/Brand-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Brand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-brand',
  display: 'swap',
})
```

Either way, map the generated variable onto the Appica token:

```css title="app/globals.css"
:root {
  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
}
```

<Callout type="warning" title="Apply the variable, not the className">
  `next/font` only exposes `--font-geist` on the element you put `geist.variable` on (and its
  descendants), so apply it to `<html>`. Don't also spread `geist.className` onto `<body>` — that hardcodes
  the font on the body and bypasses the token, so component-level `font-mono` and any later override stop
  working. Pick the variable approach and let `--font-sans` flow through.
</Callout>

### Vite, TanStack Start, React Router 7 / Remix — Fontsource [#vite-tanstack-start-react-router-7--remix--fontsource]

These bundlers have no built-in font helper, so self-host with Fontsource — one npm
package per family, imported once:

<InstallTabs name="@fontsource-variable/geist" />

```ts title="src/main.tsx"
import '@fontsource-variable/geist'
```

```css title="src/index.css"
:root {
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}
```

The `font-family` Fontsource registers is shown on each font's page — variable fonts
use the `… Variable` suffix as above; static weights use the bare name (`'Geist'`).

### Any framework — local files with `@font-face` [#any-framework--local-files-with-font-face]

If you'd rather not add a dependency, declare the face yourself and drop the files in
your `public/` (or `static/`) folder. This works in every framework, including Astro:

```css title="globals.css"
@font-face {
  font-family: 'Brand Sans';
  src: url('/fonts/brand-sans.woff2') format('woff2');
  font-weight: 100 900; /* a single variable file */
  font-display: swap;
}

:root {
  --font-sans: 'Brand Sans', ui-sans-serif, system-ui, sans-serif;
}
```

<Callout type="tip" title="Prefer self-hosting over Google's link tag">
  You *can* load a font with Google's `<link href="https://fonts.googleapis.com/…">` snippet and it works
  anywhere, but it adds a third-party request, an extra DNS round-trip, and sends your visitors' IPs to
  Google. `next/font`, Fontsource, and `@font-face` all serve the files from your own origin — faster and
  privacy-friendly. Reach for the link tag only as a quick prototype.
</Callout>

## The monospace font [#the-monospace-font]

`--font-mono` works identically — load the font, then redefine the token. It feeds
`font-mono`, code blocks, and anything that opts into monospace:

```css
:root {
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

## Framework notes [#framework-notes]

The CSS override is identical everywhere; only the loading mechanism and where it
lives change:

| Framework                                                                                                   | How to load                        | Where                             |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| <span className="flex items-center text-nowrap"><FrameworkLogo name="nextjs" />Next.js (App Router)</span>  | `next/font` → CSS variable         | `app/layout.tsx` + `globals.css`  |
| <span className="flex items-center text-nowrap"><FrameworkLogo name="vite" />Vite / CRA</span>              | Fontsource import or `@font-face`  | `src/main.tsx` + `src/index.css`  |
| <span className="flex items-center text-nowrap"><FrameworkLogo name="tanstack" />TanStack Start</span>      | Fontsource import or `@font-face`  | root route + `src/styles/app.css` |
| <span className="flex items-center text-nowrap"><FrameworkLogo name="remix" />React Router 7 / Remix</span> | Fontsource import or `@font-face`  | `app/root.tsx` + `app/app.css`    |
| <span className="flex items-center text-nowrap"><FrameworkLogo name="astro" />Astro</span>                  | `@font-face` (or Astro's font API) | `src/styles/global.css`           |

Whatever the source, the contract is the same: make a `font-family` name resolvable
on the page, then put it first in `--font-sans` / `--font-mono` with the original
stack trailing as a fallback.

## Next steps [#next-steps]

* [Theming](/ui/docs/react/theming) — the token system fonts plug into.
* [Colors](/ui/docs/react/colors) — recolor with the same override pattern.
* [Dark Mode](/ui/docs/react/dark-mode) — switch and persist themes.