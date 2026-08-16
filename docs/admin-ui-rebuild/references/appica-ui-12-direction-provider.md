
# Direction Provider (/ui/docs/react/direction-provider)



`DirectionProvider` sets the reading direction for descendant components. It's a
thin wrapper over [Base UI](https://base-ui.com)'s direction provider, so your app
depends on `@appica/ui-react` rather than the underlying primitive.

```tsx
import { DirectionProvider } from '@appica/ui-react/providers/direction-provider'
```

## Usage [#usage]

Wrap your app at its root and set `dir`. For full RTL support, also set the `dir`
attribute on `<html>` so CSS logical properties and native text flow resolve
correctly — see [Right-to-Left (RTL)](/ui/docs/react/rtl). The example uses Next.js's
root layout; for the equivalent root file in other frameworks, see the
[Framework notes](/ui/docs/react/installation#framework-notes) in Installation.

```tsx title="app/layout.tsx (Next.js)"
<html lang="ar" dir="rtl">
  <body>
    <DirectionProvider dir="rtl">{children}</DirectionProvider>
  </body>
</html>
```

Descendant components read the value via [`useDirection`](/ui/docs/react/use-direction).
Components that position elements with JavaScript — Slider, Switch, Carousel, and
overlays like menus — rely on it to know which side is "end."

<Callout type="note">
  Optional. With no provider, components default to `ltr`. Reach for it only when supporting RTL.
</Callout>

## Props [#props]

| Prop       | Type             | Default | Description                                 |
| ---------- | ---------------- | ------- | ------------------------------------------- |
| `dir`      | `'ltr' \| 'rtl'` | `'ltr'` | Reading direction for descendant components |
| `children` | `ReactNode`      | —       | The subtree that should read this direction |