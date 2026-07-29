# گزارش تسک `FND-001` — ثبت snapshot امن branch، environment و DB metadata

## وضعیت

- نتیجه: `SUCCESS`
- برنچ الزامی: `docs/admin-user-plan-enforcement-analysis`
- برنچ مشاهده‌شده: `docs/admin-user-plan-enforcement-analysis`
- commit پایه: `ea5c34e3b1d2875d5110d95db82ec9aa47aa22cf`
- commit اجرایی: `25b9529adafc5ef58e72bc4699e3ebd07e1d1b3f`
- commit ثبت Roadmap: `see git commit containing this update`
- تاریخ UTC: `2026-07-29T12:43:50Z`

## محدوده

- Roadmap: `docs/admin-user-integration/roadmaps/01-FOUNDATION-AND-SECURITY.md`
- Task: `FND-001`
- Depends on: none
- Allowed paths: `docs/admin-user-integration/task-reports/FND-001-*.md` و همان Roadmap
- فایل‌های تغییرکرده: این report و metadata همان task در Roadmap

## کنترل Admin read-only

- Admin path: `/home/danial/diminish all project/super-admin-diminish`
- status قبل: branch `integration/runpod`؛ 55 entry موجود؛ fingerprint برابر `5cea033db0050a09ba955747be5211509fb138984febf3b7285210dcfe4fd607`
- status بعد: 55 entry موجود؛ fingerprint برابر `5cea033db0050a09ba955747be5211509fb138984febf3b7285210dcfe4fd607`
- تغییر تازه توسط این Agent: `NO`

## هدف و معیار تکمیل

- هدف واحد: snapshot قابل‌بازتولید و sanitized از branch، environment و metadata دیتابیس برای تعیین `UNK-001..007`
- معیارها:
  - [x] پیاده‌سازی کامل
  - [x] فقط User repo
  - [x] تست جدید کافی
  - [x] تست جدید موفق
  - [x] تست مرتبط قبلی موفق
  - [x] typecheck/build مرتبط موفق یا برای task مستنداتی نامرتبط
  - [x] behavior واقعی اثبات‌شده
  - [x] هیچ سرویس پولی واقعی فراخوانی نشده
  - [x] secret/PII در خروجی نیست

## Snapshot محیط

- User HEAD: `ea5c34e3b1d2875d5110d95db82ec9aa47aa22cf`
- User working tree قبل از task: فقط مجموعه `docs/` به‌صورت untracked
- Admin HEAD: `efdd7c78662c77c0247be6f502b89843a9117b43`
- `DATABASE_URL` در process environment پروژه User: absent
- فایل env در User repo تا عمق سه: none
- مرجع اتصال فقط برای اجرای read-only: فایل `.env` پروژه Admin؛ مقدار URL یا credential خوانده و چاپ نشد.
- ابزارها: `psql` موجود، Node `v26.2.0`، pnpm `10.33.0`
- DB identity sanitized: database hash `1aad2780f5bf2f804f5c5f6de0e3969e`، role hash `79128504a255e587612bb3f9ad6e701b`
- PostgreSQL: `18.4 (df16b3c)`؛ recovery state برابر `false`

## نتایج `UNK-001..007`

### `UNK-001` — schema و aggregate counts

- تعداد tableهای base در `public`: `47`
- هر ۹ جدول User موجود است: `users`, `artists`, `songs`, `song_analyses`, `song_stems`, `library`, `chords`, `learning_sessions`, `chord_attempts`
- aggregate امن: users=`2`، songs=`5`، song analyses=`3`
- aggregate catalog/runtime: plans=`1`، plan versions=`1`، features=`0`، plan limits=`0`، subscriptions=`0`، credit accounts=`0`، usage events=`0`

### `UNK-002` — nullable Clerk identity

- تعداد rowهای `users` با `clerk_id IS NULL`: `0`
- metadata ستون همچنان `nullable=YES` و default=`NULL` است؛ drift schema تأیید شد.

### `UNK-003` — catalog فعلی

- یک plan با code `gpcaht` و status=`draft` وجود دارد.
- plan دارای یک version و یک price است.
- هیچ feature و هیچ plan limit وجود ندارد.
- نتیجه rollout: enforcement مبتنی بر feature در snapshot فعلی fail-closed همه درخواست‌های محدود را رد می‌کند.

### `UNK-004` — subscription status distribution

- جدول subscriptions در snapshot فعلی صفر row دارد؛ distribution خالی است.

### `UNK-005` — indexes واقعی

- `subscriptions` فقط index کلید اصلی `subscriptions_pkey` را دارد.
- `usage_events` فقط index کلید اصلی `usage_events_pkey` را دارد.
- unique index برای active subscription یا `usage_events.idempotency_key` وجود ندارد.

### `UNK-006` — migration history

