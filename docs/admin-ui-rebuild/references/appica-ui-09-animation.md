
# Animation (/ui/docs/react/animation)



Components in Appica UI animate their open, close, and state changes out of the
box. Most of this motion is plain CSS, but a few components use
[Motion](https://motion.dev) when an interaction needs smoother, interruptible
animation. In both cases, if the user has asked their system to reduce motion,
the animations are turned off automatically — see [Reduced motion](#reduced-motion).

## State-driven transitions [#state-driven-transitions]

Interactive components expose their state as `data-*` attributes — `data-open`,
`data-closed`, `data-starting-style`, `data-ending-style`, and so on. Transitions
hang off those attributes through Tailwind's `data-*` variants, so enter and exit
animations are just utility classes — no animation library required:

```tsx
// The pattern components use internally
<div
  className={cn(
    'transition-[opacity,scale] duration-200 motion-reduce:transition-none',
    'data-starting-style:scale-95 data-starting-style:opacity-0',
    'data-ending-style:scale-95 data-ending-style:opacity-0',
  )}
/>
```

The element starts and ends scaled-down and transparent, and animates to its
natural state while open. Because exit is just another state
(`data-ending-style`), elements animate out before they unmount. The single
`motion-reduce:transition-none` is what drops the animation when the user prefers
reduced motion — see below.

## Reduced motion [#reduced-motion]

Every animated component is reduced-motion aware. Most disable their transition
in one line with `motion-reduce:transition-none`; a few instead gate each rule
behind `motion-safe:`. Both rely on the same pair of custom variants the library
defines:

```css
@custom-variant motion-reduce {
  @media (prefers-reduced-motion: reduce) {
    @slot;
  }
  &:is([data-disable-animations] *) {
    @slot;
  }
}

@custom-variant motion-safe {
  @media (prefers-reduced-motion: no-preference) {
    &:not([data-disable-animations] *) {
      @slot;
    }
  }
}
```

This means animations are skipped in two situations: when the OS requests reduced
motion, **or** when a [`ReducedMotionProvider`](/ui/docs/react/reduced-motion-provider)
sets `data-disable-animations` — which also reaches portaled popups, since they
render outside the React tree.

Use the same variants in your own markup so it honors the preference too:

```tsx
// One-line opt-out — the common pattern
<div className="transition-transform duration-200 hover:scale-105 motion-reduce:transition-none">…</div>

// Or gate each rule with motion-safe:
<div className="hover:scale-105 motion-safe:transition-transform motion-safe:duration-200">…</div>
```

## Disabling animations globally [#disabling-animations-globally]

Wrap a subtree (or the whole app) to force-disable animation regardless of the OS
setting — useful for tests, demos, or a user preference toggle:

```tsx
import { ReducedMotionProvider } from '@appica/ui-react/providers/reduced-motion-provider'

export default function Providers({ children }) {
  return <ReducedMotionProvider disableAnimations>{children}</ReducedMotionProvider>
}
```

For JavaScript-driven animation (e.g. with Motion), read the resolved preference
with [`useReducedMotion`](/ui/docs/react/use-reduced-motion):

```tsx
'use client'

import { useReducedMotion } from '@appica/ui-react/hooks/use-reduced-motion'

function Reveal() {
  const reduced = useReducedMotion()
  return <div style={{ transition: reduced ? 'none' : 'opacity 300ms' }}>…</div>
}
```

## Customizing transitions [#customizing-transitions]

Tune timing per instance by overriding the relevant utilities through `className`
— tailwind-merge keeps the last value:

```tsx
<Dialog>
  <DialogContent className="motion-safe:duration-500">…</DialogContent>
</Dialog>
```

For larger durations, easing, and keyframes, override the corresponding tokens in
your stylesheet — see [Theming](/ui/docs/react/theming).