# Appica UI — Combobox (reference 28)

> Full official doc: `FULL-SPEC.md` (section "Combobox", ~line 7626). Saved from user's pasted doc.

## Purpose
Compound component for **picking a value from a set** with search. Reach for it (not
`Autocomplete`) when it's a selection with search/multiple/chips; use `Select` for a short
known list with no search.

## Import
```tsx
import {
  Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty,
  ComboboxList, ComboboxItem,
  ComboboxTrigger, ComboboxValue, ComboboxChips, ComboboxChip,
  ComboboxGroup, ComboboxLabel, ComboboxCollection,
} from '@appica/ui-react/combobox'
```

## Parts
- **`Combobox`** — root. Holds `items` + shared options: `size` (`sm/md/lg`), `variant`
  (`outline` default | `soft`), `clearable`, `icon` (chevron, on by default), `multiple`,
  `grid`, `value`/`onValueChange`, `inputValue`/`onInputValueChange`, `itemToStringLabel`
  (object items), `itemToStringValue`, `disabled`, `required`, `name`.
- **`ComboboxInput`** — the text field (styled like Input). `startSlot`/`endSlot` adornments.
- **`ComboboxTrigger` + `ComboboxValue`** — select-style trigger; use when the search field
  should live **inside** the popup.
- **`ComboboxChips` + `ComboboxChip`** — chip-based input for `multiple`; each selected value
  becomes a removable `ComboboxChip`, text field inline for adding more. Value = array.
- **`ComboboxContent`** — portalled, auto-positioned popup (accepts floating props:
  `side`, `align`, `sideOffset`, `alignOffset`, …).
- **`ComboboxList`** — scrollable list; render function over filtered items, or static items.
- **`ComboboxItem`** — one option; `value` is what selection reports.
- **`ComboboxEmpty`** — shown when filter matches nothing.
- **`ComboboxGroup`/`ComboboxLabel`/`ComboboxCollection`** — grouped options.

## Patterns we care about
- **Multiple selection** (dependencies):
  ```tsx
  <Combobox items={features} multiple value={selected} onValueChange={(v)=>setSelected(v as T[])}>
    <ComboboxChips placeholder="Add…">
      <ComboboxValue>{(sel) => sel.map((it) => <ComboboxChip key={it.id}>{it.label}</ComboboxChip>)}</ComboboxValue>
    </ComboboxChips>
    <ComboboxContent>
      <ComboboxEmpty>…</ComboboxEmpty>
      <ComboboxList>{(it) => <ComboboxItem key={it.id} value={it}>{it.label}</ComboboxItem>}</ComboboxList>
    </ComboboxContent>
  </Combobox>
  ```
- **Search inside popup (select-style)**: `ComboboxTrigger`/`ComboboxValue` as the field,
  `icon={false}` on root, `ComboboxInput` moved inside `ComboboxContent`.
- **Long lists**: wrap `ComboboxList` in `ScrollArea` (set `overflow-y-visible` on the list).
- **Object items**: give root `itemToStringLabel`.
- **RTL**: supported via `DirectionProvider`; popup placement follows direction.
