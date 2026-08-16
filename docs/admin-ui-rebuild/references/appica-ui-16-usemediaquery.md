# useMediaQuery (/ui/docs/react/use-media-query)



`useMediaQuery` tells you whether a CSS media query currently matches and
re-renders when that changes. It's SSR-safe and works in any React environment —
Vite, CRA, Next.js, Remix, Astro.

```tsx
import { useMediaQuery } from '@appica/ui-react/hooks/use-media-query'
```

## Usage [#usage]

A common pattern: render a `Dialog` on desktop and a `Drawer` on mobile.

```tsx
'use client'

import { useMediaQuery } from '@appica/ui-react/hooks/use-media-query'

function Responsive() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopDialog /> : <MobileDrawer />
}
```

## Signature [#signature]

```ts
useMediaQuery(query: string, options?: { defaultValue?: boolean }): boolean
```

| Parameter              | Type      | Default | Description                                                               |
| ---------------------- | --------- | ------- | ------------------------------------------------------------------------- |
| `query`                | `string`  | —       | The media query to evaluate                                               |
| `options.defaultValue` | `boolean` | `false` | Value returned on the server and the first client render before hydration |

<Callout type="note">
  On the server and during the first client render `window.matchMedia` isn't available, so the hook returns
  `defaultValue`. The real value resolves on hydration via `useSyncExternalStore`. Set `defaultValue` to your most
  likely case to minimize layout shift.
</Callout>
