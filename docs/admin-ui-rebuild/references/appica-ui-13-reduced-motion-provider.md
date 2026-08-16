
# Reduced Motion Provider (/ui/docs/react/reduced-motion-provider)



`ReducedMotionProvider` opts a subtree out of animation. Components already honor
the OS `prefers-reduced-motion` setting on their own — this provider is the
explicit, global override (for a user preference toggle, demos, or tests).

```tsx
import { ReducedMotionProvider } from '@appica/ui-react/providers/reduced-motion-provider'
```

## Usage [#usage]

```tsx
<ReducedMotionProvider disableAnimations>
  <App />
</ReducedMotionProvider>
```

When `disableAnimations` is set, the provider writes a `data-disable-animations`
attribute to `<html>`. That's deliberate: it has to reach Base UI's portaled
popups, which render under `document.body` and so escape the React subtree.

## Two channels [#two-channels]

The provider drives motion through two coordinated channels:

* **CSS** — the `data-disable-animations` attribute on `<html>` triggers the
  `motion-reduce` variant page-wide (popups included). This is what stops
  component transitions. See [Animation](/ui/docs/react/animation).
* **JavaScript** — [`useReducedMotion`](/ui/docs/react/use-reduced-motion), scoped to
  this provider's React subtree, returns `true` so your own animation code can
  branch.

## Props [#props]

| Prop                | Type        | Default | Description                                              |
| ------------------- | ----------- | ------- | -------------------------------------------------------- |
| `disableAnimations` | `boolean`   | `false` | Force-disable animations regardless of the OS preference |
| `children`          | `ReactNode` | —       | The subtree to opt out of animation                      |

<Callout type="note">
  Leaving `disableAnimations` off doesn't re-enable motion for users who request reduced motion at the OS level — that
  preference is always respected. The provider can only make things *more* still, never less.
</Callout>