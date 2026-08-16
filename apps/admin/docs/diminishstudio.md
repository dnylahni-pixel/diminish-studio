```md
# Diminish Admin — Database Master Specification
**Target Stack:** Next.js App Router Dashboard + PostgreSQL (Neon) + Drizzle ORM + Clerk Auth  
**Document Type:** Full database specification  
**Purpose:** Single source of truth for all tables, columns, data types, constraints, and relationships

---

## 1) High-Level Architecture

```text
[Next.js App Router Pages]   ← Dashboard pages/modules
        ↕
[Zustand Stores]             ← global state (locale, theme, toast, confirm)
        ↕
[Shared Components/UI]       ← reusable layout and ui               
        ↕
[lib / types]                ← types, utils, i18n, mock-data
        ↕
[db / drizzle]               ← PostgreSQL layer on Neon

---

## 2) Core Principles

- **Single database** for admin + business data
- **Logical separation by schema**
  - `app`
  - `catalog`
  - `billing`
  - `credits`
- **Authentication handled externally by Clerk**
- Internal business records link to Clerk via `app.users.clerk_user_id`
- **UUID** for primary keys
- **timestamptz** for all timestamps
- **bigint** for money and credits
- **jsonb** for flexible metadata/configuration
- **Catalog-driven system**: plans, pricing, limits, credit policies, and addon behavior configurable from DB/admin, not hardcoded

---

## 3) Schemas

- `app` → internal user and core app identity mapping
- `catalog` → product catalog, plans, pricing, limits, features, addons, coupons
- `billing` → subscriptions, periods, lifecycle events, schedules, discounts, trials
- `credits` → credit balances, ledger, grants, reservations, consumption, expiration

---

## 4) Global Type Conventions

| Category | Type |
|---|---|
| Primary keys | `uuid` |
| Foreign keys | `uuid` |
| Timestamps | `timestamptz` |
| Money | `bigint` |
| Credits | `bigint` |
| Counts / quantities | `integer` or `bigint` depending on scale |
| Flexible config | `jsonb` |
| Boolean flags | `boolean` |

---

## 5) Enum Definitions

> These are logical enum names. Actual DB implementation can be PostgreSQL enums or checked text columns.

### 5.1 User / App Enums
- `user_status`
  - `active`
  - `inactive`
  - `suspended`

### 5.2 Catalog Enums
- `feature_kind`
  - `boolean`
  - `metered`
  - `quota`
  - `package`
- `price_type`
  - `recurring`
  - `one_time`
- `billing_interval`
  - `day`
  - `week`
  - `month`
  - `year`
- `plan_status`
  - `draft`
  - `active`
  - `archived`
- `plan_version_status`
  - `draft`
  - `published`
  - `retired`
- `limit_period`
  - `none`
  - `day`
  - `week`
  - `month`
- `limit_behavior`
  - `block`
  - `allow_overage`
- `feature_price_metric`
  - `unit`
  - `minute`
  - `megabyte`
  - `request`
  - `seat`
- `feature_price_model`
  - `flat`
  - `tiered`
  - `volume`
- `credit_policy_reset`
  - `none`
  - `daily`
  - `weekly`
  - `monthly`
- `proration_mode`
  - `none`
  - `immediate`
  - `next_cycle`
- `addon_scope`
  - `subscription`
  - `account`
- `coupon_type`
  - `percentage`
  - `fixed_amount`
  - `credit_grant`

### 5.3 Billing Enums
- `subscription_status`
  - `incomplete`
  - `trialing`
  - `active`
  - `past_due`
  - `paused`
  - `canceled`
  - `expired`
- `subscription_event_type`
  - `created`
  - `activated`
  - `renewed`
  - `plan_changed`
  - `price_changed`
  - `paused`
  - `resumed`
  - `past_due`
  - `canceled`
  - `expired`
  - `trial_started`
  - `trial_ended`
  - `discount_applied`
  - `addon_attached`
  - `addon_removed`
- `period_status`
  - `scheduled`
  - `active`
  - `closed`
  - `failed`
- `schedule_action`
  - `change_plan`
  - `change_price`
  - `pause`
  - `resume`
  - `cancel`
- `trial_status`
  - `scheduled`
  - `active`
  - `converted`
  - `expired`
  - `canceled`
- `discount_source_type`
  - `coupon`
  - `manual`
- `transaction_type`
  - `charge`
  - `refund`
  - `credit_adjustment`
  - `debit_adjustment`
- `transaction_status`
  - `pending`
  - `succeeded`
  - `failed`
  - `voided`
- `payment_method_type`
  - `card`
  - `bank_account`
  - `wallet`
  - `paypal`
  - `crypto`
- `payment_method_status`
  - `active`
  - `expired`
  - `disabled`
  - `deleted`
- `invoice_status`
  - `draft`
  - `open`
  - `paid`
  - `void`
  - `uncollectible`
  - `refunded`
  - `partially_refunded`
- `invoice_item_type`
  - `plan`
  - `addon`
  - `credit_package`
  - `usage`
  - `overage`
  - `discount`
  - `tax`
  - `adjustment`
- `tax_type`
  - `vat`
  - `sales_tax`
  - `gst`
  - `service_tax`
- `tax_status`
  - `active`
  - `inactive`
  - `archived`
- `redemption_status`
  - `applied`
  - `consumed`
  - `reversed`
  - `expired`
- `usage_aggregate_unit`
  - `unit`
  - `minute`
  - `megabyte`
  - `request`
  - `seat`

### 5.4 Credits Enums
- `credit_account_status`
  - `active`
  - `frozen`
  - `closed`
- `ledger_entry_type`
  - `grant`
  - `purchase`
  - `usage`
  - `refund`
  - `expiration`
  - `reservation_hold`
  - `reservation_release`
  - `reservation_capture`
  - `manual_adjustment`
- `credit_grant_source`
  - `plan`
  - `coupon`
  - `manual`
  - `promotion`
- `reservation_status`
  - `active`
  - `released`
  - `captured`
  - `expired`
- `credit_package_status`
  - `draft`
  - `active`
  - `archived`
- `usage_status`
  - `pending`
  - `confirmed`
  - `reversed`

---

## 6) Tables Overview

Total logical tables covered in this document:

### app
1. `app.users`

### catalog
2. `catalog.features`
3. `catalog.feature_dependencies`
4. `catalog.plans`
5. `catalog.plan_versions`
6. `catalog.plan_prices`
7. `catalog.plan_features`
8. `catalog.plan_limits`
9. `catalog.feature_pricing_rules`
10. `catalog.plan_credit_policies`
11. `catalog.plan_change_rules`
12. `catalog.addons`
13. `catalog.plan_addons`
14. `catalog.addon_prices`
15. `catalog.addon_features`
16. `catalog.coupons`

### billing
17. `billing.subscriptions`
18. `billing.subscription_events`
19. `billing.subscription_periods`
20. `billing.subscription_schedules`
21. `billing.trials`
22. `billing.subscription_addons`
23. `billing.subscription_discounts`
24. `billing.transactions`
25. `billing.payment_methods`
26. `billing.invoices`
27. `billing.invoice_items`
28. `billing.tax_rates`
29. `billing.coupon_redemptions`
30. `billing.usage_daily_aggregates`

