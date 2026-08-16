
# useTheme (/ui/docs/react/use-theme)



`useTheme` reads and sets the active theme. It returns the stored choice, the
resolved theme, the OS preference, and a setter — everything you need to build a
theme switcher.

```tsx
import { useTheme } from '@appica/ui-react/hooks/use-theme'
```

## Usage [#usage]

Guard theme-dependent UI with `mounted` so the first client render matches the
server output and you avoid a hydration mismatch:

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

## Return value [#return-value]

| Property        | Type                                                    | Description                                       |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `theme`         | `string \| undefined`                                   | The stored choice, possibly `'system'`            |
| `setTheme`      | `(value: string \| ((prev: string) => string)) => void` | Set the theme; persisted automatically            |
| `resolvedTheme` | `string \| undefined`                                   | What's actually applied — `'system'` resolved     |
| `systemTheme`   | `'light' \| 'dark' \| undefined`                        | The current OS preference                         |
| `themes`        | `string[]`                                              | Available theme names                             |
| `forcedTheme`   | `string \| undefined`                                   | The forced theme, if a provider pinned one        |
| `mounted`       | `boolean`                                               | `false` until the client mounts — guard themed UI |

<Callout type="note">
  Requires a [`ThemeProvider`](/ui/docs/react/theme-provider) ancestor. Without one, the hook returns inert values
  (`mounted` stays `false`) rather than throwing.
</Callout>