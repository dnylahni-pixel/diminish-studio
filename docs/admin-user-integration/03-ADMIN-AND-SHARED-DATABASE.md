# شناخت Admin و دیتابیس مشترک

## 1. مرز تغییر

Admin در `/home/danial/diminish all project/diminish-studio/apps/admin` control plane سیستم است. تغییر آن برای ساخت Interface اتصال مجاز است، اما هر task تغییردهنده Admin به approval صریح مالک محصول نیاز دارد.

Admin هنگام بررسی Next.js 16، React 19، Drizzle، Neon PostgreSQL، Clerk dependency و یک SQLite محلی برای audit RunPod داشت. وضعیت working tree Admin از قبل modified/untracked بود؛ این وضعیت متعلق به کاربر است و نباید خارج Allowed paths task دستکاری شود.

## 2. DB topology واقعی از روی code

Admin connection در `src/db/index.ts:5` از `DATABASE_URL` و Neon HTTP استفاده می‌کند. تمام جداول اصلی با `pgTable(...)` تعریف شده‌اند؛ schema نام‌گذاری‌شده PostgreSQL (`pgSchema`) استفاده نشده است. بنابراین نام‌های منطقی `catalog`, `billing`, `credits` در ساختار پوشه/domain هستند، نه PostgreSQL schema جدا؛ جداول در `public` قرار می‌گیرند.

Admin یک SQLite جدا در `src/db/local.ts` برای `runpod_audit_log` دارد. این SQLite منبع plan/subscription/credit نیست.

Metadata امن DB نشان داد User core tables و Admin domain tables در یک PostgreSQL database حضور دارند. host، password، email، Clerk ID یا row شخصی در این اسناد ثبت نشده است.

## 3. users bridge

پل اصلی دو سیستم `users.id` از نوع integer است:

- User schema: `packages/db/src/schema/users.ts`
- Admin read model: `src/db/schema/app/index.ts`

Admin آن را legacy table می‌داند و فقط ستون‌های موجود برای FKها را تعریف می‌کند. تمام `subscriptions.user_id`, `credit_accounts.user_id`, `usage_events.user_id` و چند جدول billing به همین integer FK وصل‌اند.

Drift مهم:

| مورد | User code | Admin code | DB مشاهده‌شده |
|---|---:|---:|---:|
| `clerk_id` nullable | خیر | بله | بله |
| storage default | 1 GiB | 200 MiB | 200 MiB default |

هیچ Agent نباید این drift را خودسرانه با migration حل کند. ابتدا policy منبع حقیقت و migration ownership باید در task preflight تأیید شود.

## 4. Catalog: منبع تعریف محصول

### Plans

`src/db/schema/catalog/plans.ts`:

- `plans`: UUID، code unique، status=`draft|active|archived`, visibility و metadata
- `plan_versions`: UUID، FK به plan، version number unique per plan، status=`draft|published|retired`، effective window
- `plan_prices`: price type، currency، amount minor unit، interval، trial، active/default

Subscription به `plan_version_id` pin می‌شود؛ runtime نباید latest plan version را حدس بزند.

### Features و dependencies

`src/db/schema/catalog/features.ts`:

- feature code unique؛
- kind=`boolean|metered|quota|package`؛
- active flag و unit name؛
- hard/soft dependency با no-self check و pair unique.

Cycle چندگره‌ای فقط در application logic قابل تشخیص است.

### Plan rules

`src/db/schema/catalog/rules.ts`:

- `plan_features`: inclusion و JSON config per version/feature
- `plan_limits`: value، period=`none|day|week|month`، behavior=`block|allow_overage`
- `feature_pricing_rules`: metric، model، money/credit unit cost، minimum charge، tiers
- `plan_credit_policies`: monthly grant، rollover، reset، negative balance policy
- `plan_change_rules`: upgrade/downgrade policy و proration

Semantics مهم:

- `limit_value = NULL` یعنی unlimited در runtime Admin؛
- missing feature با explicit deny یکسان نیست؛
- `is_included=false` باید deny باشد؛
- inactive feature باید deny شود؛
- hard dependency مفقود یا cycle باید fail-closed شود؛
- published version باید immutable تلقی شود، ولی DB trigger قطعی برای آن مشاهده نشد.

### Addon و coupon

`addons`, `plan_addons`, `addon_prices`, `addon_features`, `coupons` تعریف شده‌اند. Runtime entitlement باید addon فعال subscription را جدا از addon مجاز plan بررسی کند.

## 5. Subscription domain

جدول مرکزی `subscriptions` در `src/db/schema/billing/subscriptions.ts`:

- user FK؛
- plan، version و price FK؛
- status=`incomplete|trialing|active|past_due|paused|canceled|expired`؛
- current period؛
- cancellation/pause fields؛
- metadata و external reference.

نکات:

- unique constraint برای «حداکثر یک active/trialing subscription per user» دیده نشد؛
- پس runtime نباید اولین row را سلیقه‌ای انتخاب کند؛ چند row eligible باید conflict و fail-closed باشد تا policy تعیین شود؛
- plan version pin باید مبنای entitlement باشد؛
- period bounds برای usage window مهم‌اند.

جداول مرتبط:

- `subscription_periods`
- `subscription_schedules`
- `subscription_events`
- `subscription_addons`
- `subscription_discounts`
- `trials`
- `transactions`
- `payment_methods`
- `invoices`, `invoice_items`
- `coupon_redemptions`
- `usage_daily_aggregates`

بخش بزرگی از این domain در Admin UI read/query می‌شود؛ runtime mutation کامل payment/subscription در User code فعلی وجود ندارد.

## 6. Credits و usage

### Credit account

`credit_accounts` به ازای هر user unique است و cached fields دارد:

- `balance`
- `reserved_balance`
- `lifetime_granted`
- `lifetime_used`
- status=`active|frozen|closed`

### Grants و ledger

- `credit_grants`: source، amount granted/remaining، expiry
- `credit_ledger`: append-style entries برای grant/purchase/usage/refund/reservation/...؛ چند logical UUID reference بدون FK
- `credit_expirations`: expiration record

### Reservation

`credit_reservations`:

- reserved/captured/released amounts؛
- status؛
- nullable `expires_at`؛
- CHECK مجموع capture و release از reserve بیشتر نشود.

### Usage event

`usage_events` در `src/db/schema/credits/usage-events.ts`:

- user، feature، optional subscription/reservation؛
- quantity؛
- status=`pending|confirmed|reversed`؛
- credit/money cost؛
- `idempotency_key` nullable و بدون unique constraint در code؛
- timestamps و metadata.

برای enforcement امن، reserve/capture/release، usage status، wallet cached balance و ledger باید transactionally هماهنگ شوند. صرف insert usage event کافی نیست.

## 7. Admin runtime logic موجود

### Feature policy

`src/features/features/policy.ts` precedence زیر را دارد:

1. feature inactive → deny
2. plan override
3. feature metadata default
4. system default

System default فعلی allow است؛ User runtime برای عملیات پرهزینه نباید missing data را با default allow تفسیر کند. اتصال User باید fail-closed contract مستقل و صریح داشته باشد.

### Runtime feature policy

`src/features/features/runtime.ts:57`:

- feature code را resolve می‌کند؛
- plan features، limits و pricing را می‌خواند؛
- hard dependency را recursively resolve می‌کند؛
- cycle/missing dependency را deny می‌کند؛
- quote cost را محاسبه می‌کند.

این کد production enforcement API نیست. Roadmap نسخه دوم باید semantics معتبر را پشت Module مستقل API اتصال مدیریتی قرار دهد؛ User Application نباید آن را import یا copy کند.

### Entitlement intelligence

`src/features/entitlement-engine/index.ts` یک dataset-based intelligence resolver برای UI/support است. field names آن با Drizzle schema دقیقاً یکسان نیست و production enforcement service محسوب نمی‌شود.

### Plan creation

`src/features/plans/actions.ts:133` plan، version، price، credit policy و links را در Neon HTTP transaction می‌سازد. Plan active به version published map می‌شود. این action نشان می‌دهد Admin catalog writer است.

### Publish governance

`src/features/catalog-intelligence/plan-version-governance.ts` overlap، multiple published version، missing feature/price و subscription روی draft/retired را تحلیل می‌کند؛ اما دیده نشد که تمام writerها را در DB enforce کند.

## 8. Admin auth هشدار مستقل

RunPod module یک permission matrix خوب در `src/integrations/runpod/server/policy.ts` دارد، ولی identity adapter در `identity-adapter.ts:30` همیشه preview owner می‌دهد. این خطر Admin است، اما قانون پروژه اجازه تغییر آن را نمی‌دهد. فقط در risk register باقی می‌ماند و نباید scope اتصال User را گسترش دهد.

## 9. وضعیت داده مشاهده‌شده

Aggregate امن اولیه نشان داد DB توسعه‌ای تقریباً خالی است:

- چند user/song/analysis؛
- یک plan/version/price/credit policy؛
- feature، limit، subscription، credit account و usage مؤثر تقریباً/کاملاً خالی گزارش شدند.

این snapshot لحظه‌ای است و اتصال نهایی بعداً timeout شد. Agent اجرایی باید task preflight مخصوص snapshot امن را اجرا کند و نتیجه را در گزارش ثبت کند. نبود feature/subscription یعنی enforcement جدید اگر بی‌مهابا فعال شود همه درخواست‌ها را fail-closed مسدود خواهد کرد؛ rollout و bootstrap data تصمیم انسانی می‌خواهد.

## 10. مالکیت هدف داده و رفتار

| Domain | مالک | دسترسی User Application |
|---|---|---|
| capability/plan/version/limit/pricing/credit policy | Admin control plane | فقط از API اتصال |
| published policy sync و rollback | Admin control plane | فقط مشاهده نتیجه sync |
| subscription اصلی و addonها | Admin control plane | فقط از API اتصال |
| quote/reservation/usage/credit/ledger/refund | Module اتصال مدیریتی | فقط commandهای purpose-specific API |
| runtime operation manifest | User Application | publish از طریق API اتصال |
| operation journal و اجرای provider | User Application | read/write محلی |
| core users/songs/upload state | User Application | read/write |

User Application در production نباید credential دیتابیس Admin یا دسترسی مستقیم به جدول‌های catalog/billing/credits داشته باشد.