### credits
31. `credits.credit_accounts`
32. `credits.credit_ledger`
33. `credits.credit_grants`
34. `credits.credit_reservations`
35. `credits.credit_packages`
36. `credits.credit_package_prices`
37. `credits.credit_expirations`
38. `credits.usage_events`

---

# 7) Detailed Table Specifications

---

## 7.1 `app.users`

**Purpose:** Internal user profile linked to Clerk user identity.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `clerk_user_id` | `text` | no |  | Unique external auth id |
| `email` | `text` | no |  | Current primary email |
| `display_name` | `text` | yes |  | User-facing name |
| `avatar_url` | `text` | yes |  | Optional avatar |
| `status` | `user_status` | no | `active` | Internal status |
| `timezone` | `text` | yes |  | e.g. `Asia/Tehran` |
| `locale` | `text` | yes |  | e.g. `fa`, `en` |
| `metadata` | `jsonb` | yes | `'{}'` | Arbitrary app metadata |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: `clerk_user_id`
- UNIQUE: `email`

**Relationships**
- One user → many `billing.subscriptions`
- One user → one or many `credits.credit_accounts`
- One user → many usage/billing records

---

## 7.2 `catalog.features`

**Purpose:** Master list of product capabilities/features.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `code` | `text` | no |  | Unique stable machine key |
| `name` | `text` | no |  | Human-readable |
| `description` | `text` | yes |  |  |
| `kind` | `feature_kind` | no |  | boolean / metered / quota / package |
| `unit_name` | `text` | yes |  | e.g. `minute`, `MB`, `request` |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` | UI/engine metadata |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: `code`

**Relationships**
- One feature → many `catalog.feature_dependencies`
- One feature → many `catalog.plan_features`
- One feature → many `catalog.plan_limits`
- One feature → many `catalog.feature_pricing_rules`
- One feature → many `catalog.addon_features`
- One feature → many `credits.usage_events`

---

## 7.3 `catalog.feature_dependencies`

**Purpose:** Defines feature-to-feature dependency rules.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `feature_id` | `uuid` | no |  | FK → features.id |
| `depends_on_feature_id` | `uuid` | no |  | FK → features.id |
| `is_hard_dependency` | `boolean` | no | `true` | If true, must exist |
| `condition_config` | `jsonb` | yes | `'{}'` | Optional conditional logic |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: (`feature_id`, `depends_on_feature_id`)
- CHECK: `feature_id <> depends_on_feature_id`

**Relationships**
- Many dependencies per feature
- Self-reference to `catalog.features`

---

## 7.4 `catalog.plans`

**Purpose:** Master plan definitions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `code` | `text` | no |  | Unique stable plan code |
| `name` | `text` | no |  |  |
| `description` | `text` | yes |  |  |
| `status` | `plan_status` | no | `draft` |  |
| `is_public` | `boolean` | no | `false` | Visible/selectable in UI |
| `sort_order` | `integer` | no | `0` | Dashboard ordering |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: `code`

**Relationships**
- One plan → many versions
- One plan → many subscriptions
- One plan → many change rules
- One plan → many addon mappings

---

## 7.5 `catalog.plan_versions`

**Purpose:** Versioned snapshots of plan configuration.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_id` | `uuid` | no |  | FK → plans.id |
| `version_number` | `integer` | no |  | 1,2,3... |
| `status` | `plan_version_status` | no | `draft` |  |
| `title` | `text` | yes |  | Optional internal label |
| `effective_from` | `timestamptz` | yes |  | When version becomes valid |
| `effective_to` | `timestamptz` | yes |  | Optional retirement |
| `change_notes` | `text` | yes |  |  |
| `metadata` | `jsonb` | yes | `'{}'` | Frozen config extras |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: (`plan_id`, `version_number`)

**Relationships**
- One version → many prices
- One version → many features
- One version → many limits
- One version → many pricing rules
- One version → many credit policies
- Used by subscriptions as the plan snapshot

---

## 7.6 `catalog.plan_prices`

**Purpose:** Base pricing rows for a plan version.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_version_id` | `uuid` | no |  | FK → plan_versions.id |
| `price_type` | `price_type` | no | `recurring` | recurring / one_time |
| `currency` | `text` | no |  | ISO currency code |
| `amount` | `bigint` | no |  | Minor unit (e.g. cents) |
| `billing_interval` | `billing_interval` | yes |  | Required when recurring |
| `billing_interval_count` | `integer` | yes |  | e.g. 1 month, 12 month |
| `trial_days` | `integer` | yes |  | Optional default trial |
| `is_default` | `boolean` | no | `false` | Preferred price row |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- CHECK: `amount >= 0`
- CHECK: `billing_interval_count IS NULL OR billing_interval_count > 0`

**Relationships**
- Many prices per plan version
- Referenced by subscriptions, schedules, transactions

---

## 7.7 `catalog.plan_features`

**Purpose:** Attaches included features to a plan version.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_version_id` | `uuid` | no |  | FK → plan_versions.id |
| `feature_id` | `uuid` | no |  | FK → features.id |
| `is_included` | `boolean` | no | `true` | Included or explicitly disabled |
| `config` | `jsonb` | yes | `'{}'` | Feature-level config |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`plan_version_id`, `feature_id`)

---

## 7.8 `catalog.plan_limits`

**Purpose:** Defines included limits/quotas per feature in a plan version.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_version_id` | `uuid` | no |  | FK → plan_versions.id |
| `feature_id` | `uuid` | no |  | FK → features.id |
| `limit_value` | `bigint` | yes |  | Null can mean unlimited if configured |
| `period` | `limit_period` | no | `none` | reset/measurement period |
| `behavior` | `limit_behavior` | no | `block` | block or allow overage |
| `overage_unit_price` | `bigint` | yes |  | Minor unit if overage allowed |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`plan_version_id`, `feature_id`, `period`)
- CHECK: `limit_value IS NULL OR limit_value >= 0`
- CHECK: `overage_unit_price IS NULL OR overage_unit_price >= 0`

---

## 7.9 `catalog.feature_pricing_rules`

**Purpose:** Defines metered/usage pricing for a feature within a plan version.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_version_id` | `uuid` | no |  | FK → plan_versions.id |
| `feature_id` | `uuid` | no |  | FK → features.id |
| `metric` | `feature_price_metric` | no |  | minute/MB/request/... |
| `pricing_model` | `feature_price_model` | no | `flat` | flat/tiered/volume |
| `currency` | `text` | yes |  | Needed for direct money charging |
| `unit_price` | `bigint` | yes |  | For flat per-unit charge |
| `tiers` | `jsonb` | yes | `'[]'` | Tier definitions |
| `credit_cost_per_unit` | `bigint` | yes |  | If spending credits instead of money |
| `minimum_charge` | `bigint` | yes |  | Optional floor |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `unit_price IS NULL OR unit_price >= 0`
- CHECK: `credit_cost_per_unit IS NULL OR credit_cost_per_unit >= 0`
- CHECK: `minimum_charge IS NULL OR minimum_charge >= 0`

