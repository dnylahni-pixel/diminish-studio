# Appica UI — Chip (reference 27)

> Full official doc: `FULL-SPEC.md` (section "Chip", ~line 6936). Saved from user's pasted doc.

## Purpose
Small, button-based pill for tags, attributes, filters, and removable tokens. Shares the
`Button` variant palette, compact `sm`/`md`/`lg` heights.

## Import
```tsx
import { Chip, ChipGroup, type ChipGroupHandle } from '@appica/ui-react/chip'
```

## Key props (Chip)
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'soft' \| 'outline' \| 'primary' \| 'secondary' \| 'destructive'` | `'soft'` | Inherited from ChipGroup |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Inherited from ChipGroup |
| `dismissible` | `boolean` | `false` | Adds close (✕); exit animation (blur+scale), reduced to fade on reduced-motion |
| `open` / `onOpenChange` | `boolean` / `(open)=>void` | — | Controlled dismissal (intent signal) |
| `onDismiss` | `() => void` | — | Fires after exit animation finishes → drop from state |
| `closeLabel` | `string` | `'Dismiss'` | sr-only accessible name for dismiss |
| `render` | `ReactElement \| (props, state)=>ReactElement` | — | Swap element (e.g. `<a>`/Link); state = `{ variant, size, dismissible }` |

## Key props (ChipGroup)
| Prop | Type | Notes |
| --- | --- | --- |
| `variant` / `size` | — | Shared defaults for children (child can override) |
| `ref` | `ChipGroupHandle` | `clearAll()` dismisses every dismissible child |
| `className` | `string` | tailwind-merge |

## Patterns we care about
- **Selectable filter chips**: drive `selected` yourself — swap `variant` (`primary` vs `outline`)
  + `Check` icon + `aria-pressed`.
- **Icon spacing**: `data-icon="start"` / `data-icon="end"` on the icon (same convention as Button).
- **As link**: `render={<a href=… />}` keeps chip styling.
- **RTL**: logical properties, content/icon/dismiss auto-mirror.
- **A11y**: native `<button>` (tab order, Enter/Space); `aria-pressed` exposes on/off for selectable.
