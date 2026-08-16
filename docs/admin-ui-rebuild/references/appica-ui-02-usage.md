# Appica UI — Usage (official doc)

> Source: `appica.dev/ui/docs/react/usage` (pasted by user, saved 2026-08-04).

Once Appica UI is installed, every component follows the same small set of
conventions. Learn them once and the whole library feels consistent.

## Importing components

Import each component from its own subpath. This keeps bundles minimal:

```tsx
import { Button } from '@appica/ui-react/button'
import { Input } from '@appica/ui-react/input'
import { Dialog, DialogTrigger, DialogContent } from '@appica/ui-react/dialog'
```

Every export is also available from the package root, convenient for prototyping:

```tsx
import { Button, Input } from '@appica/ui-react'
```

Prefer subpath imports in application code. Reserve the root import for quick
experiments.

## Variants and sizes

Visual style is controlled through a `variant` prop, dimensions through a `size`
prop. The available values differ per component, but the prop names stay
consistent:

```tsx
<Button variant="primary">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost" size="sm">Small ghost</Button>
```

Derive union types from component props rather than reaching for internals:

```tsx
import type { ComponentProps } from 'react'
import { Button } from '@appica/ui-react/button'

type ButtonVariant = ComponentProps<typeof Button>['variant']
```

## Styling and overrides

Components are themed entirely through design tokens, so they adapt to your
colors and dark mode automatically. For one-off tweaks, pass `className` — it's
merged intelligently (conflicting Tailwind utilities are de-duplicated), so your
class wins:

```tsx
<Button className="w-full rounded-full">Full width</Button>
```

## Composition

Most components accept a `render` prop to change the element they output — for
example, rendering a `NavigationLink` as your router's `Link`:

```tsx
import Link from 'next/link'
import { NavigationLink } from '@appica/ui-react/navigation'

<NavigationLink render={<Link href="/pricing" />}>Pricing</NavigationLink>
```

## Server Components

Appica UI works out of the box with React Server Components and the Next.js App
Router. Interactive components carry their own `'use client'` boundary
internally, so they can be imported directly into a Server Component:

```tsx
import { Button } from '@appica/ui-react/button'

export default function Page() {
  return <Button>Works in an RSC</Button>
}
```

You can't pass non-serializable props (`onClick`, `render={<ClientComponent />}`)
across the server/client boundary. Move interactivity into your own `'use client'`
component. Providers like `ThemeProvider` are client components — keep them in a
client boundary (root layout's `<body>` is fine).

On a client-only stack (Vite, CRA, SPA) there is no server/client split; `'use client'`
directives are a no-op there.

## Next steps

- Composition — the `render` prop in depth.
- Theming and Dark Mode.
- Forms & Validation — accessible forms.