---

## 7.10 `catalog.plan_credit_policies`

**Purpose:** Credit behavior attached to a plan version.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_version_id` | `uuid` | no |  | FK → plan_versions.id |
| `monthly_credit_grant` | `bigint` | no | `0` | Credits granted per cycle |
| `rollover_enabled` | `boolean` | no | `false` | Carry unused credits |
| `rollover_cap` | `bigint` | yes |  | Max carried balance |
| `reset_policy` | `credit_policy_reset` | no | `monthly` | daily/weekly/monthly/none |
| `grant_expiry_days` | `integer` | yes |  | Optional expiration |
| `negative_balance_allowed` | `boolean` | no | `false` |  |
| `max_negative_balance` | `bigint` | yes |  | If negatives allowed |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: `plan_version_id`
- CHECK: `monthly_credit_grant >= 0`
- CHECK: `rollover_cap IS NULL OR rollover_cap >= 0`

---

## 7.11 `catalog.plan_change_rules`

**Purpose:** Rules for upgrading/downgrading between plans.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `from_plan_id` | `uuid` | no |  | FK → plans.id |
| `to_plan_id` | `uuid` | no |  | FK → plans.id |
| `proration_mode` | `proration_mode` | no | `immediate` |  |
| `allow_change` | `boolean` | no | `true` |  |
| `carry_unused_credits` | `boolean` | no | `false` |  |
| `change_fee_amount` | `bigint` | yes |  | Optional fee |
| `currency` | `text` | yes |  | If fee exists |
| `rule_config` | `jsonb` | yes | `'{}'` | Advanced proration logic |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`from_plan_id`, `to_plan_id`)
- CHECK: `from_plan_id <> to_plan_id`

---

## 7.12 `catalog.addons`

**Purpose:** Master addon definitions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `code` | `text` | no |  | Unique machine key |
| `name` | `text` | no |  |  |
| `description` | `text` | yes |  |  |
| `scope` | `addon_scope` | no | `subscription` |  |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: `code`

---

## 7.13 `catalog.plan_addons`

**Purpose:** Which addons are available for which plans.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `plan_id` | `uuid` | no |  | FK → plans.id |
| `addon_id` | `uuid` | no |  | FK → addons.id |
| `is_default` | `boolean` | no | `false` | Auto-attached/visible |
| `is_required` | `boolean` | no | `false` | Must be attached |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`plan_id`, `addon_id`)

---

## 7.14 `catalog.addon_prices`

**Purpose:** Pricing rows for addons.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `addon_id` | `uuid` | no |  | FK → addons.id |
| `currency` | `text` | no |  |  |
| `amount` | `bigint` | no |  | Minor unit |
| `price_type` | `price_type` | no | `recurring` | recurring / one_time |
| `billing_interval` | `billing_interval` | yes |  | If recurring |
| `billing_interval_count` | `integer` | yes |  |  |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `amount >= 0`

---

## 7.15 `catalog.addon_features`

**Purpose:** Features unlocked by an addon.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `addon_id` | `uuid` | no |  | FK → addons.id |
| `feature_id` | `uuid` | no |  | FK → features.id |
| `config` | `jsonb` | yes | `'{}'` | Per-addon feature config |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`addon_id`, `feature_id`)

---

## 7.16 `catalog.coupons`

**Purpose:** Discount or credit grant coupons/promotions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `code` | `text` | no |  | Unique coupon code |
| `name` | `text` | yes |  | Internal/admin label |
| `type` | `coupon_type` | no |  | percentage/fixed_amount/credit_grant |
| `percentage_off` | `integer` | yes |  | 1..100 when percentage |
| `amount_off` | `bigint` | yes |  | Minor unit when fixed |
| `currency` | `text` | yes |  | Needed for fixed_amount |
| `credit_amount` | `bigint` | yes |  | If coupon grants credits |
| `max_redemptions` | `integer` | yes |  | Optional global cap |
| `redeemed_count` | `integer` | no | `0` | Runtime aggregate |
| `per_user_limit` | `integer` | yes |  | Max times each user can redeem |
| `starts_at` | `timestamptz` | yes |  |  |
| `expires_at` | `timestamptz` | yes |  |  |
| `applies_to_plan_id` | `uuid` | yes |  | FK → plans.id |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: `code`
- CHECK: `percentage_off IS NULL OR (percentage_off >= 1 AND percentage_off <= 100)`
- CHECK: `amount_off IS NULL OR amount_off >= 0`
- CHECK: `credit_amount IS NULL OR credit_amount >= 0`
- CHECK: `per_user_limit IS NULL OR per_user_limit > 0`

---

## 7.17 `billing.subscriptions`

**Purpose:** Main subscription record per user.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `plan_id` | `uuid` | no |  | FK → catalog.plans.id |
| `plan_version_id` | `uuid` | no |  | FK → catalog.plan_versions.id |
| `plan_price_id` | `uuid` | yes |  | FK → catalog.plan_prices.id |
| `status` | `subscription_status` | no | `incomplete` |  |
| `currency` | `text` | yes |  | Selected billing currency |
| `started_at` | `timestamptz` | yes |  |  |
| `current_period_start` | `timestamptz` | yes |  |  |
| `current_period_end` | `timestamptz` | yes |  |  |
| `cancel_at_period_end` | `boolean` | no | `false` |  |
| `canceled_at` | `timestamptz` | yes |  |  |
| `ended_at` | `timestamptz` | yes |  | Hard stop |
| `pause_starts_at` | `timestamptz` | yes |  |  |
| `pause_ends_at` | `timestamptz` | yes |  |  |
| `trial_id` | `uuid` | yes |  | FK → billing.trials.id |
| `external_ref` | `text` | yes |  | Optional billing provider ref |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Relationships**
- One subscription → many periods
- One subscription → many events
- One subscription → many schedules
- One subscription → many addons
- One subscription → many discounts
- One subscription → many transactions
- One subscription → many usage events

---

## 7.18 `billing.subscription_events`

**Purpose:** Audit trail of subscription lifecycle changes.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | no |  | FK → subscriptions.id |
| `event_type` | `subscription_event_type` | no |  |  |
| `event_time` | `timestamptz` | no | `now()` |  |
| `actor_user_id` | `uuid` | yes |  | FK → app.users.id, if admin/user initiated |
| `payload` | `jsonb` | yes | `'{}'` | Raw details/snapshot |
| `created_at` | `timestamptz` | no | `now()` |  |

---

## 7.19 `billing.subscription_periods`

**Purpose:** Individual billing periods/cycles for a subscription.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | no |  | FK → subscriptions.id |
| `period_index` | `integer` | no |  | 1,2,3... |
| `status` | `period_status` | no | `scheduled` |  |
| `period_start` | `timestamptz` | no |  |  |
| `period_end` | `timestamptz` | no |  |  |
| `price_id` | `uuid` | yes |  | FK → catalog.plan_prices.id |
| `amount_due` | `bigint` | yes |  | Minor unit |
| `amount_paid` | `bigint` | yes |  | Minor unit |
| `currency` | `text` | yes |  |  |
| `invoiced_at` | `timestamptz` | yes |  |  |
| `invoice_id` | `uuid` | yes |  | FK → billing.invoices.id |
| `paid_at` | `timestamptz` | yes |  |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: (`subscription_id`, `period_index`)

---

## 7.20 `billing.subscription_schedules`

**Purpose:** Future changes queued for a subscription.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | no |  | FK → subscriptions.id |
| `action` | `schedule_action` | no |  |  |
| `effective_at` | `timestamptz` | no |  | When to apply |
| `target_plan_id` | `uuid` | yes |  | FK → catalog.plans.id |
| `target_plan_version_id` | `uuid` | yes |  | FK → catalog.plan_versions.id |
| `target_price_id` | `uuid` | yes |  | FK → catalog.plan_prices.id |
| `config` | `jsonb` | yes | `'{}'` | Action details |
| `applied_at` | `timestamptz` | yes |  |  |
| `canceled_at` | `timestamptz` | yes |  |  |
| `created_at` | `timestamptz` | no | `now()` |  |

---

## 7.21 `billing.trials`

**Purpose:** Trial lifecycle records.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `plan_id` | `uuid` | no |  | FK → catalog.plans.id |
| `plan_version_id` | `uuid` | yes |  | FK → catalog.plan_versions.id |
| `status` | `trial_status` | no | `scheduled` |  |
| `starts_at` | `timestamptz` | no |  |  |
| `ends_at` | `timestamptz` | no |  |  |
| `converted_subscription_id` | `uuid` | yes |  | FK → subscriptions.id |
| `source` | `text` | yes |  | campaign/manual/default |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

---

## 7.22 `billing.subscription_addons`

**Purpose:** Addons attached to active subscriptions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | no |  | FK → subscriptions.id |
| `addon_id` | `uuid` | no |  | FK → catalog.addons.id |
| `addon_price_id` | `uuid` | yes |  | FK → catalog.addon_prices.id |
| `quantity` | `integer` | no | `1` |  |
| `started_at` | `timestamptz` | no | `now()` |  |
| `ended_at` | `timestamptz` | yes |  |  |
| `status` | `text` | no | `active` | optionally promote to enum later |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `quantity > 0`

---

## 7.23 `billing.subscription_discounts`

**Purpose:** Discounts/coupons applied to subscriptions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | no |  | FK → subscriptions.id |
| `source_type` | `discount_source_type` | no |  | coupon/manual |
| `coupon_id` | `uuid` | yes |  | FK → catalog.coupons.id |
| `name` | `text` | yes |  | Manual label or coupon snapshot |
| `amount_off` | `bigint` | yes |  | Minor unit |
| `percentage_off` | `integer` | yes |  | 1..100 |
| `starts_at` | `timestamptz` | yes |  |  |
| `ends_at` | `timestamptz` | yes |  |  |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

---

## 7.24 `billing.transactions`

**Purpose:** Financial transaction log.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `subscription_id` | `uuid` | yes |  | FK → subscriptions.id |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `type` | `transaction_type` | no |  |  |
| `status` | `transaction_status` | no | `pending` |  |
| `currency` | `text` | no |  |  |
| `amount` | `bigint` | no |  | Minor unit |
| `invoice_id` | `uuid` | yes |  | FK → billing.invoices.id |
| `payment_method_id` | `uuid` | yes |  | FK → billing.payment_methods.id |
| `external_ref` | `text` | yes |  | Payment/refund provider ref |
| `description` | `text` | yes |  |  |
| `payload` | `jsonb` | yes | `'{}'` | Provider response/details |
| `processed_at` | `timestamptz` | yes |  |  |
| `created_at` | `timestamptz` | no | `now()` |  |

---

## 7.25 `credits.credit_accounts`

**Purpose:** Credit wallet/account per user.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `status` | `credit_account_status` | no | `active` |  |
| `currency_context` | `text` | yes |  | Optional display/billing context |
| `balance` | `bigint` | no | `0` | Current available balance |
| `reserved_balance` | `bigint` | no | `0` | Held credits |
| `lifetime_granted` | `bigint` | no | `0` | Aggregate |
| `lifetime_used` | `bigint` | no | `0` | Aggregate |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: `user_id`

---

## 7.26 `credits.credit_ledger`

**Purpose:** Immutable accounting ledger for all credit movements.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `credit_account_id` | `uuid` | no |  | FK → credit_accounts.id |
| `entry_type` | `ledger_entry_type` | no |  |  |
| `amount` | `bigint` | no |  | Positive/negative depending on entry |
| `balance_after` | `bigint` | yes |  | Optional denormalized snapshot |
| `grant_id` | `uuid` | yes |  | FK → credit_grants.id |
| `reservation_id` | `uuid` | yes |  | FK → credit_reservations.id |
| `usage_event_id` | `uuid` | yes |  | FK → usage_events.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `transaction_id` | `uuid` | yes |  | FK → billing.transactions.id |
| `description` | `text` | yes |  |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

---

## 7.27 `credits.credit_grants`

**Purpose:** Grants of credits from plan cycles, coupons, promotions, or manual adjustments.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `credit_account_id` | `uuid` | no |  | FK → credit_accounts.id |
| `source` | `credit_grant_source` | no |  |  |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `coupon_id` | `uuid` | yes |  | FK → catalog.coupons.id |
| `amount_granted` | `bigint` | no |  |  |
| `amount_remaining` | `bigint` | no |  |  |
| `granted_at` | `timestamptz` | no | `now()` |  |
| `expires_at` | `timestamptz` | yes |  |  |
| `reference` | `text` | yes |  | Human/internal reference |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `amount_granted >= 0`
- CHECK: `amount_remaining >= 0`
- CHECK: `amount_remaining <= amount_granted`

---

## 7.28 `credits.credit_reservations`

**Purpose:** Holds credits before final capture, preventing overspend in concurrent operations.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `credit_account_id` | `uuid` | no |  | FK → credit_accounts.id |
| `usage_event_id` | `uuid` | yes |  | FK → usage_events.id |
| `reserved_amount` | `bigint` | no |  |  |
| `captured_amount` | `bigint` | no | `0` |  |
| `released_amount` | `bigint` | no | `0` |  |
| `status` | `reservation_status` | no | `active` |  |
| `expires_at` | `timestamptz` | yes |  | Hold timeout |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `reserved_amount >= 0`
- CHECK: `captured_amount >= 0`
- CHECK: `released_amount >= 0`
- CHECK: `captured_amount + released_amount <= reserved_amount`

---

## 7.29 `credits.credit_packages`

**Purpose:** Sellable credit packs.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `code` | `text` | no |  | Unique key |
| `name` | `text` | no |  |  |
| `description` | `text` | yes |  |  |
| `status` | `credit_package_status` | no | `draft` |  |
| `credit_amount` | `bigint` | no |  | Credits user receives |
| `expiry_days` | `integer` | yes |  | Optional post-purchase expiration |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- UNIQUE: `code`
- CHECK: `credit_amount > 0`

---

## 7.30 `credits.credit_package_prices`

**Purpose:** Pricing for sellable credit packages.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `credit_package_id` | `uuid` | no |  | FK → credit_packages.id |
| `currency` | `text` | no |  |  |
| `amount` | `bigint` | no |  | Minor unit |
| `is_active` | `boolean` | no | `true` |  |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `amount >= 0`

---

## 7.31 `credits.credit_expirations`

**Purpose:** Tracks credit expiration executions.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `credit_grant_id` | `uuid` | no |  | FK → credit_grants.id |
| `expired_amount` | `bigint` | no |  |  |
| `expired_at` | `timestamptz` | no | `now()` |  |
| `ledger_entry_id` | `uuid` | yes |  | FK → credit_ledger.id |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- CHECK: `expired_amount >= 0`

---

## 7.32 `credits.usage_events`

**Purpose:** Metered consumption records tied to features/subscriptions/credits.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `feature_id` | `uuid` | no |  | FK → catalog.features.id |
| `quantity` | `bigint` | no |  | Usage quantity |
| `unit_name` | `text` | yes |  | Denormalized unit |
| `status` | `usage_status` | no | `pending` | pending/confirmed/reversed |
| `usage_started_at` | `timestamptz` | yes |  |  |
| `usage_ended_at` | `timestamptz` | yes |  |  |
| `credit_cost` | `bigint` | yes |  | Captured credit cost |
| `money_cost` | `bigint` | yes |  | Captured monetary cost |
| `currency` | `text` | yes |  | If money cost used |
| `reservation_id` | `uuid` | yes |  | FK → credit_reservations.id |
| `idempotency_key` | `text` | yes |  | Prevent duplicate usage writes |
| `metadata` | `jsonb` | yes | `'{}'` | Request/runtime context |
| `created_at` | `timestamptz` | no | `now()` |  |
| `confirmed_at` | `timestamptz` | yes |  |  |

**Constraints**
- UNIQUE: `idempotency_key` (nullable unique if used consistently)
- CHECK: `quantity >= 0`
- CHECK: `credit_cost IS NULL OR credit_cost >= 0`
- CHECK: `money_cost IS NULL OR money_cost >= 0`

---

## 7.33 `billing.payment_methods`

**Purpose:** Payment methods saved per user (card, wallet, gateway, external provider).

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `provider` | `text` | no |  | Provider name (stripe, zarinpal, paddle) |
| `provider_payment_method_id` | `text` | no |  | Payment method ID in provider |
| `type` | `payment_method_type` | no |  | card/bank_account/wallet/paypal/crypto |
| `brand` | `text` | yes |  | Card brand (visa, mastercard) |
| `last4` | `text` | yes |  | Last 4 digits of card |
| `exp_month` | `int` | yes |  | Expiration month |
| `exp_year` | `int` | yes |  | Expiration year |
| `billing_name` | `text` | yes |  | Cardholder name |
| `billing_email` | `text` | yes |  | Billing email |
| `billing_country` | `text` | yes |  | Billing country |
| `billing_address` | `jsonb` | yes |  | Full billing address |
| `is_default` | `boolean` | no | `false` | User's default payment method |
| `status` | `payment_method_status` | no | `active` | active/expired/disabled/deleted |
| `metadata` | `jsonb` | yes | `'{}'` | Extra data |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: (`provider`, `provider_payment_method_id`)
- UNIQUE: `(user_id)` WHERE `is_default = true AND status = 'active'`

**Relationships**
- One user → many payment methods
- One payment method → many transactions
- One payment method → many invoices

---

## 7.34 `billing.invoices`

**Purpose:** Formal invoice/accounting document for subscriptions, credit packages, addons, overage, and one-time payments.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `invoice_number` | `text` | no |  | Unique human-readable invoice number |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `billing_period_id` | `uuid` | yes |  | FK → billing.subscription_periods.id |
| `payment_method_id` | `uuid` | yes |  | FK → billing.payment_methods.id |
| `transaction_id` | `uuid` | yes |  | FK → billing.transactions.id |
| `status` | `invoice_status` | no | `draft` | draft/open/paid/void/uncollectible/refunded/partially_refunded |
| `currency` | `text` | no |  | ISO currency |
| `subtotal_amount` | `bigint` | no |  | Sum before discount & tax |
| `discount_amount` | `bigint` | no | `0` | Total discount |
| `tax_amount` | `bigint` | no | `0` | Total tax |
| `total_amount` | `bigint` | no |  | Final amount |
| `amount_paid` | `bigint` | no | `0` | Amount paid |
| `amount_due` | `bigint` | no | `0` | Amount remaining |
| `tax_country` | `text` | yes |  | Tax country |
| `tax_region` | `text` | yes |  | Tax region/state |
| `tax_id` | `text` | yes |  | Buyer tax ID |
| `customer_snapshot` | `jsonb` | yes |  | Snapshot of user info at issue |
| `tax_snapshot` | `jsonb` | yes |  | Snapshot of applied tax rules |
| `discount_snapshot` | `jsonb` | yes |  | Snapshot of applied discounts |
| `provider` | `text` | yes |  | External provider |
| `provider_invoice_id` | `text` | yes |  | Invoice ID in external provider |
| `issued_at` | `timestamptz` | yes |  | Issue date |
| `due_at` | `timestamptz` | yes |  | Payment due date |
| `paid_at` | `timestamptz` | yes |  | Payment date |
| `voided_at` | `timestamptz` | yes |  | Void date |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: `invoice_number`
- CHECK: `subtotal_amount >= 0`
- CHECK: `discount_amount >= 0`
- CHECK: `tax_amount >= 0`
- CHECK: `total_amount >= 0`
- CHECK: `amount_paid >= 0`
- CHECK: `amount_due >= 0`
- CHECK: `total_amount = subtotal_amount - discount_amount + tax_amount`
- CHECK: `amount_due = total_amount - amount_paid`

**Relationships**
- One invoice → many invoice_items
- One invoice → one billing_period (optional)
- One invoice → one payment_method (optional)
- One invoice → one transaction (optional)
- Referenced by `billing.transactions.invoice_id`
- Referenced by `billing.subscription_periods.invoice_id`

---

## 7.35 `billing.invoice_items`

**Purpose:** Line items of an invoice tracking plan, addon, credit package, usage, overage, discount, and tax details.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `invoice_id` | `uuid` | no |  | FK → billing.invoices.id |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `type` | `invoice_item_type` | no |  | plan/addon/credit_package/usage/overage/discount/tax/adjustment |
| `description` | `text` | no |  | Human-readable description |
| `quantity` | `numeric(20,6)` | no |  | Quantity |
| `unit_amount` | `bigint` | no |  | Per-unit amount in minor unit |
| `subtotal_amount` | `bigint` | no |  | Amount before discount & tax |
| `discount_amount` | `bigint` | no | `0` | Discount for this item |
| `tax_amount` | `bigint` | no | `0` | Tax for this item |
| `total_amount` | `bigint` | no |  | Final amount for this item |
| `currency` | `text` | no |  | ISO currency |
| `plan_id` | `uuid` | yes |  | FK → catalog.plans.id |
| `plan_version_id` | `uuid` | yes |  | FK → catalog.plan_versions.id |
| `price_id` | `uuid` | yes |  | FK → catalog.prices.id |
| `addon_id` | `uuid` | yes |  | FK → catalog.addons.id |
| `usage_event_id` | `uuid` | yes |  | FK → billing.usage_events.id |
| `credit_package_id` | `uuid` | yes |  | FK → credits.credit_packages.id |
| `period_start` | `timestamptz` | yes |  | Item period start |
| `period_end` | `timestamptz` | yes |  | Item period end |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- CHECK: `quantity > 0`
- CHECK: `subtotal_amount >= 0`
- CHECK: `discount_amount >= 0`
- CHECK: `tax_amount >= 0`
- CHECK: `total_amount >= 0`
- CHECK: `total_amount = subtotal_amount - discount_amount + tax_amount`

**Relationships**
- Many items per invoice
- One item → one plan (optional)
- One item → one addon (optional)
- One item → one usage event (optional)

---

## 7.36 `billing.tax_rates`

**Purpose:** Tax/VAT/Sales Tax rate definitions per country, region, and product type.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `name` | `text` | no |  | Tax name (e.g. VAT Germany) |
| `country` | `text` | no |  | ISO country code |
| `region` | `text` | yes |  | State/region |
| `tax_type` | `tax_type` | no |  | vat/sales_tax/gst/service_tax |
| `rate_bps` | `int` | no |  | Rate in basis points (1900 = 19%) |
| `inclusive` | `boolean` | no | `false` | Is tax included in price |
| `applies_to` | `text` | no | `all` | all/subscription/addon/credit_package/usage |
| `status` | `tax_status` | no | `active` | active/inactive/archived |
| `valid_from` | `timestamptz` | no |  | Effective start |
| `valid_to` | `timestamptz` | yes |  | Effective end (null = ongoing) |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |
| `updated_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- CHECK: `rate_bps >= 0 AND rate_bps <= 10000`
- CHECK: `valid_to IS NULL OR valid_to > valid_from`

