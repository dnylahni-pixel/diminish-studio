# useReducedMotion (/ui/docs/react/use-reduced-motion)



`useReducedMotion` returns `true` when animations should be skipped. Use it in
JavaScript-driven animation (e.g. with [Motion](https://motion.dev)) — for CSS,
the `motion-safe`/`motion-reduce` variants handle this automatically (see
[Animation](/ui/docs/react/animation)).

```tsx
import { useReducedMotion } from '@appica/ui-react/hooks/use-reduced-motion'
```

## Usage [#usage]

```tsx
'use client'

import { useReducedMotion } from '@appica/ui-react/hooks/use-reduced-motion'

function Reveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return <div style={{ transition: reduced ? 'none' : 'opacity 300ms ease' }}>{children}</div>
}
```

## Return value [#return-value]

Returns a `boolean` — `true` when motion should be reduced. It's `true` if
**either**:

* the OS exposes `prefers-reduced-motion: reduce`, or
* a [`ReducedMotionProvider`](/ui/docs/react/reduced-motion-provider) ancestor set
  `disableAnimations`.

<Callout type="note">
  Works without a provider — it falls back to the OS preference alone. Add a `ReducedMotionProvider` only when you want
  a way to force-disable motion beyond the system setting.
</Callout>
