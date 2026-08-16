
# Accessibility (/ui/docs/react/accessibility)



Accessibility is built in, not bolted on. Appica UI wraps [Base UI](https://base-ui.com)
primitives, which implement the WAI-ARIA patterns — keyboard interaction, focus
management, and ARIA wiring — so the hard parts are handled. This page covers
what you get for free and the few things that remain your responsibility.

## What's handled for you [#whats-handled-for-you]

* **Keyboard interaction** — menus, listboxes, tabs, sliders, and dialogs
  implement the expected arrow-key, `Home`/`End`, `Escape`, and typeahead
  behavior, including roving `tabindex` within groups.
* **Focus management** — overlays (Dialog, Drawer, Popover) trap focus while open
  and restore it to the trigger on close.
* **ARIA wiring** — roles, `aria-expanded`, `aria-controls`, `aria-selected`, and
  label/description associations are set on the right elements.
* **Reduced motion** — every animation is reduced-motion aware (via
  `motion-reduce:transition-none` or `motion-safe:`), so motion is skipped for
  users who ask for it. See [Animation](/ui/docs/react/animation).

## Focus visibility [#focus-visibility]

A focus ring is applied globally on `:focus-visible` (keyboard focus), using the
ring tokens from [Colors](/ui/docs/react/colors#focus-rings). It stays out of the way for mouse
users and appears for keyboard users. Keep it intact — don't strip outlines from
interactive elements.

## Labeling controls [#labeling-controls]

Associate a visible label with a single control using `Field` and `FieldLabel`,
which wire up the `for`/`id` relationship automatically:

```tsx
import { Field, FieldLabel } from '@appica/ui-react/field'
import { Input } from '@appica/ui-react/input'

export default function EmailField() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input type="email" />
    </Field>
  )
}
```

<Callout type="warning" title="Groups need a different label">
  `FieldLabel` renders a `<label for>`, which targets a *single* control. For grouped components that have
  `role="group"` — `RadioGroup`, `CheckboxGroup`, `ToggleGroup` — a `<label>` can't point at the group. Label
  those with `aria-label` or `aria-labelledby` instead.
</Callout>

```tsx
<ToggleGroup aria-label="Text alignment">
  <Toggle value="left">Left</Toggle>
  <Toggle value="center">Center</Toggle>
</ToggleGroup>
```

Controls with no visible label (an icon-only button, a search field) still need an
accessible name — give them `aria-label`:

```tsx
<Button variant="ghost" size="icon-md" aria-label="Close" />
```

## Color contrast [#color-contrast]

The default light and dark palettes are tuned for legible contrast. If you
[recolor the system](/ui/docs/react/theming), re-check your accent and foreground
pairings against [WCAG](https://www.w3.org/WAI/WCAG22/quickref/) — especially the
`*-foreground` token that sits on a colored fill.

## Internationalization [#internationalization]

For right-to-left languages, mirror the UI with
[`DirectionProvider`](/ui/docs/react/rtl) so keyboard navigation and layout follow
the reading direction.

## Verify your own usage [#verify-your-own-usage]

The components are tested with `vitest-axe`, but composition is where issues
creep in. Audit your screens with the same tooling (axe, Lighthouse) and test
keyboard-only flows — the components give you a correct foundation, not a
guarantee that every assembled page is accessible.