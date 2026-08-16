# Toolbar (/ui/components/react/toolbar)



## Usage [#usage]

```tsx
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarLink } from '@appica/ui-react/toolbar'
import { Button } from '@appica/ui-react/button'
```

```tsx
<Toolbar aria-label="Formatting">
  <ToolbarGroup aria-label="Text style">
    <ToolbarButton render={<Button variant="ghost">Bold</Button>} />
    <ToolbarButton render={<Button variant="ghost">Italic</Button>} />
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarLink href="#help">Help</ToolbarLink>
</Toolbar>
```

`Toolbar` is a `role="toolbar"` strip with a roving tabindex: the toolbar holds a single tab stop, and the arrow keys move focus between its items (with `Home`/`End` jumping to the ends). This keeps the whole group to one stop in the page's tab order while still letting keyboard users reach every control. Set `orientation="vertical"` to stack items and switch the arrow keys to the vertical axis; `disabled` disables every item at once.

The items are composed, not bespoke: `ToolbarButton` renders any button you pass to `render` — most often a ghost [`Button`](/ui/components/react/button) — so the toolbar inherits your existing styles while the toolbar wiring (focus order, `disabled`) is added on top. `ToolbarSeparator` always renders **perpendicular** to the toolbar (a horizontal toolbar gets vertical dividers, and vice-versa), so you never set its orientation by hand. Give the toolbar an accessible name with `aria-label`, and name each `ToolbarGroup` the same way.

A toolbar never reflows: its items keep their size, and when there isn't room the bar caps to the available width and scrolls along its axis instead (the scrollbar is hidden — the clipped edge already hints there's more). That's built in, so you don't wrap it yourself.

## Examples [#examples]

### Default [#default]

A table toolbar that mixes the part types: a `ToolbarInput` search box (rendered as an [`Input`](/ui/components/react/input)), a `ToolbarGroup` holding a ghost-[`Button`](/ui/components/react/button) `Filter` action, and an `Export` `ToolbarLink`. Each lands in the same roving-focus order, so one **Tab** reaches the strip and the arrow keys walk from the search box through to the link. On a narrow screen the bar scrolls sideways rather than reflowing — no wrapper needed.

```tsx
import { Search, Filter, SortAscending, Download } from '@appica/icons-react'
import { Button, buttonVariants } from '@appica/ui-react/button'
import { Input } from '@appica/ui-react/input'
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
} from '@appica/ui-react/toolbar'

export default function ToolbarDefault() {
  return (
    <Toolbar aria-label="Table actions">
      <ToolbarInput
        className="w-44"
        render={<Input startSlot={<Search />} placeholder="Search tasks…" aria-label="Search tasks" />}
      />

      <ToolbarGroup aria-label="Refine">
        <ToolbarButton
          render={
            <Button variant="ghost">
              <Filter data-icon="start" />
              Filter
            </Button>
          }
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarLink href="#export" className={buttonVariants({ variant: 'ghost' })}>
        <Download data-icon="start" />
        Export
      </ToolbarLink>
    </Toolbar>
  )
}
```

### With a toggle group [#with-a-toggle-group]

A rich-text editing toolbar. The undo/redo `ToolbarGroup` and a font [`Select`](/ui/components/react/select) sit beside a true single-select alignment [`ToggleGroup`](/ui/components/react/toggle-group) — built by wrapping each `ToolbarButton render={<Toggle …/>}` in a `ToggleGroup`, so the toggles share one pressed value (picking an alignment releases the previous one) while still taking part in the toolbar's roving focus. The selection state is the group's own — no extra wiring.