---

## 7.37 `billing.coupon_redemptions`

**Purpose:** Audit trail of coupon usage by users on subscriptions or invoices.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `coupon_id` | `uuid` | no |  | FK → catalog.coupons.id |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `invoice_id` | `uuid` | yes |  | FK → billing.invoices.id |
| `transaction_id` | `uuid` | yes |  | FK → billing.transactions.id |
| `status` | `redemption_status` | no | `applied` | applied/consumed/reversed/expired |
| `discount_type` | `text` | no |  | percent/amount/credit |
| `discount_amount` | `bigint` | yes |  | Discount amount applied |
| `discount_percent_bps` | `int` | yes |  | Discount percent in basis points |
| `credit_amount` | `bigint` | yes |  | Credit granted if credit coupon |
| `currency` | `text` | yes |  | Currency for fixed discount |
| `redeemed_at` | `timestamptz` | no | `now()` | Redemption time |
| `reversed_at` | `timestamptz` | yes |  | Reversal time |
| `coupon_snapshot` | `jsonb` | yes |  | Snapshot of coupon at redemption |
| `metadata` | `jsonb` | yes | `'{}'` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- CHECK: `discount_percent_bps IS NULL OR (discount_percent_bps BETWEEN 0 AND 10000)`
- CHECK: `discount_amount IS NOT NULL OR discount_percent_bps IS NOT NULL OR credit_amount IS NOT NULL`

