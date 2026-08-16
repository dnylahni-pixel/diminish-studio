
# Theme Provider (/ui/docs/react/theme-provider)



`ThemeProvider` owns the active theme. It applies the theme class to `<html>`,
persists the choice to storage, optionally follows the OS preference, and injects
an inline script that sets the theme **before first paint** so there's no flash.

```tsx
import { ThemeProvider } from '@appica/ui-react/providers/theme-provider'
```

## Usage [#usage]

Wrap your app once, as high as possible — at your app's root, inside `<body>`.
The example below uses Next.js's root layout; for the equivalent file in Vite,
React Router / Remix, TanStack Start, and Astro, see the
[Framework notes](/ui/docs/react/installation#framework-notes) in Installation.

```tsx title="app/layout.tsx (Next.js)"
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

Read and change the theme anywhere below it with [`useTheme`](/ui/docs/react/use-theme).
For building a toggle, see [Dark Mode](/ui/docs/react/dark-mode).

<Callout type="note">
  Nesting `ThemeProvider` is safe — inner providers are a passthrough. Only the outermost one owns state, so you can use
  a nested provider purely to set `forcedTheme` on a subtree.
</Callout>

## Props [#props]

| Prop                        | Type                     | Default                      | Description                                                  |
| --------------------------- | ------------------------ | ---------------------------- | ------------------------------------------------------------ |
| `themes`                    | `string[]`               | `['light', 'dark']`          | Available theme names                                        |
| `defaultTheme`              | `string`                 | `'system'` if `enableSystem` | Theme used before a choice is stored                         |
| `forcedTheme`               | `string`                 | —                            | Force a theme for the whole subtree (overrides storage + OS) |
| `enableSystem`              | `boolean`                | `true`                       | Respect the OS `prefers-color-scheme`                        |
| `enableColorScheme`         | `boolean`                | `true`                       | Set `color-scheme` on `<html>` so native UI matches          |
| `disableTransitionOnChange` | `boolean`                | `false`                      | Suppress CSS transitions during a theme switch               |
| `storageKey`                | `string`                 | `'theme'`                    | `localStorage` key for the persisted choice                  |
| `value`                     | `Record<string, string>` | —                            | Map a theme name to a custom class applied on `<html>`       |
| `nonce`                     | `string`                 | —                            | CSP nonce forwarded to the inline script                     |
| `scriptProps`               | `ScriptHTMLAttributes`   | —                            | Extra props for the inline `<script>`                        |

## Custom theme names [#custom-theme-names]

`themes` plus `value` let you ship themes beyond light/dark. `value` maps each
name to the class written on `<html>`:

```tsx
<ThemeProvider themes={['light', 'dark', 'sepia']} value={{ light: 'light', dark: 'dark', sepia: 'theme-sepia' }}>
  {children}
</ThemeProvider>
```

Define the matching token overrides for `.theme-sepia` in your stylesheet — see
[Theming](/ui/docs/react/theming).

## Preventing flash [#preventing-flash]

The provider renders a tiny synchronous `<script>` that reads the stored theme
and sets the class before the page paints. That's why `<html>` needs
`suppressHydrationWarning`: the script intentionally changes one attribute before
React hydrates. The first post-mount render is skipped so it can't re-introduce a
flash from the hydration default.