```tsx
'use client'

import { ArrowBackUp, ArrowForwardUp, AlignLeft, AlignCenter, AlignRight, Typography } from '@appica/icons-react'
import { Button } from '@appica/ui-react/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@appica/ui-react/select'
import { Toggle } from '@appica/ui-react/toggle'
import { ToggleGroup } from '@appica/ui-react/toggle-group'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@appica/ui-react/toolbar'

export default function ToolbarWithToggles() {
  return (
    <Toolbar aria-label="Text formatting">
      <ToolbarGroup aria-label="History">
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Undo">
              <ArrowBackUp />
            </Button>
          }
        />
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Redo">
              <ArrowForwardUp />
            </Button>
          }
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <Select defaultValue="Inter" alignItemWithTrigger={false}>
        <ToolbarButton
          className="w-36"
          render={
            <SelectTrigger startSlot={<Typography />} aria-label="Font">
              <SelectValue />
            </SelectTrigger>
          }
        />
        <SelectContent>
          <SelectItem value="Geist">Geist</SelectItem>
          <SelectItem value="Inter">Inter</SelectItem>
          <SelectItem value="Georgia">Figrtree</SelectItem>
          <SelectItem value="Urbanist">Urbanist</SelectItem>
        </SelectContent>
      </Select>

      <ToolbarSeparator />

      <ToggleGroup defaultValue={['left']} aria-label="Alignment">
        <ToolbarButton
          render={
            <Toggle
              value="left"
              aria-label="Align left"
              render={
                <Button variant="ghost" size="icon-md">
                  <AlignLeft />
                </Button>
              }
            />
          }
        />
        <ToolbarButton
          render={
            <Toggle
              value="center"
              aria-label="Align center"
              render={
                <Button variant="ghost" size="icon-md">
                  <AlignCenter />
                </Button>
              }
            />
          }
        />
        <ToolbarButton
          render={
            <Toggle
              value="right"
              aria-label="Align right"
              render={
                <Button variant="ghost" size="icon-md">
                  <AlignRight />
                </Button>
              }
            />
          }
        />
      </ToggleGroup>
    </Toolbar>
  )
}
```

### Vertical orientation [#vertical-orientation]

Set `orientation="vertical"` to stack the items into a column — here a formatting group and a clipboard group. The arrow keys follow the vertical axis and the `ToolbarSeparator` between the groups flips to a horizontal divider automatically.

```tsx
import { Bold, Italic, Underline, Copy, Scissors } from '@appica/icons-react'
import { Button } from '@appica/ui-react/button'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@appica/ui-react/toolbar'

export default function ToolbarVertical() {
  return (
    <Toolbar aria-label="Formatting" orientation="vertical">
      <ToolbarGroup aria-label="Text style">
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Bold">
              <Bold />
            </Button>
          }
        />
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Italic">
              <Italic />
            </Button>
          }
        />
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Underline">
              <Underline />
            </Button>
          }
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup aria-label="Clipboard">
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Copy">
              <Copy />
            </Button>
          }
        />
        <ToolbarButton
          render={
            <Button variant="ghost" size="icon-md" aria-label="Cut">
              <Scissors />
            </Button>
          }
        />
      </ToolbarGroup>
    </Toolbar>
  )
}
```

## RTL [#rtl]

Every Appica UI component supports right-to-left layouts out of the box. Set the `dir` attribute on a container (commonly your `<html>` element) so CSS logical properties resolve correctly, and wrap your tree in `DirectionProvider` so direction-aware behavior — roving focus, popup placement, and the like — follows the same direction.

```tsx
import { DirectionProvider } from '@appica/ui-react/providers/direction-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  )
}
```

Items and groups align to the start edge and the arrow-key focus order follows the resolved direction. For setup details and caveats, see the [RTL guide](/ui/docs/react/rtl).

<RtlPreview component="toolbar" />

## API reference [#api-reference]

