# appica.dev Site Theme — Token Block (pattern source)

> Pasted by the user from the live appica.dev stylesheet (2026-08-04).
> This is the docs site's own override layer on top of the default Appica UI tokens.

```css
:root,
.light {
  --foreground: oklch(44.2% 0.017 285.786);
  --foreground-subtle: oklch(70.5% 0.015 286.067);
  --foreground-muted: oklch(55.2% 0.016 285.938);
  --foreground-strong: oklch(37% 0.013 285.805);
  --foreground-emphasis: oklch(27.4% 0.006 286.033);
  --foreground-intense: oklch(21% 0.006 285.885);
  --background-subtle: oklch(98.5% 0 0);
  --background-muted: oklch(96.7% 0.001 286.375);
  --background-strong: oklch(92% 0.004 286.32);
  --background-inverse: oklch(14.1% 0.005 285.823);
  --border: oklch(92% 0.004 286.32);
  --border-muted: oklch(96.7% 0.001 286.375);
  --border-strong: oklch(87.1% 0.006 286.286);
  --border-emphasis: oklch(70.5% 0.015 286.067);
  --border-intense: oklch(55.2% 0.016 285.938);
  --border-inverse: oklch(27.4% 0.006 286.033);
  --border-overlay: oklch(96.7% 0.001 286.375);
  --focus-ring: oklch(87.1% 0.006 286.286);
  --focus-ring-input: oklch(92% 0.004 286.32);
  --shadow-color: oklch(55.2% 0.016 285.938 / 18%);
  --selection-color: oklch(14.1% 0.005 285.823 / 10%);
  --primary: oklch(21% 0.006 285.885);
  --primary-subtle: oklch(96.7% 0.001 286.375);
  --primary-soft: oklch(92% 0.004 286.32);
  --primary-muted: oklch(37% 0.013 285.805);
  --primary-strong: oklch(14.1% 0.005 285.823);
  --focus-ring-primary: oklch(87.1% 0.006 286.286);
  --secondary-foreground: oklch(14.1% 0.005 285.823);
}

.dark {
  --foreground: oklch(87.1% 0.006 286.286);
  --foreground-subtle: oklch(55.2% 0.016 285.938);
  --foreground-muted: oklch(70.5% 0.015 286.067);
  --foreground-strong: oklch(92% 0.004 286.32);
  --foreground-emphasis: oklch(96.7% 0.001 286.375);
  --foreground-intense: oklch(1 0 0);
  --foreground-inverse: oklch(21% 0.006 285.885);
  --background: oklch(14.1% 0.005 285.823);
  --background-subtle: oklch(55.2% 0.016 285.938 / 8%);
  --background-muted: oklch(21% 0.006 285.885);
  --background-strong: oklch(27.4% 0.006 286.033);
  --background-inverse: oklch(1 0 0);
  --border: oklch(27.4% 0.006 286.033);
  --border-muted: oklch(21% 0.006 285.885);
  --border-strong: oklch(37% 0.013 285.805);
  --border-emphasis: oklch(44.2% 0.017 285.786);
  --border-intense: oklch(55.2% 0.016 285.938);
  --border-inverse: oklch(92% 0.004 286.32);
  --border-overlay: oklch(27.4% 0.006 286.033);
  --focus-ring: oklch(37% 0.013 285.805);
  --focus-ring-input: oklch(27.4% 0.006 286.033);
  --shadow-color: oklch(0 0 0 / 30%);
  --selection-color: oklch(1 0 0 / 15%);
  --primary: oklch(1 0 0);
  --primary-subtle: oklch(21% 0.006 285.885);
  --primary-soft: oklch(27.4% 0.006 286.033);
  --primary-muted: oklch(92% 0.004 286.32);
  --primary-strong: oklch(1 0 0);
  --primary-foreground: oklch(21% 0.006 285.885);
  --focus-ring-primary: oklch(37% 0.013 285.805);
  --secondary-foreground: oklch(14.1% 0.005 285.823);
}
```

## Interpretation (verified against the live page)

- **Colors:** the site is intentionally monochrome/neutral. In light mode `--primary`
  is near-black (`oklch(21% 0.006 285.885)` — a very subtle cool/grey-purple tint,
  hue ≈ 286°); in dark mode `--primary` is white. No vivid brand accent.
- **Fonts:** this block contains no font tokens. The live page uses a system font
  stack (`system-ui, -apple-system, ...`) — no custom web font.
- **Pattern to borrow:** minimal neutral palette, dark-on-light primary, white-on-dark
  primary, system font (or a restrained font stack). If the admin should have a brand
  color instead (e.g. the current purple), it would be an intentional deviation.
