
# Forms & Validation (/ui/docs/react/forms)



Forms are built from two pieces: `Field`, which groups a control with its label,
description, and error message and wires up the accessibility relationships; and
`Form`, which coordinates the fields and surfaces server-side errors. Both wrap
[Base UI](https://base-ui.com) primitives.

## Anatomy of a field [#anatomy-of-a-field]

A `Field` composes a label, a control, an optional description, and an error
slot. The `for`/`id` and `aria-describedby` associations are handled for you.

```tsx
import { Field, FieldLabel, FieldDescription, FieldError } from '@appica/ui-react/field'
import { Input } from '@appica/ui-react/input'

export default function EmailField() {
  return (
    <Field name="email">
      <FieldLabel>Email</FieldLabel>
      <Input type="email" required placeholder="you@example.com" />
      <FieldDescription>We'll only use this to send receipts.</FieldDescription>
      <FieldError />
    </Field>
  )
}
```

## Validation [#validation]

### Native constraints [#native-constraints]

Standard HTML attributes — `required`, `type`, `min`, `maxLength`, `pattern` —
are validated automatically. Point `FieldError` at a specific failure with
`match`, or render the browser's default message with a bare `<FieldError />`:

```tsx
<Field name="email">
  <FieldLabel>Email</FieldLabel>
  <Input type="email" required />
  <FieldError match="valueMissing">An email is required.</FieldError>
  <FieldError match="typeMismatch">Enter a valid email address.</FieldError>
</Field>
```

### Custom validation [#custom-validation]

For rules HTML can't express, pass a `validate` function to the `Field`. Return a
string (or array of strings) to fail, or `null` to pass. Control when it runs
with `validationMode` (`'onBlur'` or `'onChange'`):

```tsx
<Field
  name="username"
  validationMode="onBlur"
  validate={(value) => (String(value).length < 3 ? 'At least 3 characters.' : null)}
>
  <FieldLabel>Username</FieldLabel>
  <Input />
  <FieldError />
</Field>
```

`validate` can be async — return a promise — which is handy for availability
checks against an API.

### Shake on invalid [#shake-on-invalid]

For an extra cue when validation fails, hang the `animate-shake` utility off the
control's invalid state. Base UI sets `data-invalid` on the control when the field
fails validation, so put the class on the `Input` to shake just the control:

```tsx
<Field name="email">
  <FieldLabel>Email</FieldLabel>
  <Input type="email" required className="data-invalid:motion-safe:animate-shake" />
  <FieldError />
</Field>
```

<Callout type="note">
  The shake plays once, when the field *becomes* invalid (the moment `data-invalid` is added) — not on every failed
  submit while it stays invalid. Gating it behind `motion-safe:` keeps it off for users who prefer reduced motion, per
  [Animation](/ui/docs/react/animation).
</Callout>

## Grouping with Fieldset [#grouping-with-fieldset]

Use `Fieldset` and `FieldsetLegend` to group related fields under a shared label
(an accessible `<fieldset>`/`<legend>`):

```tsx
import { Fieldset, FieldsetLegend } from '@appica/ui-react/fieldset'

export default function BillingAddress() {
  return (
    <Fieldset>
      <FieldsetLegend>Billing address</FieldsetLegend>
      <Field name="street">
        <FieldLabel>Street</FieldLabel>
        <Input />
      </Field>
      <Field name="city">
        <FieldLabel>City</FieldLabel>
        <Input />
      </Field>
    </Fieldset>
  )
}
```

## The Form wrapper [#the-form-wrapper]

`Form` ties the fields together and handles submission. Its most useful job is
displaying **server-side** errors: return them keyed by field `name` and pass
them to `errors`, and each `Field` shows its message in place.

```tsx
'use client'

import * as React from 'react'
import { Form } from '@appica/ui-react/form'
import { Field, FieldLabel, FieldError } from '@appica/ui-react/field'
import { Input } from '@appica/ui-react/input'
import { Button } from '@appica/ui-react/button'

export default function SignupForm() {
  const [errors, setErrors] = React.useState({})

  return (
    <Form
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const result = await signUp(data) // your server action / API call
        if (result.errors) setErrors(result.errors) // e.g. { email: 'Already taken.' }
      }}
    >
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input type="email" required />
        <FieldError />
      </Field>
      <Button type="submit">Create account</Button>
    </Form>
  )
}
```

<Callout type="note">
  Inputs are uncontrolled by default — read values from `FormData` on submit, as above. You can still control any field
  with `value`/`onValueChange` (or `onChange`) when you need to.
</Callout>

## Accessibility [#accessibility]

Labels, descriptions, and error messages are associated with their control
automatically, and invalid fields are marked with `aria-invalid`. See
[Accessibility](/ui/docs/react/accessibility) — and note that grouped controls
(`RadioGroup`, `CheckboxGroup`) are labeled with `aria-label`/`aria-labelledby`,
not `FieldLabel`.