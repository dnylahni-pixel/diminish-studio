# useDismissible (/ui/docs/react/use-dismissible)



`useDismissible` manages the show/hide state of a dismissible element — an alert, chip, banner or
announcement — and remembers the dismissal so it stays gone on the
next visit. It's built on [`useLocalStorage`](/ui/docs/react/use-local-storage), so
it's SSR-safe and synced across tabs and components.

```tsx
import { useDismissible } from '@appica/ui-react/hooks/use-dismissible'
```

## Usage [#usage]

```tsx
'use client'

import { useDismissible } from '@appica/ui-react/hooks/use-dismissible'

function AnnouncementBanner() {
  const { open, dismiss } = useDismissible('announcement-2024')
  if (!open) return null

  return (
    <div className="bg-info-subtle flex items-center justify-between rounded-lg p-3">
      <span>We just shipped dark mode!</span>
      <button onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
```

## Signature [#signature]

```ts
useDismissible(
  key: string,
  options?: { storage?: 'local' | 'session' },
): { open: boolean; dismiss: () => void; reset: () => void }
```

| Parameter         | Type                   | Default   | Description                                    |
| ----------------- | ---------------------- | --------- | ---------------------------------------------- |
| `key`             | `string`               | —         | Storage key the dismissal is persisted under   |
| `options.storage` | `'local' \| 'session'` | `'local'` | Persist for good (`local`) or just the session |

## Return value [#return-value]

| Property  | Type         | Description                                              |
| --------- | ------------ | -------------------------------------------------------- |
| `open`    | `boolean`    | Whether the surface should show (`true` until dismissed) |
| `dismiss` | `() => void` | Mark it dismissed and persist that                       |
| `reset`   | `() => void` | Clear the dismissal so it shows again                    |

<Callout type="note">
  `open` is `true` until the stored value is known, so the element renders immediately and won't pop in after hydration.
  Use `'session'` storage for messages that should reappear in a new tab or session.
</Callout>
