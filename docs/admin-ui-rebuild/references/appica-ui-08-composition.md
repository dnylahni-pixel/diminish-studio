
# Composition (/ui/docs/react/composition)



Appica UI components ship fully styled, but you often need them to *be* something
else — a navigation link that's actually your router's `Link`, a tooltip trigger
that's actually your own button. The `render` prop, inherited from
[Base UI](https://base-ui.com), makes that possible without losing the
component's styling or behavior.

For the related case of a plain link that should merely *look* like a button, use
the exported variant helpers instead — see [Links that look like a button](#links-that-look-like-a-button).

## Rendering as a different element [#rendering-as-a-different-element]

Pass an element to `render` and the component adopts it as its output, merging in
its own props, classes, and event handlers. For instance, render a `Badge` as an
`<a>` so a status chip becomes a real link:

```tsx
import { Badge } from '@appica/ui-react/badge'

// Renders an <a> styled as a badge.
export default function TagBadge() {
  return <Badge render={<a href="/tags/react" />}>React</Badge>
}
```

<Callout type="warning" title="Don't render links as buttons">
  This is safe because `Badge` adds no interactive semantics. `Button` is different — it *enforces* button
  semantics (`role`, keyboard handling), so rendering an `<a>` through it produces a link masquerading as a
  button, which misleads assistive tech. To make a link merely *look* like a button, style the `<a>` directly —
  see [Links that look like a button](#links-that-look-like-a-button).
</Callout>

## Rendering as a component [#rendering-as-a-component]

`render` also accepts a component element — ideal for framework routers. A
`NavigationLink` stays a link while delegating navigation to your router's `Link`:

```tsx
import Link from 'next/link'
import { NavigationLink } from '@appica/ui-react/navigation'

export default function PricingLink() {
  return <NavigationLink render={<Link href="/pricing" />}>Pricing</NavigationLink>
}
```

The same pattern composes the interactive parts of larger components. For
instance, make a tooltip's trigger your own button:

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@appica/ui-react/tooltip'
import { Button } from '@appica/ui-react/button'

export default function HintedButton() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Helpful hint</TooltipContent>
    </Tooltip>
  )
}
```

## Links that look like a button [#links-that-look-like-a-button]

Sometimes you don't want to *change* a component's element — you want a plain link
(or other element) to simply wear a component's styling. Don't reach for `render`
here: rendering an `<a>` through `Button` forces button semantics onto a link.
Instead, apply the exported `buttonVariants` classes directly to the element that
already has the right semantics:

```tsx
import { buttonVariants } from '@appica/ui-react/button'

// A real link that looks like a primary button.
<a href="/ui/docs" className={buttonVariants({ variant: 'primary', size: 'md' })}>
  Read the docs
</a>

// Works with a router Link too.
<Link href="/pricing" className={buttonVariants({ variant: 'outline' })}>
  View pricing
</Link>
```

<Callout type="note" title="Why not just render the link as a Button?">
  Links and buttons have different, non-interchangeable semantics: a link navigates, a button performs an
  action. The `render` prop is for adopting a *different element while keeping the component's role* — not for
  repainting a link as a button. Styling the `<a>` with `buttonVariants` keeps link semantics intact and gives
  you the identical look.
</Callout>

`buttonVariants` isn't the only one — several components export their variant
recipe for exactly this purpose:

| Helper                   | Import from                   | Style any element like             |
| ------------------------ | ----------------------------- | ---------------------------------- |
| `buttonVariants`         | `@appica/ui-react/button`     | Button (`variant`, `size`)         |
| `inputVariants`          | `@appica/ui-react/input`      | Input (`variant`, `size`, `state`) |
| `navigationLinkVariants` | `@appica/ui-react/navigation` | NavigationLink (`variant`, `size`) |

Each takes the same variant props as its component and returns a className string,
so they drop into any element and compose with your own classes through `cn` or a
template literal.

## Where to put `className` [#where-to-put-classname]

This is the one rule worth memorizing. When composing a render-prop wrapper:

* **Visual overrides** (`className`, `style`) go on the **wrapper**.
* **Structural/behavioral props** (`href`, `type`, `variant`, `size`, rendering as a different element) go on the JSX inside `render`.

```tsx
// ✅ Do — className on the wrapper
<TooltipTrigger
  className="rounded-full"
  render={<Button variant="ghost">Help</Button>}
/>

// ❌ Don't — className on the render JSX
<TooltipTrigger render={<Button variant="ghost" className="rounded-full">Help</Button>} />
```

<Callout type="warning" title="Why this matters">
  Putting `className` on the inner JSX can cause a **React hydration mismatch** in Server Components: the styled element
  is built on the server, serialized across the boundary, then cloned on the client, and the final class strings can
  disagree. Keeping `className` on the wrapper avoids it — and class precedence still works, since the wrapper's classes
  are merged last and win on conflicts.
</Callout>

If you specifically need a class on the inner element, extract the trigger into
its own `'use client'` component rather than promoting the whole page to client.

## Class merging [#class-merging]

Overrides are merged with [tailwind-merge](https://github.com/dcastil/tailwind-merge),
so conflicting utilities are de-duplicated and the last one wins. You don't need
to fight specificity:

```tsx
// `rounded-full` overrides the component's default radius cleanly.
<Button className="rounded-full px-8">Pill</Button>
```