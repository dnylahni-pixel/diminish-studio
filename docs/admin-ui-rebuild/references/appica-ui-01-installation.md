# Appica UI — Installation (official doc)

> Source: `appica.dev/ui/docs/react/installation` (pasted by user, saved 2026-08-04).

Appica UI ships as a single tree-shakeable package. Components are built on
[Base UI](https://base-ui.com) primitives and styled with Tailwind CSS v4 design
tokens, so installation is two steps: add the package, then point Tailwind at it.

## Prerequisites

| Dependency   | Version  |
| ------------ | -------- |
| React        | `>= 19`  |
| React DOM    | `>= 19`  |
| Tailwind CSS | `>= 4.0` |

React 19 is a hard requirement: components use the modern ref-as-prop API and
other React 19 patterns, with no `forwardRef` shims.

Tailwind v4 must be working first. Appica UI doesn't bundle Tailwind — it relies
on your project's Tailwind to compile component styles. Set up Tailwind v4
(`@tailwindcss/vite` for Vite, `@tailwindcss/postcss` for PostCSS/Next.js) and
confirm `@import 'tailwindcss';` generates utilities.

## Install

```bash
pnpm add @appica/ui-react
```

## Configure Tailwind

Import the design tokens after Tailwind in your global stylesheet, and add a
`@source` directive so Tailwind scans the compiled library for class names:

```css
@import 'tailwindcss';
@import '@appica/ui-react/styles.css';

@source '../node_modules/@appica/ui-react/dist';
```

`@source` takes a path or glob **relative to the stylesheet that contains it**.
Tailwind ignores `node_modules` by default; without `@source` the components
render unstyled.

The `styles.css` import brings in the full token system — colors, radii, shadows,
typography, and the `light`/`dark` themes.

### Why there's no prebuilt CSS to import

- One deduplicated build: utilities are generated in the same pass as your own.
- Only what you use: Tailwind tree-shakes across app and library together.
- Your tokens win: overrides to design tokens flow into the components
  automatically because classes compile against your Tailwind config.
- No version-locked CSS.

## Add the provider

```tsx
import { ThemeProvider } from '@appica/ui-react/providers/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

ThemeProvider injects a small inline script so the stored theme applies before
first paint (no flash). Optional providers: `DirectionProvider` (RTL) and
`ReducedMotionProvider`.

## Framework notes

| Framework | Tailwind plugin | Global stylesheet | Provider location |
| --- | --- | --- | --- |
| Next.js (App Router) | `@tailwindcss/postcss` | `app/globals.css` | root layout `<body>` |
| Vite / CRA | `@tailwindcss/vite` | `src/index.css` | root component in `main.tsx` |
| TanStack Start | `@tailwindcss/vite` | `src/styles/app.css` | root route component |
| React Router 7 / Remix | `@tailwindcss/vite` | `app/app.css` | root component in `root.tsx` |
| Astro | `@tailwindcss/vite` | `src/styles/global.css` | island + head-level theme class |

## Use a component

```tsx
import { Button } from '@appica/ui-react/button'
```

Subpath imports keep bundles minimal.

## Next steps

- Usage — import conventions, variants, composition.
- Theming — customize colors, radii, tokens.
- Dark Mode — theme toggle.
- Components — full catalog.