- جدول `drizzle.__drizzle_migrations` موجود است.
- ستون‌ها: integer `id`، text `hash`، bigint `created_at`
- migration count=`0` و distinct hash count=`0`؛ history ثبت‌شده خالی است.

### `UNK-007` — DB role privileges

- role فعلی روی schema `public` هر دو privilege `USAGE` و `CREATE` را دارد.
- روی `plans` و `usage_events` هر چهار privilege `SELECT`, `INSERT`, `UPDATE`, `DELETE` را دارد.
- نتیجه امنیتی: credential فعلی least-privilege runtime role نیست و قابلیت write catalog و runtime data دارد.

## Drift و constraint evidence

- `users.storage_quota_bytes`: `NOT NULL` با default=`209715200`، معادل 200 MiB
- `users.storage_used_bytes`: `NOT NULL` با default=`0`
- `users.clerk_id`: nullable در DB، با unique constraint `users_clerk_id_unique`
- subscription foreign keyها به user، plan، plan version و optional price موجودند؛ constraint یکتایی eligible subscription وجود ندارد.
- usage event foreign keyهای user/feature و checkهای quantity/cost موجودند؛ idempotency uniqueness وجود ندارد.

## Query list sanitized

تمام queryها فقط `SELECT` بودند:

- identity هش‌شده database/user، server version و recovery state
- inventory جدول‌ها و حضور ۹ جدول User
- aggregate count بدون row شخصی
- count مربوط به `NULL clerk_id`
- metadata ستون‌های drift در `users`
- aggregate catalog برای plan/feature/limit
- distribution وضعیت subscription
- indexها و constraintهای مرتبط
- migration metadata و aggregate history
- privilege checks برای schema، catalog و usage tables

هیچ DDL، DML، transaction تغییردهنده یا خواندن email، Clerk ID، URL، credential و row شخصی انجام نشد.

## Migration/Data impact

- migration: `NONE`
- DB هدف test: remote PostgreSQL با identity هش‌شده فوق؛ environment classification در `FND-002` تعیین می‌شود
- DDL/DML روی shared/production DB: `NO`
- rollback procedure: نیاز نیست؛ هیچ write انجام نشد
- compatibility: بدون تغییر runtime یا schema

## تست‌ها

| فرمان | exit code | نتیجه | تعداد |
|---|---:|---|---:|
| branch/status User و status Admin | `0` | pass | 3 |
| local environment/tool inventory | `0` | pass | 1 |
| read-only `psql` داخل sandbox | `2` | fail: DNS sandbox؛ بدون query execution | 1 |
| read-only `psql` approved | `130` | timeout و interrupt؛ بدون output یا write | 1 |
| Neon HTTP metadata snapshot با `SELECT` | `0` | pass | 15 query |
| Neon HTTP migration aggregate با `SELECT` | `0` | pass | 2 query |
| Markdown diff/link/secret validation | `0` | pass | 3 check |

### سناریوهای حساس

- dependency failure: failure اولیه psql ثبت شد؛ مسیر HTTP رسمی Admin موفق بود
- exact boundary: default storage bytes و zero-row boundaries ثبت شدند
- external timeout/failure: timeout اولیه هیچ نتیجه یا write ایجاد نکرد
- transaction rollback: applicable نیست؛ هیچ write transaction وجود نداشت

## اثبات عملکرد

- evidence artifact/log: همین گزارش با نتایج sanitized queryها
- external-call assertions: صفر تماس RunPod، B2 و Clerk؛ فقط اتصال read-only PostgreSQL
- DB invariant assertions: inventory، aggregate، column، index، constraint، migration و privilege metadata خوانده شد
- reason codes observed: `SNAPSHOT_COMPLETE`, `CATALOG_EMPTY`, `OWNER_LEVEL_DB_ROLE`

## امنیت

- threat بسته‌شده: unknownهای metadata بدون افشای credential یا PII تعیین شدند.
- fail-closed evidence: catalog فعلی feature/subscription ندارد و برای rollout مستقیم آماده نیست.
- secrets redacted: هیچ مقدار env، hostname، database name، role name یا row شخصی در گزارش ثبت نشده.
- remaining risk: role فعلی write-capable است؛ environment و migration ownership باید در `FND-002` تعیین شوند.

## مانع، در صورت عدم موفقیت

- علت: none
- output/error خلاصه: تلاش‌های اولیه psql ناموفق بودند؛ queryهای نهایی Neon HTTP همگی exit `0`
- cleanup انجام‌شده: process معلق اولیه متوقف شد؛ هیچ فایل یا داده Admin تغییر نکرد
- فایل ناقص: none
- نیاز به Admin change: `NO`
- next safe step: اجرای `FND-002` توسط Agent بعدی

## Roadmap update

- checkbox تغییر کرد: `YES`
- report path ثبت شد: `YES`
- commit hash ثبت شد: `YES`

تیک فقط برای `SUCCESS` و پس از تمام معیارها مجاز است.
