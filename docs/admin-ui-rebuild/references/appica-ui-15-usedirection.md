# useDirection (/ui/docs/react/use-direction)



`useDirection` returns the current reading direction. Use it when your own
component needs to branch on direction — flipping a chevron, choosing an offset
sign, or mirroring a custom layout.

```tsx
import { useDirection } from '@appica/ui-react/hooks/use-direction'
```

## Usage [#usage]

```tsx
'use client'

import { useDirection } from '@appica/ui-react/hooks/use-direction'

function NextIcon() {
  const dir = useDirection()
  return <span>{dir === 'rtl' ? '←' : '→'}</span>
}
```

## Return value [#return-value]

Returns `'ltr' \| 'rtl'`. The value comes from the nearest
[`DirectionProvider`](/ui/docs/react/direction-provider), defaulting to `'ltr'` when
there is none.

<Callout type="tip">
  Prefer CSS logical properties (`ps`/`pe`, `ms`/`me`, `start`/`end`) for styling — they mirror automatically without a
  hook. Reach for `useDirection` only when the decision happens in JavaScript. See [RTL](/ui/docs/react/rtl).
</Callout>
