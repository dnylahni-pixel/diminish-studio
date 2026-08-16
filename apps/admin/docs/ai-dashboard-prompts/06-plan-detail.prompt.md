# Prompt 06 — Plan Detail

Implement the read-only plan control page at `/plans/[planId]`. This stage visualizes the complete catalog model but does not mutate it.

## Project Capsule

- Next.js 16; `params` is asynchronous.
- Use `notFound()` for invalid UUID or missing plan.
- Use existing `Tabs`, `Card`, `DescriptionList`, `DataTable`, `Timeline`, `Badge`, `StatusIndicator`, `Accordion`, `Alert` and `EmptyState`.
- Do not build duplicate primitives or install packages.

## Data Graph

Root:

- `plans`: all visible catalog fields.

Versioning:

- `planVersions`: versionNumber, status, title, effectiveFrom, effectiveTo, changeNotes, createdAt
- `planPrices`: priceType, currency, amount, billingInterval, billingIntervalCount, trialDays, isDefault, isActive

Entitlements:

- `planFeatures` joined to `features`: code, name, kind, unitName, isIncluded, config
- `planLimits`: limitValue, period, behavior, overageUnitPrice
- `featurePricingRules`: metric, pricingModel, currency, unitPrice, tiers, creditCostPerUnit, minimumCharge
- `planCreditPolicies`: monthlyCreditGrant, rolloverEnabled, rolloverCap, resetPolicy, grantExpiryDays, negativeBalanceAllowed, maxNegativeBalance

Related catalog:

- `planAddons` joined to `addons` and `addonPrices`
- `planChangeRules` for both outbound and inbound changes
- subscription count grouped by version and status

## Header

- Breadcrumb: Plans & Pricing / plan name.
- Plan name, code, description.
- Status and Public/Private badges.
- Updated timestamp.
- No nonfunctional Edit or Publish button.

## Summary Row

- Current published version.
- Active subscribers.
- Default price.
- Monthly credit grant.

## Tabs

1. Overview
2. Versions
3. Pricing
4. Features & Limits
5. Credits
6. Add-ons
7. Change Rules

## Exact Presentation

- Overview: `DescriptionList` plus subscriber status breakdown.
- Versions: vertical `Timeline`; each item shows version, status, effective range and change notes.
- Pricing: table grouped by version and currency.
- Features & Limits: one `AccordionItem` per feature containing inclusion, quota, behavior and pricing rule.
- Credits: one policy card; clearly distinguish balance policy from actual user balances.
- Add-ons: addon table with default/required state and active price.
- Change Rules: two sections—Allowed transitions from this plan and transitions into this plan.

## Safety

- Render JSON config only as compact formatted key/value rows; do not dump raw unbounded JSON.
- Never expose internal metadata unless a known display field is explicitly selected.
- Format unlimited `limitValue = null` as `Unlimited`.
- Distinguish no rule from zero-valued rule.

## Files Allowed

- `src/app/(admin)/plans/[planId]/page.tsx`
- `src/app/(admin)/plans/[planId]/loading.tsx`
- `src/features/plans/queries.ts`
- `src/features/plans/types.ts`
- `src/features/plans/components/plan-*`

Do not overwrite plan list components.

## Acceptance

- Full catalog graph renders without N+1.
- Empty tabs use compact empty states.
- Different versions are never merged accidentally.
- No mutation controls.
- Build and lint succeed.

If web-only, provide full contents for each file.
