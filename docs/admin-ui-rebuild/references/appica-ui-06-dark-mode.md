
# Dark Mode (/ui/docs/react/dark-mode)



Appica UI is dark-mode-ready out of the box. The token system ships both a light
and a dark palette; switching themes is a matter of toggling a class on the
`<html>` element, which [`ThemeProvider`](/ui/docs/react/theme-provider) manages for
you — including persistence and a no-flash first paint.

## How it works [#how-it-works]

Dark mode is **class-based**. When the `dark` class is on a `<html>` ancestor,
the dark token values apply. The library defines the variant as:

```css
@custom-variant dark (&:is(.dark *));
```

So you can write dark-only utilities in your own markup too:

```tsx
<div className="bg-background text-foreground dark:shadow-xl">…</div>
```

## Setup [#setup]

Wrap your app in `ThemeProvider` at your app's root (covered in
[Installation](/ui/docs/react/installation)). It applies the correct class before
the page paints, so there's no flash of the wrong theme on load. The example
uses Next.js's root layout — see the
[Framework notes](/ui/docs/react/installation#framework-notes) for where this file
lives in Vite, React Router / Remix, TanStack Start, and Astro:

```tsx title="app/layout.tsx (Next.js)"
import { ThemeProvider } from '@appica/ui-react/providers/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

<Callout type="note">
  `suppressHydrationWarning` on `<html>` is expected: the no-flash script sets the theme class before React
  hydrates, so the server and client markup intentionally differ by that one attribute.
</Callout>

By default `ThemeProvider` follows the OS preference (`enableSystem`) and persists
the user's choice under the `theme` key in `localStorage`.

## Building a theme toggle [#building-a-theme-toggle]

Read and set the theme with [`useTheme`](/ui/docs/react/use-theme). Guard
theme-dependent UI with `mounted` so the server-rendered output matches the first
client render:

```tsx title="theme-toggle.tsx"
'use client'

import { useTheme } from '@appica/ui-react/hooks/use-theme'
import { Button } from '@appica/ui-react/button'
import { SunHigh, MoonStars } from '@appica/icons-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme, mounted } = useTheme()

  // Avoid rendering theme-specific content until mounted.
  if (!mounted) return <Button variant="ghost" size="icon-md" aria-label="Toggle theme" />

  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  return (
    <Button variant="ghost" size="icon-md" aria-label="Toggle theme" onClick={() => setTheme(next)}>
      {resolvedTheme === 'dark' ? <MoonStars /> : <SunHigh />}
    </Button>
  )
}
```

* `theme` is the stored choice, which may be `'system'`.
* `resolvedTheme` is what's actually applied — `'system'` resolved to `'light'` or `'dark'`.
* `systemTheme` is the current OS preference.

## Common options [#common-options]

`ThemeProvider` accepts several props to tune behavior:

| Prop                        | Default                        | Description                                       |
| --------------------------- | ------------------------------ | ------------------------------------------------- |
| `defaultTheme`              | `'system'` (if `enableSystem`) | Theme used before the user makes a choice         |
| `enableSystem`              | `true`                         | Follow the OS `prefers-color-scheme`              |
| `storageKey`                | `'theme'`                      | `localStorage` key for the persisted choice       |
| `forcedTheme`               | —                              | Pin a theme for a subtree (e.g. a marketing page) |
| `disableTransitionOnChange` | `false`                        | Suppress CSS transitions during the switch        |
| `enableColorScheme`         | `true`                         | Set `color-scheme` so native controls match       |

To force a single theme on a specific route, nest another provider with
`forcedTheme`:

```tsx
<ThemeProvider forcedTheme="dark">
  <MarketingPage />
</ThemeProvider>
```

See [`ThemeProvider`](/ui/docs/react/theme-provider) for the full prop reference and
[`useTheme`](/ui/docs/react/use-theme) for the hook.