**Relationships**
- One coupon → many redemptions
- One user → many redemptions

---

## 7.38 `billing.usage_daily_aggregates`

**Purpose:** Pre-aggregated daily usage for fast reporting without scanning large usage_events table.

| Column | Type | Null | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `date` | `date` | no |  | Report date |
| `user_id` | `uuid` | no |  | FK → app.users.id |
| `subscription_id` | `uuid` | yes |  | FK → billing.subscriptions.id |
| `feature_id` | `uuid` | no |  | FK → catalog.features.id |
| `unit` | `text` | no |  | Unit of measure |
| `total_quantity` | `numeric(30,6)` | no | `0` | Total consumed quantity |
| `total_credit_cost` | `bigint` | no | `0` | Total credit cost |
| `total_money_cost` | `bigint` | no | `0` | Total money cost |
| `currency` | `text` | yes |  | Currency for money cost |
| `event_count` | `bigint` | no | `0` | Number of events aggregated |
| `first_event_at` | `timestamptz` | yes |  | First event time |
| `last_event_at` | `timestamptz` | yes |  | Last event time |
| `updated_at` | `timestamptz` | no | `now()` |  |
| `created_at` | `timestamptz` | no | `now()` |  |

**Constraints**
- PK: `id`
- UNIQUE: (`date`, `user_id`, `subscription_id`, `feature_id`, `unit`)
- CHECK: `total_quantity >= 0`
- CHECK: `total_credit_cost >= 0`
- CHECK: `total_money_cost >= 0`
- CHECK: `event_count >= 0`

