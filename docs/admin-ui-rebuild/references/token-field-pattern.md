# Token Field — UI pattern reference (NameThatUI)

> Source: https://namethatui.com/macos/token-field (pasted by user, 2026-08-04).

## What it is

A field that converts recognized typed text into discrete rounded tokens — like email
recipients in a mail compose window. Each token is one value, separately selectable,
removable, and editable without treating the whole field as plain text.

- AppKit names: `NSTokenField`, `NSTokenField.TokenStyle`, `NSTokenFieldDelegate`.
- Also called: token input, recipient field, tag input, pill input.

## Anatomy

1. **Token capsule** — the rounded bubble wrapping one recognized value.
2. **Selected token** — the highlighted pill ready for keyboard deletion/editing.

Behaviors to preserve: token completion (typed text suggests recognized values),
keyboard deletion (Backspace removes a selected token), separators that tokenize input.

## Relevance to Diminish Admin v2

This is the natural input for the **puzzle-piece assembly**: the plan builder should
accept pieces (features, limits, credit policies, add-ons, prices) as tokens. Each
piece becomes a removable capsule; clicking a capsule opens its configuration; a
selected capsule can be removed with one key.

Appica UI has no `TokenField` component — build one by composing:
`Autocomplete`/`Combobox` (completion) + `Chip` (capsule) + `Input` (free text),
with custom keyboard handling (Backspace on selected chip, Enter to tokenize).

## Quick-create mode (user vision, 2026-08-04)

The field must also **create new pieces inline**, not only pick existing ones:

- Type `10` → Enter → a new piece is created (e.g. duration `10 days`) and becomes a token.
- Type `15` → Enter → another piece `15 days` is created the same way.
- Feels instant and delightful; no separate "create form" interrupt in the flow.

Design consequences:

- Enter with no matching piece = create a new library piece with sensible defaults,
  insert it as a token, and keep it in the library for reuse.
- Matching input = select existing piece instead (completion still wins).
- Newly created pieces should be visually distinguishable (e.g. a "new" dot) and
  removable via undo if the user didn't intend to save them.
