# Theming (/ui/docs/react/theming)



Appica UI is themed entirely through CSS custom properties — design tokens. There
are no theme objects to import and no JavaScript config: you override a few CSS
variables and every component updates. This is what `@appica/ui-react/styles.css`
brings in.

## How tokens are structured [#how-tokens-are-structured]

Tokens live in two layers, and understanding the split is the key to customizing
safely.

**1. Raw value tokens** hold the actual values, defined per theme. `:root` (and
`.light`) hold the light values; `.dark` holds the dark ones.

```css
:root,
.light {
  --primary: oklch(0.21 0.034 264.665);
  --background: oklch(1 0 0);
  --radius: 0.875rem;
}

.dark {
  --primary: oklch(1 0 0);
  --background: oklch(0.13 0.028 261.692);
}
```

**2. Theme tokens** alias those raw values inside Tailwind's `@theme inline`
block, which is what generates the utility classes.

```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  --radius-lg: calc(var(--radius) + 0.125rem);
}
```

The `inline` keyword matters: it tells Tailwind to inline the raw token into each
utility instead of pointing it at a `--color-*` variable. So `bg-primary` compiles
to `background-color: var(--primary)` — not `var(--color-primary)`. The upshot is
that `bg-primary` and `text-foreground` resolve to the right value and flip
automatically between light and dark, because the raw layer changes underneath.
There's no `--color-primary` custom property to reference at runtime, though — when
you need a token in plain CSS, reach for the **raw** token (`var(--primary)`).

<Callout type="note">
  Override the <strong>raw</strong> tokens (`--primary`), not the theme tokens (`--color-primary`). The theme layer is
  derived — editing it would break the light/dark mapping.
</Callout>

## Recoloring [#recoloring]

Redefine any raw token after the import. To change the brand color:

```css title="globals.css"
@import 'tailwindcss';
@import '@appica/ui-react/styles.css';

@source '@appica/ui-react';

:root {
  --primary: oklch(0.62 0.21 28); /* a warm red */
}

.dark {
  --primary: oklch(0.7 0.18 28);
}
```

Colors use [oklch](https://oklch.com) for perceptually uniform lightness, which
keeps tints and shades consistent across hues. See [Colors](/ui/docs/react/colors)
for the full palette and the semantic roles each token plays.

## Radius [#radius]

A single base token, `--radius`, drives the entire corner-radius scale. Every
step (`--radius-xs` through `--radius-4xl`) is derived from it with `calc()`, so
changing one value rescales every component at once.

```css
:root {
  --radius: 0.5rem; /* sharper corners everywhere */
}
```

Use the scale through Tailwind utilities (`rounded-lg`, `rounded-2xl`) or the
variables directly (`var(--radius-md)`).

## Other token groups [#other-token-groups]

The same pattern covers the rest of the design language:

| Group          | Example tokens                            | Utilities                |
| -------------- | ----------------------------------------- | ------------------------ |
| Typography     | `--font-sans`, `--font-mono`, `--text-sm` | `font-sans`, `text-sm`   |
| Shadows        | `--shadow-sm` … `--shadow-2xl`            | `shadow-sm`, `shadow-xl` |
| Border width   | `--border-width`                          | `border`                 |
| Disabled state | `--opacity-disabled`                      | applied by components    |

Override any of them the same way — redefine the raw token after the import.

## Using tokens in your own UI [#using-tokens-in-your-own-ui]

Because the tokens are plain CSS variables, your own components can share the
exact look of Appica UI. Reach for the Tailwind utilities, or reference the raw
tokens directly — `var(--primary)` in CSS, or the `(--token)` shorthand in a
utility (`text-(--primary)`, *not* `text-(--color-primary)`):

```tsx
<div className="bg-background-subtle text-foreground border-border rounded-lg border p-4">
  Matches the system automatically — including in dark mode.
</div>

// Same token, referenced directly through the raw variable.
<div className="text-(--primary)">Brand-colored text</div>
```

## Next steps [#next-steps]

* [Colors](/ui/docs/react/colors) — every palette and semantic role.
* [Dark Mode](/ui/docs/react/dark-mode) — switch and persist themes.