---

# 8) Relationship Map

## 8.1 User-Centric Relationships

- `app.users.id` → `billing.subscriptions.user_id`
- `app.users.id` → `billing.trials.user_id`
- `app.users.id` → `billing.transactions.user_id`
- `app.users.id` → `credits.credit_accounts.user_id`
- `app.users.id` → `credits.usage_events.user_id`
- `app.users.id` → `billing.subscription_events.actor_user_id`

## 8.2 Plan / Catalog Relationships

- `catalog.plans.id` → `catalog.plan_versions.plan_id`
- `catalog.plan_versions.id` → `catalog.plan_prices.plan_version_id`
- `catalog.plan_versions.id` → `catalog.plan_features.plan_version_id`
- `catalog.plan_versions.id` → `catalog.plan_limits.plan_version_id`
- `catalog.plan_versions.id` → `catalog.feature_pricing_rules.plan_version_id`
- `catalog.plan_versions.id` → `catalog.plan_credit_policies.plan_version_id`

## 8.3 Feature Relationships

- `catalog.features.id` → `catalog.feature_dependencies.feature_id`
- `catalog.features.id` → `catalog.feature_dependencies.depends_on_feature_id`
- `catalog.features.id` → `catalog.plan_features.feature_id`
- `catalog.features.id` → `catalog.plan_limits.feature_id`
- `catalog.features.id` → `catalog.feature_pricing_rules.feature_id`
- `catalog.features.id` → `catalog.addon_features.feature_id`
- `catalog.features.id` → `credits.usage_events.feature_id`

## 8.4 Addon Relationships

- `catalog.addons.id` → `catalog.plan_addons.addon_id`
- `catalog.addons.id` → `catalog.addon_prices.addon_id`
- `catalog.addons.id` → `catalog.addon_features.addon_id`
- `catalog.addons.id` → `billing.subscription_addons.addon_id`

