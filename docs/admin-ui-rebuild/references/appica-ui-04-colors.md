# Colors (/ui/docs/react/colors)



Appica UI's palette is organized by **role**, not by hue. Instead of `blue-500`,
you use `primary` or `info-emphasis`. This keeps components meaningful and lets a
single token override retheme the whole system. Every color is defined in
[oklch](https://oklch.com) and is overridable — see [Theming](/ui/docs/react/theming).

Each color is exposed as a Tailwind utility (`bg-*`, `text-*`, `border-*`) and as
a raw CSS variable named after the role — `var(--primary)`, `var(--foreground)`,
and so on. See [Theming](/ui/docs/react/theming#using-tokens-in-your-own-ui).

## Base colors [#base-colors]

The grayscale foundation of every layout: backgrounds, text, and borders. Each family
is a scale from subtle to intense.

### Foreground (text & icons) [#foreground-text--icons]

| Token                 | Use for                                |
| --------------------- | -------------------------------------- |
| `foreground`          | Default body text                      |
| `foreground-muted`    | Secondary text, descriptions           |
| `foreground-subtle`   | Placeholders, disabled labels, markers |
| `foreground-strong`   | Emphasized text                        |
| `foreground-emphasis` | Stronger emphasis                      |
| `foreground-intense`  | Headings, highest-contrast text        |
| `foreground-inverse`  | Text on an inverted surface            |

### Background (surfaces) [#background-surfaces]

| Token                | Use for                           |
| -------------------- | --------------------------------- |
| `background`         | The base page surface             |
| `background-subtle`  | Slightly raised areas, cards      |
| `background-muted`   | Hover fills, inset panels         |
| `background-strong`  | More prominent fills              |
| `background-inverse` | Inverted surfaces (e.g. tooltips) |

### Border [#border]

| Token             | Use for                      |
| ----------------- | ---------------------------- |
| `border`          | Default borders and dividers |
| `border-muted`    | Faint separators             |
| `border-strong`   | Higher-contrast borders      |
| `border-emphasis` | Emphasized outlines          |
| `border-intense`  | Strongest outlines           |
| `border-inverse`  | Borders on inverted surfaces |

## Accent palettes [#accent-palettes]

Six semantic accents share an identical scale, so they're interchangeable by
intent. `primary` and `secondary` carry your brand; `error`, `success`,
`warning`, and `info` carry status.

| Step           | Role                                            |
| -------------- | ----------------------------------------------- |
| `*-subtle`     | Translucent tint — soft background wash         |
| `*-soft`       | Slightly stronger translucent fill              |
| `*-muted`      | Muted solid                                     |
| `*` (base)     | The default accent fill                         |
| `*-strong`     | Stronger, for hover/active                      |
| `*-emphasis`   | The vivid, on-brand value                       |
| `*-intense`    | The boldest value                               |
| `*-foreground` | Text/icon color that sits legibly on the accent |

For example, an info alert pairs `bg-info-subtle` (surface), `bg-info-soft` (border), with `text-info-foreground`;
a solid primary button pairs `bg-primary` with `text-primary-foreground`.

## Focus rings [#focus-rings]

Focus styling has its own token set so the ring can differ from borders. Each maps
to a matching role, and components apply them automatically on `:focus-visible` —
see [Accessibility](/ui/docs/react/accessibility).

| Token            | Use for                              |
| ---------------- | ------------------------------------ |
| `ring`           | Default focus ring, neutral controls |
| `ring-input`     | Inputs and form fields               |
| `ring-primary`   | Primary controls                     |
| `ring-secondary` | Secondary controls                   |
| `ring-error`     | Error / invalid controls             |
| `ring-success`   | Success controls                     |
| `ring-warning`   | Warning controls                     |
| `ring-info`      | Info controls                        |
| `ring-light`     | Controls on inverted / dark surfaces |

## Overriding the palette [#overriding-the-palette]

Any token can be redefined after the stylesheet import, separately per theme:

```css
:root {
  --secondary: oklch(0.827 0.119 306.383);
}
.dark {
  --secondary: oklch(0.714 0.203 305.504);
}
```

Head to [Theming](/ui/docs/react/theming) for the raw-vs-theme token model and the
non-color tokens (radius, shadows, typography).