`Toolbar` wraps [Base UI's Toolbar](https://base-ui.com/react/components/toolbar). Each part forwards every remaining prop to the matching Base UI primitive, so anything it accepts works here — the tables below list the most common props.

### Toolbar [#toolbar]

The root strip. Renders a `role="toolbar"` `<div>` and exposes `data-orientation`.

| Prop          | <ColMinWidth width="180">Type</ColMinWidth>                   | Default        | <ColMinWidth width="220">Description</ColMinWidth>                      |
| ------------- | ------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| `orientation` | <Code>'horizontal' \| 'vertical'</Code>                       | `'horizontal'` | Layout axis; also the axis the arrow keys move focus along.             |
| `disabled`    | `boolean`                                                     | `false`        | Disable every item in the toolbar at once.                              |
| `loopFocus`   | `boolean`                                                     | `true`         | Wrap focus to the other end when arrowing past the first or last item.  |
| `render`      | <Code>ReactElement \| ((props, state) => ReactElement)</Code> | —              | Replace the `<div>`, or compose it with another component.              |
| `className`   | <Code>string \| ((state) => string)</Code>                    | —              | Extra classes, merged via `tailwind-merge`. May be a function of state. |

Also forwards `ref` and every remaining native `<div>` attribute.

### ToolbarButton [#toolbarbutton]

A toolbar item button, usually composed with a [`Button`](/ui/components/react/button) via `render`.

| Prop                    | <ColMinWidth width="180">Type</ColMinWidth>                   | Default | <ColMinWidth width="220">Description</ColMinWidth>                 |
| ----------------------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| `disabled`              | `boolean`                                                     | `false` | Disable just this item.                                            |
| `focusableWhenDisabled` | `boolean`                                                     | `true`  | Keep a disabled item reachable by the roving focus.                |
| `render`                | <Code>ReactElement \| ((props, state) => ReactElement)</Code> | —       | Render-as: pass your own button (e.g. `<Button variant="ghost">`). |
| `className`             | `string`                                                      | —       | Extra classes, merged via `tailwind-merge`.                        |

### ToolbarLink [#toolbarlink]

A link item (`<a href>`, `role="link"`) that joins the roving focus order.

| Prop        | <ColMinWidth width="180">Type</ColMinWidth>                   | Default | <ColMinWidth width="220">Description</ColMinWidth>            |
| ----------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `href`      | `string`                                                      | —       | The link target.                                              |
| `render`    | <Code>ReactElement \| ((props, state) => ReactElement)</Code> | —       | Render-as: compose with a framework `<Link>` or other anchor. |
| `className` | `string`                                                      | —       | Extra classes, merged via `tailwind-merge`.                   |

### ToolbarInput [#toolbarinput]

An input item that lives in the toolbar's focus order — a search box or inline value field.

| Prop                    | <ColMinWidth width="180">Type</ColMinWidth>                   | Default | <ColMinWidth width="220">Description</ColMinWidth>                |
| ----------------------- | ------------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `disabled`              | `boolean`                                                     | `false` | Disable just this item.                                           |
| `focusableWhenDisabled` | `boolean`                                                     | `true`  | Keep a disabled input reachable by the roving focus.              |
| `render`                | <Code>ReactElement \| ((props, state) => ReactElement)</Code> | —       | Render-as: compose with an [`Input`](/ui/components/react/input). |
| `className`             | `string`                                                      | —       | Extra classes, merged via `tailwind-merge`.                       |

### ToolbarGroup [#toolbargroup]

Groups related items under a single `role="group"`. Lay out as a flex row (or column under `data-orientation=vertical`).

| Prop         | <ColMinWidth width="180">Type</ColMinWidth> | Default | <ColMinWidth width="220">Description</ColMinWidth> |
| ------------ | ------------------------------------------- | ------- | -------------------------------------------------- |
| `disabled`   | `boolean`                                   | `false` | Disable every item in the group.                   |
| `aria-label` | `string`                                    | —       | Names the group for assistive tech.                |
| `className`  | <Code>string \| ((state) => string)</Code>  | —       | Extra classes, merged via `tailwind-merge`.        |

### ToolbarSeparator [#toolbarseparator]

A divider rendered **perpendicular** to the toolbar — vertical inside a horizontal toolbar, horizontal inside a vertical one.

| Prop          | <ColMinWidth width="180">Type</ColMinWidth> | Default                 | <ColMinWidth width="220">Description</ColMinWidth>                    |
| ------------- | ------------------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| `orientation` | <Code>'horizontal' \| 'vertical'</Code>     | opposite of the toolbar | Override the divider axis. Rarely needed — the default flips for you. |
| `className`   | <Code>string \| ((state) => string)</Code>  | —                       | Extra classes, merged via `tailwind-merge`.                           |

## Accessibility [#accessibility]

* The root renders `role="toolbar"`; give it an accessible name with `aria-label` (or `aria-labelledby`).
* Focus uses a **roving tabindex** — the toolbar is a single tab stop, and the arrow keys move focus between items along the toolbar's orientation.
* **Home** / **End** jump focus to the first and last items.
* Name each `ToolbarGroup` with `aria-label` so its `role="group"` is announced.
* `disabled` on the toolbar (or a group) disables its items; items stay focusable when disabled (`focusableWhenDisabled`) so keyboard users can still reach and read them.# Accordion (/ui/components/react/accordion)



<Playground component="accordion" />

## Usage [#usage]

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'
```

```tsx
<Accordion defaultValue={['shipping']}>
  <AccordionItem value="shipping">
    <AccordionTrigger>How long does shipping take?</AccordionTrigger>
    <AccordionContent>Orders arrive in 3–5 days with standard delivery.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>What is your return policy?</AccordionTrigger>
    <AccordionContent>Return any unused item within 30 days for a full refund.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`Accordion` stacks collapsible sections — ideal for FAQs, settings groups, and any content you want to keep scannable until it's needed. Compose it from four parts, all under `@appica/ui-react/accordion`:

* **`Accordion`** — the root. Owns which items are open (`value`/`defaultValue`), whether `multiple` can be open at once, and the shared `variant` and `icon` styling.
* **`AccordionItem`** — one section, identified by its `value`. Can be individually `disabled`.
* **`AccordionTrigger`** — the header button that toggles its panel; renders the open/close icon.
* **`AccordionContent`** — the collapsible panel, which animates its height open and closed.

The `variant`, `icon`, `iconVariant`, and `iconPosition` props set on the root cascade to every item, and any item or trigger can override them locally.

## Examples [#examples]

### Default [#default]

By default only one panel is open at a time — opening another closes the last. Set the initially open item(s) with `defaultValue`.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'

export default function AccordionDefault() {
  return (
    <Accordion className="max-w-110" defaultValue={['shipping']}>
      <AccordionItem value="shipping">
        <AccordionTrigger>How long does shipping take?</AccordionTrigger>
        <AccordionContent>
          Orders ship within one business day and arrive in 3–5 days with standard delivery.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>What is your return policy?</AccordionTrigger>
        <AccordionContent>
          Return any unused item within 30 days for a full refund — no questions asked.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>How do I contact support?</AccordionTrigger>
        <AccordionContent>
          Reach our team any time at support@example.com; we reply within a few hours.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

### Variants [#variants]

Three `variant`s change the surface: `default` is a filled card, `alt` is a flat card that gains a border on hover/open, and `flush` drops the card entirely for a borderless list.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'

const variants = ['default', 'alt', 'flush'] as const

export default function AccordionVariants() {
  return (
    <div className="grid w-full max-w-110 gap-6">
      {variants.map((variant) => (
        <div key={variant}>
          <p className="text-foreground-muted mb-2 text-xs font-medium tracking-wide uppercase">{variant}</p>
          <Accordion variant={variant} defaultValue={['one']}>
            <AccordionItem value="one">
              <AccordionTrigger>First section</AccordionTrigger>
              <AccordionContent>The {variant} variant changes the surface, borders, and spacing.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="two">
              <AccordionTrigger>Second section</AccordionTrigger>
              <AccordionContent>Each item still animates its panel height open and closed.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  )
}
```

### Icons [#icons]

Switch the indicator with `icon="plus"` (a plus that morphs to a minus) or hide it with `icon={false}`. Wrap it in a tile with `iconVariant="icon-box"`, and move it ahead of the label with `iconPosition="start"`.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'

export default function AccordionIcons() {
  return (
    <div className="grid w-full max-w-110 gap-6">
      <Accordion icon="plus" defaultValue={['a']}>
        <AccordionItem value="a">
          <AccordionTrigger>Plus icon</AccordionTrigger>
          <AccordionContent>The plus morphs into a minus as the panel opens.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Second item</AccordionTrigger>
          <AccordionContent>Set icon="plus" on the Accordion to apply it to every trigger.</AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion icon="chevron" iconVariant="icon-box" iconPosition="start" defaultValue={['c']}>
        <AccordionItem value="c">
          <AccordionTrigger>Boxed icon, leading</AccordionTrigger>
          <AccordionContent>
            iconVariant="icon-box" wraps the icon in a tile; iconPosition="start" moves it ahead of the label.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="d">
          <AccordionTrigger>Second item</AccordionTrigger>
          <AccordionContent>The boxed icon sits in a bordered tile that matches the item's surface.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
```

### Open multiple [#open-multiple]

Set `multiple` to let any number of panels stay open at once — useful when sections are independent rather than mutually exclusive.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'

export default function AccordionMultiple() {
  return (
    <Accordion className="max-w-110" multiple defaultValue={['plan', 'billing']}>
      <AccordionItem value="plan">
        <AccordionTrigger>Plan</AccordionTrigger>
        <AccordionContent>You're on the Pro plan, renewing on the 1st of each month.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>Billing</AccordionTrigger>
        <AccordionContent>Invoices are emailed to your account owner and available in Settings.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="team">
        <AccordionTrigger>Team</AccordionTrigger>
        <AccordionContent>Invite up to 10 teammates on your current plan.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

### Disabled item [#disabled-item]

Add `disabled` to an `AccordionItem` to lock it shut. It dims, can't be toggled, and is skipped by keyboard navigation.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'

export default function AccordionDisabled() {
  return (
    <Accordion className="max-w-110" defaultValue={['available']}>
      <AccordionItem value="available">
        <AccordionTrigger>Available section</AccordionTrigger>
        <AccordionContent>This item opens and closes as usual.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="locked" disabled>
        <AccordionTrigger>Locked section</AccordionTrigger>
        <AccordionContent>A disabled item can't be opened and is skipped by keyboard navigation.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="another">
        <AccordionTrigger>Another section</AccordionTrigger>
        <AccordionContent>Focus moves straight here, past the locked item above.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

### Leading media [#leading-media]

The trigger label is just `children`, so you can prefix it with any media — a plain icon, a [`Thumbnail`](/ui/components/react/thumbnail), or an [`Avatar`](/ui/components/react/avatar). They line up with the text while the indicator icon stays pinned to the trailing edge.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'
import { Avatar, AvatarImage, AvatarFallback } from '@appica/ui-react/avatar'
import { Thumbnail } from '@appica/ui-react/thumbnail'
import { GBRounded } from '@appica/country-flags-react'
import { Bell, CreditCard } from '@appica/icons-react'

export default function AccordionMixedMedia() {
  return (
    <Accordion className="max-w-110">
      <AccordionItem value="notifications">
        <AccordionTrigger>
          <Bell />
          Notifications
        </AccordionTrigger>
        <AccordionContent>Choose which emails and push alerts you'd like to receive.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>
          <Thumbnail variant="icon-outline" size="sm" shape="rounded" className="-my-1">
            <CreditCard />
          </Thumbnail>
          Billing
        </AccordionTrigger>
        <AccordionContent>Manage your payment method and download past invoices.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="region">
        <AccordionTrigger>
          <GBRounded className="size-6" aria-hidden />
          Region &amp; language
        </AccordionTrigger>
        <AccordionContent>
          Set your country, preferred language, and the currency shown across the app.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="account">
        <AccordionTrigger>
          <Avatar size="xs">
            <AvatarImage src="/avatars/01.jpg" alt="Sarah Jenkins" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          Account
        </AccordionTrigger>
        <AccordionContent>Update your profile details, email address, and password.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

### Controlled [#controlled]

Drive the open items yourself with `value` + `onValueChange`. Here the open panel is read out and stepped through with external prev/next buttons, while clicking a header still updates the same state.

```tsx
'use client'

import { useState } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@appica/ui-react/accordion'
import { Button } from '@appica/ui-react/button'
import { ChevronUp, ChevronDown } from '@appica/icons-react'

const items = [
  {
    value: 'install',
    title: 'Install dependencies',
    body: 'Restore the lockfile and pull the package cache so every build starts from the same baseline.',
  },
  {
    value: 'test',
    title: 'Run the test suite',
    body: 'Unit and integration tests run in parallel; a single failure stops the pipeline before deploy.',
  },
  {
    value: 'deploy',
    title: 'Deploy to production',
    body: 'A green build promotes the artifact behind a canary, then rolls out to the rest of the fleet.',
  },
]

export default function AccordionControlled() {
  const [value, setValue] = useState(['test'])
  const index = items.findIndex((item) => item.value === value[0])

  function step(delta: number) {
    const next = items[Math.min(items.length - 1, Math.max(0, index + delta))]
    if (next) setValue([next.value])
  }

  return (
    <div className="flex w-full max-w-110 flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-foreground-muted text-sm">
          Expanded: <span className="text-foreground-intense font-medium">{value[0] ?? 'none'}</span>
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={index <= 0}
            onClick={() => step(-1)}
            aria-label="Previous section"
          >
            <ChevronUp />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={index >= items.length - 1}
            onClick={() => step(1)}
            aria-label="Next section"
          >
            <ChevronDown />
          </Button>
        </div>
      </div>
      <Accordion icon={false} value={value} onValueChange={(next) => setValue(next as string[])}>
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
```

## RTL [#rtl]

Every Appica UI component supports right-to-left layouts out of the box. Set the `dir` attribute on a container (commonly your `<html>` element) so CSS logical properties resolve correctly, and wrap your tree in `DirectionProvider` so direction-aware behavior follows the same direction.

```tsx
import { DirectionProvider } from '@appica/ui-react/providers/direction-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  )
}
```

The trigger text aligns to the right and the indicator icon moves to the left, all from CSS logical properties. For setup details and caveats, see the [RTL guide](/ui/docs/react/rtl).

<RtlPreview component="accordion" />

## API reference [#api-reference]

`Accordion` wraps [Base UI's Accordion](https://base-ui.com/react/components/accordion). Each part forwards every remaining prop to the matching Base UI primitive, so anything it accepts works here — the tables below list the Appica additions and the most common props. The panel exposes the `--accordion-panel-height` CSS variable that powers the height animation. See the Base UI docs for the complete API.

### Accordion [#accordion]

The root. Renders a `<div>` and owns the open state and shared styling.

| Prop            | <ColMinWidth width="210">Type</ColMinWidth>      | Default     | <ColMinWidth width="220">Description</ColMinWidth>              |
| --------------- | ------------------------------------------------ | ----------- | --------------------------------------------------------------- |
| `variant`       | <Code>'default' \| 'alt' \| 'flush'</Code>       | `'default'` | Surface style applied to every item.                            |
| `icon`          | <Code>'chevron' \| 'plus' \| false</Code>        | `'chevron'` | The open/close indicator, or `false` to hide it.                |
| `iconVariant`   | <Code>'icon' \| 'icon-box'</Code>                | `'icon'`    | Plain glyph, or wrapped in a tinted tile.                       |
| `iconPosition`  | <Code>'end' \| 'start'</Code>                    | `'end'`     | Place the icon after or before the trigger label.               |
| `value`         | `string[]`                                       | —           | Controlled list of open item values. Pair with `onValueChange`. |
| `defaultValue`  | `string[]`                                       | —           | Uncontrolled initially open item(s).                            |
| `onValueChange` | <Code>(value: string\[], details) => void</Code> | —           | Fires when the set of open items changes.                       |
| `multiple`      | `boolean`                                        | `false`     | Allow several panels to be open simultaneously.                 |
| `disabled`      | `boolean`                                        | `false`     | Disable every item in the accordion.                            |
| `keepMounted`   | `boolean`                                        | `false`     | Keep closed panels in the DOM (e.g. for in-page search / SEO).  |
| `className`     | <Code>string \| ((state) => string)</Code>       | —           | Extra classes, merged via `tailwind-merge`.                     |

### AccordionItem [#accordionitem]

One section. Renders a `<div>` and exposes `data-open` / `data-disabled` for styling.

| Prop           | <ColMinWidth width="210">Type</ColMinWidth>   | Default | <ColMinWidth width="220">Description</ColMinWidth>                        |
| -------------- | --------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `value`        | `string`                                      | —       | Identifier reported in `value`/`onValueChange`. Auto-assigned if omitted. |
| `variant`      | <Code>'default' \| 'alt' \| 'flush'</Code>    | —       | Override the root's `variant` for this item.                              |
| `disabled`     | `boolean`                                     | `false` | Lock this item shut and skip it during keyboard navigation.               |
| `onOpenChange` | <Code>(open: boolean, details) => void</Code> | —       | Fires when this item opens or closes.                                     |
| `className`    | <Code>string \| ((state) => string)</Code>    | —       | Extra classes, merged via `tailwind-merge`.                               |

### AccordionTrigger [#accordiontrigger]

The header button. Rendered inside an `Accordion.Header`; toggles its panel and shows the icon.

| Prop           | <ColMinWidth width="210">Type</ColMinWidth> | Default | <ColMinWidth width="220">Description</ColMinWidth> |
| -------------- | ------------------------------------------- | ------- | -------------------------------------------------- |
| `icon`         | <Code>'chevron' \| 'plus' \| false</Code>   | —       | Override the root's icon for this trigger.         |
| `iconVariant`  | <Code>'icon' \| 'icon-box'</Code>           | —       | Override the root's icon style.                    |
| `iconPosition` | <Code>'end' \| 'start'</Code>               | —       | Override the root's icon position.                 |
| `children`     | `ReactNode`                                 | —       | The header label.                                  |
| `className`    | <Code>string \| ((state) => string)</Code>  | —       | Extra classes, merged via `tailwind-merge`.        |

### AccordionContent [#accordioncontent]

The collapsible panel. Renders a `<div>` that animates its height between open and closed.

| Prop          | <ColMinWidth width="210">Type</ColMinWidth> | Default | <ColMinWidth width="220">Description</ColMinWidth> |
| ------------- | ------------------------------------------- | ------- | -------------------------------------------------- |
| `children`    | `ReactNode`                                 | —       | The panel content.                                 |
| `keepMounted` | `boolean`                                   | `false` | Keep the panel mounted while closed.               |
| `className`   | <Code>string \| ((state) => string)</Code>  | —       | Extra classes, merged via `tailwind-merge`.        |

## Accessibility [#accessibility]

* Each `AccordionTrigger` is a real `<button>` inside a heading, with `aria-expanded` and `aria-controls` wired to its panel — assistive tech announces the open/closed state.
* Keyboard support follows the WAI-ARIA accordion pattern: **Tab** moves between triggers, **Enter**/**Space** toggles the focused panel, and the **arrow keys** move focus between headers (wrapping at the ends).
* A `disabled` item is removed from the tab order and skipped by arrow navigation, and exposes `data-disabled` for styling.
* The indicator icon is decorative (`aria-hidden`); the trigger's text label carries the meaning.
* The panel's height animation honours `prefers-reduced-motion`.# Kbd (/ui/components/react/kbd)



<Playground component="kbd" />

## Usage [#usage]

```tsx
import { Kbd, KbdGroup } from '@appica/ui-react/kbd'
```

```tsx
<Kbd>Esc</Kbd>

<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>
```

`Kbd` renders a single keyboard key — a styled `<kbd>` element — for documenting shortcuts inline, in tooltips, and in menus. Two parts live under `@appica/ui-react/kbd`:

* **`Kbd`** — one key. Three `size`s; the content is whatever you pass as children (a letter, a word like `Esc`, or a glyph like `⌘`).
* **`KbdGroup`** — a wrapper that lays out a sequence of keys with even spacing and propagates a shared `size` to the `Kbd`s inside it.

It's purely presentational: it carries no shortcut behavior, so wire up the actual key handling yourself.

## Examples [#examples]

### Default [#default]

A single key sized to its content — narrow for one letter, wider for a word. The minimum width keeps single characters square.

```tsx
import { Kbd } from '@appica/ui-react/kbd'

export default function KbdDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>↵</Kbd>
      <Kbd>Space</Kbd>
    </div>
  )
}
```

### Sizes [#sizes]

Three sizes — `sm`, `md` (default), and `lg` — scale the height, padding, and text together so a key sits comfortably next to surrounding type.

```tsx
import { Kbd } from '@appica/ui-react/kbd'

const sizes = ['sm', 'md', 'lg'] as const

export default function KbdSizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {sizes.map((size) => (
        <Kbd key={size} size={size}>
          ⌘ K
        </Kbd>
      ))}
    </div>
  )
}
```

### Key combinations [#key-combinations]

Wrap several `Kbd`s in a `KbdGroup` to show a chord. The group spaces the keys evenly and pushes a shared `size` down to each one — and leaves any non-`Kbd` child (like a `+` separator) untouched.

```tsx
import { Kbd, KbdGroup } from '@appica/ui-react/kbd'

export default function KbdGroupExample() {
  return (
    <div className="flex flex-col items-center gap-4 text-sm">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>

      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span className="text-foreground-muted">+</span>
        <Kbd>Alt</Kbd>
        <span className="text-foreground-muted">+</span>
        <Kbd>Del</Kbd>
      </KbdGroup>

      <span className="text-foreground-muted">
        Press{' '}
        <KbdGroup size="sm">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>{' '}
        to open the command menu
      </span>
    </div>
  )
}
```

### Shortcut list [#shortcut-list]

A common layout: action on one side, its shortcut on the other. The `KbdGroup` keeps each combo aligned and consistently sized.

```tsx
import { Kbd, KbdGroup } from '@appica/ui-react/kbd'

const shortcuts = [
  { action: 'Open command menu', keys: ['⌘', 'K'] },
  { action: 'New file', keys: ['⌘', 'N'] },
  { action: 'Search', keys: ['⌘', 'F'] },
  { action: 'Toggle sidebar', keys: ['⌘', 'B'] },
]

export default function KbdShortcuts() {
  return (
    <ul className="flex w-full max-w-80 flex-col gap-0.5">
      {shortcuts.map(({ action, keys }) => (
        <li
          key={action}
          className="bg-background-subtle flex items-center justify-between gap-4 px-4 py-2.5 text-sm first:rounded-t-lg last:rounded-b-lg"
        >
          <span>{action}</span>
          <KbdGroup size="sm">
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        </li>
      ))}
    </ul>
  )
}
```

### Inside a button [#inside-a-button]

Drop a `Kbd` into a [`Button`](/ui/components/react/button) as a trailing shortcut hint — a familiar pattern for search and command-menu triggers.

```tsx
import { Button } from '@appica/ui-react/button'
import { Kbd } from '@appica/ui-react/kbd'
import { Search } from '@appica/icons-react'

export default function KbdInButton() {
  return (
    <Button variant="outline" className="gap-3">
      <Search data-icon="start" />
      Search
      <Kbd size="sm" data-icon="end" className="-me-0.5">
        ⌘ K
      </Kbd>
    </Button>
  )
}
```

### Inside a tooltip [#inside-a-tooltip]

`Kbd` detects a [`Tooltip`](/ui/components/react/tooltip) surface and inverts its colors automatically, so a shortcut stays legible against the dark tooltip background with no extra styling.

```tsx
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@appica/ui-react/tooltip'
import { Button } from '@appica/ui-react/button'
import { Kbd } from '@appica/ui-react/kbd'
import { Bookmark } from '@appica/icons-react'

export default function KbdInTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon-md" aria-label="Save">
              <Bookmark />
            </Button>
          }
        />
        <TooltipContent className="flex items-center gap-2">
          Save
          <Kbd size="sm">⌘ S</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

## RTL [#rtl]

Every Appica UI component supports right-to-left layouts out of the box. Set the `dir` attribute on a container (commonly your `<html>` element) so CSS logical properties resolve correctly, and wrap your tree in `DirectionProvider` so direction-aware behavior follows the same direction.

```tsx
import { DirectionProvider } from '@appica/ui-react/providers/direction-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  )
}
```

The list and its labels flip to the right, while each shortcut's keys stay in left-to-right reading order — pin the `KbdGroup` with `dir="ltr"` so a `⌘ K` combo isn't reversed into `K ⌘`. For setup details and caveats, see the [RTL guide](/ui/docs/react/rtl).

<RtlPreview component="kbd" />

## API reference [#api-reference]

`Kbd` and `KbdGroup` are styled native elements (`<kbd>` and `<span>`) — they're not Base UI primitives. Each forwards `ref` and every remaining attribute to its underlying element.

### Kbd [#kbd]

A single key. Renders a `<kbd>`.

| Prop        | <ColMinWidth width="200">Type</ColMinWidth> | Default | <ColMinWidth width="240">Description</ColMinWidth>            |
| ----------- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| `size`      | <Code>'sm' \| 'md' \| 'lg'</Code>           | `'md'`  | Height, padding, and text scale. Inherited from a `KbdGroup`. |
| `children`  | `ReactNode`                                 | —       | The key label — a letter, word, or glyph.                     |
| `className` | `string`                                    | —       | Extra classes, merged via `tailwind-merge`.                   |

### KbdGroup [#kbdgroup]

A row of keys. Renders a `<span>` and forwards `size` to its `Kbd` children.

| Prop        | <ColMinWidth width="200">Type</ColMinWidth> | Default | <ColMinWidth width="240">Description</ColMinWidth>                   |
| ----------- | ------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `size`      | <Code>'sm' \| 'md' \| 'lg'</Code>           | `'md'`  | Default size applied to each child `Kbd` that doesn't set its own.   |
| `children`  | `ReactNode`                                 | —       | The keys (and any separators). A `Kbd` with its own `size` keeps it. |
| `className` | `string`                                    | —       | Extra classes, merged via `tailwind-merge`.                          |

## Accessibility [#accessibility]

* `Kbd` renders the semantic `<kbd>` element, which assistive tech recognizes as keyboard input.
* The component is decorative documentation, not an interactive control — pair it with the real key handler, and make sure the shortcut also has a discoverable, non-keyboard way to trigger the same action.
* When a glyph alone might be ambiguous (e.g. `⌘` vs "Command"), consider an `aria-label` on the `Kbd` so it's announced clearly.
* Inside a `KbdGroup`, keys read in source order; pin the group to `dir="ltr"` under RTL so a combo isn't announced or displayed in reverse.
