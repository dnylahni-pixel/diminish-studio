# appica.dev Site Fonts — @font-face dump (pattern source)

> Pasted by the user from the live appica.dev stylesheet (2026-08-04).
> These are `next/font`-generated `@font-face` rules: hashed filenames under `/_next/static/media/`
> with unicode-range subsets and metric-compatible fallbacks. They are **not portable as-is**
> (relative `../media/...` paths only exist on appica.dev).

Font families present:

- **Geist** (variable 100–900) + `Geist Fallback` (Arial metrics) — the site's default sans
- **Geist Mono** (variable 100–900) + fallback — the site's default mono
- Inter, Figtree, Urbanist, DM Sans, Outfit, Manrope, Fraunces, Public Sans, Instrument Sans,
  Host Grotesk (sans/display options), Google Sans (multi-script), JetBrains Mono (mono option)

Each family ships as several `@font-face` blocks split by `unicode-range` (latin-ext, cyrillic,
greek, latin, …). The pattern to reproduce in our admin:

```tsx
// Next.js equivalent (self-hosted, no layout shift)
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const vazirmatn = Vazirmatn({ variable: "--font-vazir", subsets: ["latin", "arabic"] });
```

```css
:root {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}
[dir="rtl"] {
  --font-sans: var(--font-vazir), var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}
```

> Vazirmatn is required for Persian text: none of the site's font list covers Arabic/Persian script.
