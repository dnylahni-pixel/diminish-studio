# useLocalStorage (/ui/docs/react/use-local-storage)



`useLocalStorage` is a `useState`-like hook whose value persists to
`localStorage`. It's SSR-safe, syncs across browser tabs via the `storage` event,
and syncs other components in the same tab. A `useSessionStorage` variant backs
onto `sessionStorage`.

```tsx
import { useLocalStorage, useSessionStorage } from '@appica/ui-react/hooks/use-local-storage'
```

## Usage [#usage]

It returns a `[value, setValue, remove]` tuple. `setValue` accepts a value or an
updater function, just like `useState`:

```tsx
'use client'

import { useLocalStorage } from '@appica/ui-react/hooks/use-local-storage'

function Counter() {
  const [count, setCount, reset] = useLocalStorage('count', 0)

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

## Signature [#signature]

```ts
useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: { serializer?: (value: T) => string; deserializer?: (raw: string) => T },
): readonly [T, (value: T | ((prev: T) => T)) => void, () => void]
```

| Parameter      | Type     | Description                                                          |
| -------------- | -------- | -------------------------------------------------------------------- |
| `key`          | `string` | Storage key                                                          |
| `defaultValue` | `T`      | Returned on the server, before hydration, and when nothing is stored |
| `options`      | `object` | Optional custom `serializer` / `deserializer`                        |

Values are JSON-serialized by default. Pass a `serializer`/`deserializer` to store
a raw string instead — for example a value an inline script must read without
parsing JSON:

```tsx
const [theme, setTheme] = useLocalStorage('theme', 'system', {
  serializer: (v) => v,
  deserializer: (v) => v,
})
```

<Callout type="note">
  SSR-safe by design: the server and first client render return `defaultValue`, then the stored value resolves on
  hydration. Writes are wrapped in try/catch, so private-mode or quota failures won't crash your app. Need to pick the
  backend at runtime? Use the lower-level `useStorage('local' | 'session', …)`.
</Callout>