## 8.5 Coupon Relationships

- `catalog.coupons.id` → `billing.subscription_discounts.coupon_id`
- `catalog.coupons.id` → `credits.credit_grants.coupon_id`
- `catalog.coupons.id` → `billing.coupon_redemptions.coupon_id`

## 8.6 Payment Method Relationships

- `billing.payment_methods.id` → `billing.transactions.payment_method_id`
- `billing.payment_methods.id` → `billing.invoices.payment_method_id`

## 8.7 Invoice Relationships

- `billing.invoices.id` → `billing.invoice_items.invoice_id`
- `billing.invoices.id` → `billing.transactions.invoice_id`
- `billing.invoices.id` → `billing.subscription_periods.invoice_id`
- `billing.invoices.id` → `billing.coupon_redemptions.invoice_id`

## 8.8 Tax Rate Relationships

- (tax_rates are standalone reference data)

## 8.9 Redemption Relationships

- `billing.coupon_redemptions.id` → references `catalog.coupons.id`, `app.users.id`, `billing.subscriptions.id`, `billing.invoices.id`, `billing.transactions.id`

## 8.10 Aggregation Relationships

- `billing.usage_daily_aggregates.user_id` → `app.users.id`
- `billing.usage_daily_aggregates.subscription_id` → `billing.subscriptions.id`
- `billing.usage_daily_aggregates.feature_id` → `catalog.features.id`

## 8.11 Billing Relationships

- `billing.subscriptions.id` → `billing.subscription_events.subscription_id`
- `billing.subscriptions.id` → `billing.subscription_periods.subscription_id`
- `billing.subscriptions.id` → `billing.subscription_schedules.subscription_id`
- `billing.subscriptions.id` → `billing.subscription_addons.subscription_id`
- `billing.subscriptions.id` → `billing.subscription_discounts.subscription_id`
- `billing.subscriptions.id` → `billing.transactions.subscription_id`
- `billing.subscriptions.id` → `credits.credit_ledger.subscription_id`
- `billing.subscriptions.id` → `credits.credit_grants.subscription_id`
- `billing.subscriptions.id` → `credits.usage_events.subscription_id`

## 8.12 Credit Relationships

- `credits.credit_accounts.id` → `credits.credit_ledger.credit_account_id`
- `credits.credit_accounts.id` → `credits.credit_grants.credit_account_id`
- `credits.credit_accounts.id` → `credits.credit_reservations.credit_account_id`

- `credits.credit_grants.id` → `credits.credit_ledger.grant_id`
- `credits.credit_grants.id` → `credits.credit_expirations.credit_grant_id`

- `credits.credit_reservations.id` → `credits.credit_ledger.reservation_id`
- `credits.credit_reservations.id` → `credits.usage_events.reservation_id`

- `credits.usage_events.id` → `credits.credit_ledger.usage_event_id`
- `credits.usage_events.id` → `credits.credit_reservations.usage_event_id`

---

# 9) Recommended Indexes

## app.users
- unique index on `clerk_user_id`
- unique index on `email`
- index on `status`

## catalog.features
- unique index on `code`
- index on `kind`
- index on `is_active`

## catalog.plans
- unique index on `code`
- index on `status`
- index on `is_public`
- index on `sort_order`

## catalog.plan_versions
- unique index on (`plan_id`, `version_number`)
- index on `status`
- index on `effective_from`
- index on `effective_to`

## catalog.plan_prices
- index on `plan_version_id`
- index on (`currency`, `is_active`)
- index on (`billing_interval`, `billing_interval_count`)

## catalog.plan_features
- unique index on (`plan_version_id`, `feature_id`)

## catalog.plan_limits
- unique index on (`plan_version_id`, `feature_id`, `period`)

## catalog.feature_pricing_rules
- index on (`plan_version_id`, `feature_id`)
- index on `is_active`

## catalog.plan_credit_policies
- unique index on `plan_version_id`

## catalog.plan_change_rules
- unique index on (`from_plan_id`, `to_plan_id`)

## catalog.addons
- unique index on `code`
- index on `is_active`

## catalog.plan_addons
- unique index on (`plan_id`, `addon_id`)

## catalog.addon_prices
- index on `addon_id`
- index on (`currency`, `is_active`)

## catalog.addon_features
- unique index on (`addon_id`, `feature_id`)

## catalog.coupons
- unique index on `code`
- index on `is_active`
- index on `starts_at`
- index on `expires_at`
- index on `applies_to_plan_id`

## billing.subscriptions
- index on `user_id`
- index on `plan_id`
- index on `plan_version_id`
- index on `status`
- index on `current_period_end`
- index on `cancel_at_period_end`

## billing.subscription_events
- index on `subscription_id`
- index on `event_type`
- index on `event_time`

## billing.subscription_periods
- unique index on (`subscription_id`, `period_index`)
- index on `status`
- index on `period_start`
- index on `period_end`

## billing.subscription_schedules
- index on `subscription_id`
- index on `effective_at`
- index on `action`

## billing.trials
- index on `user_id`
- index on `plan_id`
- index on `status`
- index on `starts_at`
- index on `ends_at`

## billing.subscription_addons
- index on `subscription_id`
- index on `addon_id`
- index on `status`

## billing.subscription_discounts
- index on `subscription_id`
- index on `coupon_id`
- index on `is_active`

## billing.transactions
- index on `subscription_id`
- index on `user_id`
- index on `status`
- index on `type`
- index on `processed_at`
- index on `external_ref`
- index on `invoice_id`
- index on `payment_method_id`

## billing.payment_methods
- index on `user_id`
- unique index on (`provider`, `provider_payment_method_id`)
- index on `status`

## billing.invoices
- index on `user_id`
- index on `subscription_id`
- unique index on `invoice_number`
- index on `status`
- index on `issued_at`
- index on `due_at`
- index on `provider_invoice_id`

## billing.invoice_items
- index on `invoice_id`
- index on `user_id`
- index on `subscription_id`
- index on `type`
- index on `usage_event_id`

## billing.tax_rates
- index on (`country`, `region`)
- index on `status`
- index on (`valid_from`, `valid_to`)
- index on `applies_to`

## billing.coupon_redemptions
- index on `coupon_id`
- index on `user_id`
- index on `subscription_id`
- index on `invoice_id`
- index on `status`
- index on `redeemed_at`

## billing.usage_daily_aggregates
- unique index on (`date`, `user_id`, `subscription_id`, `feature_id`, `unit`)
- index on `date`
- index on `user_id`
- index on `subscription_id`
- index on `feature_id`
- index on (`date`, `feature_id`)

## credits.credit_accounts
- unique index on `user_id`
- index on `status`

## credits.credit_ledger
- index on `credit_account_id`
- index on `entry_type`
- index on `created_at`
- index on `grant_id`
- index on `reservation_id`
- index on `usage_event_id`
- index on `subscription_id`
- index on `transaction_id`

## credits.credit_grants
- index on `credit_account_id`
- index on `source`
- index on `expires_at`
- index on `subscription_id`
- index on `coupon_id`

## credits.credit_reservations
- index on `credit_account_id`
- index on `status`
- index on `expires_at`
- index on `usage_event_id`

## credits.credit_packages
- unique index on `code`
- index on `status`

## credits.credit_package_prices
- index on `credit_package_id`
- index on (`currency`, `is_active`)

## credits.credit_expirations
- index on `credit_grant_id`
- index on `expired_at`

## credits.usage_events
- index on `user_id`
- index on `subscription_id`
- index on `feature_id`
- index on `status`
- index on `created_at`
- unique index on `idempotency_key` if always present

---

# 10) Business Rules Summary

## Plans
- A plan can have many versions
- A subscription always points to both `plan_id` and `plan_version_id`
- Plan versions freeze what the customer subscribed to
- Plan prices are attached to plan versions, not only the root plan

## Features
- Features are global capabilities
- Plan versions include features through `plan_features`
- Quotas and metering attach via `plan_limits` and `feature_pricing_rules`

## Limits
- Limits may be:
  - unlimited (`limit_value = null` if business rule permits)
  - fixed quota
  - overage-enabled with per-unit price

## Credits
- Plan-based credits defined in `plan_credit_policies`
- User credit state stored in `credit_accounts`
- All credit changes are immutable in `credit_ledger`
- Reservations prevent race conditions and overspending

## Billing
- `subscriptions` is the active state
- `subscription_events` is the audit log
- `subscription_periods` is cycle history
- `subscription_schedules` is future changes queue

## Trials
- Trials are first-class records
- Trial may convert into a subscription
- Subscription may reference originating trial

## Coupons / Discounts
- Coupons are reusable catalog items
- Active application of discount is stored in `subscription_discounts`

---

# 11) Integrity Rules

Recommended hard rules:

1. `app.users.clerk_user_id` must be unique
2. `catalog.features.code`, `catalog.plans.code`, `catalog.addons.code`, `catalog.coupons.code`, `credits.credit_packages.code` must be unique
3. `catalog.feature_dependencies.feature_id != depends_on_feature_id`
4. `catalog.plan_change_rules.from_plan_id != to_plan_id`
5. All money and credit amounts must be non-negative unless explicitly representing a debit in ledger
6. `credits.credit_grants.amount_remaining <= amount_granted`
7. `credits.credit_reservations.captured_amount + released_amount <= reserved_amount`
8. `billing.subscription_periods.period_index` unique per subscription
9. `credits.usage_events.idempotency_key` should be unique when used
10. Subscription references should always point to a valid frozen `plan_version_id`

---

# 12) Recommended Future Extensions

Not required now, but likely useful later:

- `app.organizations`
- `app.user_organizations`
- `billing.tax_profiles`
- `catalog.price_localizations`
- `catalog.plan_localizations`
- `audit.admin_logs`
- `webhooks.inbox_events`

---

# 13) Final Canonical Table List

text
app.users

catalog.features
catalog.feature_dependencies
catalog.plans
catalog.plan_versions
catalog.plan_prices
catalog.plan_features
catalog.plan_limits
catalog.feature_pricing_rules
catalog.plan_credit_policies
catalog.plan_change_rules
catalog.addons
catalog.plan_addons
catalog.addon_prices
catalog.addon_features
catalog.coupons

billing.subscriptions
billing.subscription_events
billing.subscription_periods
billing.subscription_schedules
billing.trials
billing.subscription_addons
billing.subscription_discounts
billing.transactions
billing.payment_methods
billing.invoices
billing.invoice_items
billing.tax_rates
billing.coupon_redemptions
billing.usage_daily_aggregates

credits.credit_accounts
credits.credit_ledger
credits.credit_grants
credits.credit_reservations
credits.credit_packages
credits.credit_package_prices
credits.credit_expirations
credits.usage_events

---

# 14) Implementation Notes for Neon + Drizzle + Clerk

- PostgreSQL provider: **Neon**
- ORM: **Drizzle**
- App auth: **Clerk**
- Keep `clerk_user_id` as the stable foreign identity bridge
- Use DB schemas directly in Postgres:
  - `app`
  - `catalog`
  - `billing`
  - `credits`
- Prefer `gen_random_uuid()` with `pgcrypto`
- Use `timestamptz` everywhere
- Use `bigint` for credit/money consistency
- Use `jsonb` only where flexibility is actually needed

---

# 15) Canonical Relationship Summary Diagram

text
app.users
 ├── billing.subscriptions
 ├── billing.trials
 ├── billing.transactions
 ├── billing.subscription_events(actor)
 ├── credits.credit_accounts
 └── credits.usage_events

catalog.plans
 ├── catalog.plan_versions
 ├── catalog.plan_addons
 ├── catalog.plan_change_rules(from)
 ├── catalog.plan_change_rules(to)
 ├── billing.subscriptions
 ├── billing.trials
 └── catalog.coupons(applies_to_plan_id)

catalog.plan_versions
 ├── catalog.plan_prices
 ├── catalog.plan_features
 ├── catalog.plan_limits
 ├── catalog.feature_pricing_rules
 ├── catalog.plan_credit_policies
 ├── billing.subscriptions
 ├── billing.subscription_schedules
 └── billing.trials

catalog.features
 ├── catalog.feature_dependencies
 ├── catalog.plan_features
 ├── catalog.plan_limits
 ├── catalog.feature_pricing_rules
 ├── catalog.addon_features
 └── credits.usage_events

catalog.addons
 ├── catalog.plan_addons
 ├── catalog.addon_prices
 ├── catalog.addon_features
 └── billing.subscription_addons

catalog.coupons
 ├── billing.subscription_discounts
 ├── credits.credit_grants
 └── billing.coupon_redemptions

billing.subscriptions
 ├── billing.subscription_events
 ├── billing.subscription_periods
 ├── billing.subscription_schedules
 ├── billing.subscription_addons
 ├── billing.subscription_discounts
 ├── billing.transactions
 ├── billing.invoices
 ├── billing.coupon_redemptions
 ├── billing.usage_daily_aggregates
 ├── credits.credit_ledger
 ├── credits.credit_grants
 └── credits.usage_events

billing.payment_methods
 ├── billing.transactions
 └── billing.invoices

billing.invoices
 ├── billing.invoice_items
 ├── billing.transactions
 ├── billing.subscription_periods
 └── billing.coupon_redemptions

billing.invoice_items
 ├── catalog.plans
 ├── catalog.addons
 └── credits.usage_events

billing.tax_rates
 └── (standalone reference data)

billing.coupon_redemptions
 ├── catalog.coupons
 ├── app.users
 ├── billing.subscriptions
 ├── billing.invoices
 └── billing.transactions

billing.usage_daily_aggregates
 ├── app.users
 ├── billing.subscriptions
 └── catalog.features

credits.credit_accounts
 ├── credits.credit_ledger
 ├── credits.credit_grants
 └── credits.credit_reservations

credits.credit_grants
 ├── credits.credit_ledger
 └── credits.credit_expirations

credits.credit_reservations
 ├── credits.credit_ledger
 └── credits.usage_events

---

## End of Specification

