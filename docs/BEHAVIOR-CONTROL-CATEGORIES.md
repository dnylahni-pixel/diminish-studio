# Behavioral Control Categories — دسته‌بندی گروهی کنترل‌ها

> تاریخ: `2026-08-05` · همراه با [`docs/APPLICATION-BEHAVIOR-CONTROL-RESEARCH.md`](APPLICATION-BEHAVIOR-CONTROL-RESEARCH.md)
>
> گروه‌بندی بر اساس **دامنه‌ی اثر** است. ستون‌ها: **نوع** = نوع مقداری که ادمین تنظیم می‌کند · **لایه** = BE (بک‌اند) / FE (فرانت) / DB (داده) / BT (build-time) · **اولویت** = ⭐ تا ⭐⭐⭐

---

## دسته ۱ — پلتفرم (سراسری)
مستقل از هر کاربر؛ تغییر، کل سیستم را تحت تأثیر قرار می‌دهد.

| مورد | نوع | مقدار فعلی | کد پیشنهادی | لایه | محل | اولویت |
|---|---|---|---|---|---|---|
| فعال بودن تحلیل | boolean | فقط env | `analyze.enabled` | BE | `analyze.ts:83` | ⭐⭐⭐ |
| timeout تحلیل | number | `300000` ms | `analyze.timeout_ms` | BE | `analyze.ts:113` | ⭐⭐ |
| نسخه‌ی تحلیل | string | `"1"` | `analyze.version` | BE | `analyze.ts:228` | ⭐ |
| انقضای URL تحلیل | number | `3600` s | `analyze.signed_url_expiry_s` | BE | `analyze.ts:99` | ⭐ |
| انقضای URL master | number | `900` s | `player.master_url_expiry_s` | BE | `song-details.ts:155` | ⭐ |
| حداکثر حجم آپلود | number | `104857600` (100MB) | `upload.max_file_size_bytes` | BE | `uploads.constants.ts:11` | ⭐⭐⭐ |
| حداکثر مدت آپلود | number | `600` s | `upload.max_duration_s` | BE | `uploads.constants.ts:13` | ⭐⭐ |
| انواع MIME مجاز | list | ۵ نوع | `upload.allowed_mime_types` | BE | `uploads.constants.ts:3` | ⭐⭐ |
| انقضای presign | number | `900` s | `upload.presign_expiry_s` | BE | `uploads.constants.ts:14` | ⭐⭐ |
| سقف نرخ آپلود | number | `10` / `60000` ms | `upload.rate_limit` | BE | `uploads.service.ts:29` | ⭐⭐ |
| تعداد آهنگ‌های ویژه | number | `8` | `songs.featured_count` | BE | `songs.ts:80` | ⭐⭐ |
| قانون مهارت آکورد | number×۲ | `≥5` تلاش ، `≥80%` موفقیت | `learning.mastery_min_attempts` / `learning.mastery_success_rate` | BE | `learning.ts:69` | ⭐⭐ |
| retry احراز هویت Clerk | number | `60` s | `auth.retry_after_seconds` | BE | `users.ts:37` + `library.ts:87` | ⭐ |
| پارامترهای SQL pool | number×۳ | `15000`/`30000`/max | (زیرساخت) | BE | `packages/db/src/index.ts:15` | ⭐ |

---

## دسته ۲ — پلن / گروه کاربری
برای گروه کاربران (پلن/افزونه)؛ بین پلن‌ها متفاوت است.

| مورد | نوع | منبع داده | لایه | محل |
|---|---|---|---|---|
| دسترسی به قابلیت در پلن | boolean | `plan_features.is_included` | DB | `admin-new/.../catalog/plans.ts` + `rules.ts` |
| سقف مصرف در پلن | number + period | `plan_limits` (`limit_value`, `period`, `behavior`) | DB | `catalog/rules.ts:31` |
| قیمت‌گذاری مصرف‌محور | struct | `feature_pricing_rules` (`metric`, `model`, `tiers`, `credit_cost_per_unit`) | DB | `catalog/rules.ts:58` |
| سیاست اعتبار پلن | struct | `plan_credit_policies` (`monthly_credit_grant`, `rollover`, `reset_policy`, `negative_balance`) | DB | `catalog/rules.ts:89` |
| قوانین تغییر پلن | struct | `plan_change_rules` (`proration_mode`, `allow_change`, `change_fee_amount`) | DB | `catalog/rules.ts:116` |
| سهمیه‌ی پیش‌فرض ذخیره‌سازی پلن | number | (پیشنهاد: از طریق `plan_limits` → `storage.quota_default_bytes`) | DB | — |
| defaultAccess قابلیت | enum `allow/deny` | `features.metadata.defaultAccess` | DB | `catalog/features.ts:8` |
| وابستگی قابلیت‌ها | graph | `feature_dependencies` (`is_hard_dependency`, `condition_config`) | DB | `catalog/features.ts:24` |

---

## دسته ۳ — کاربر
برای هر کاربر متفاوت است.

| مورد | نوع | منبع داده | لایه | محل |
|---|---|---|---|---|
| سهمیه‌ی ذخیره‌سازی کاربر | number | `users.storage_quota_bytes` | DB | `packages/db/.../users.ts:19` |
| وضعیت کاربر | enum `active/inactive/suspended` | `user_status` — ستون هنوز در `users` نیست | DB | `admin-new/.../enums.ts:4` |
| حساب اعتبار کاربر | struct | `credit_accounts` (`balance`, `reserved_balance`, `status`=frozen/…) | DB | `admin-new/.../credits/credit-accounts.ts:8` |
| اشتراک / افزونه / تخفیف کاربر | struct | `subscriptions`، `subscription_addons`، `subscription_discounts`، `trials` | DB | `admin-new/.../billing/*` |
| دموی یادگیری (اتصال به کاربر ۱) | boolean | `learning.demo_enabled` — امروز `DEMO_USER_ID = 1` بدون auth | BE | `learning.ts:9` + `chords.ts:9` |
| دسترسی آزمایشی پایلوت | struct | افزونه‌ی آزمایشی (ADR) — ساخته نشده | — | `CONTEXT.md` |

---

## دسته ۴ — منبع / محصول
برای هر آیتم محصول (آهنگ/آکورد)؛ نه سیاست، بلکه داده‌ی وضعیت منبع.

| مورد | نوع | منبع داده | لایه | محل | نیاز |
|---|---|---|---|---|---|
| انتشار / عدم انتشار آهنگ | enum | `songs.status` | DB | `packages/db/.../songs.ts:30` | **endpoint نوشتن (ندارد)** |
| ویژه‌سازی آهنگ | boolean | `songs.featured` | DB | `songs.ts:79` | **endpoint نوشتن (ندارد)** |
| سختی آهنگ | enum | `songs.difficulty` | DB | — | — |
| وضعیت تحلیل آهنگ | enum | `song_analyses.analysis_status` | DB | `song-analyses.ts:17` | — |
| کاتالوگ آکورد | data | `chords` | DB | — | — |

---

## دسته ۵ — فرانت / تجربه‌ی عملکردی
نمایش و رفتار کلاینت؛ اثر عملکردی بدون تغییر بک‌اند.

| مورد | نوع | مقدار فعلی | کد پیشنهادی | لایه | محل | اولویت |
|---|---|---|---|---|---|---|
| ورود با لینک (URL import) | boolean | `disabled` | `import_url.enabled` | FE | `process.tsx:306,601` | ⭐⭐⭐ |
| آستانه‌های هشدار سهمیه | numbers | `70%` / `90%` | `ui.storage_warning_thresholds` | FE | `StorageQuotaBar.tsx:42` | ⭐⭐ |
| سطح‌های پیچیدگی آکورد | list | `simple/medium/pro` | `ui.chord_levels` | FE | `player.tsx:356` | ⭐ |
| محدودیت‌های پلیر | numbers | سرعت `0.3–2.0` ، نیم‌پرده `−12..12` | `ui.player_limits` | FE | `player.tsx:243` | ⭐ |
| مسیر پس از ورود | string | `/library` | `ui.post_login_redirect` | FE | `login.tsx`، `register.tsx` | ⭐ |
| مسیرها / منو | struct | استاتیک wouter | `routes.*` | FE | `App.tsx:39` + `app-layout.tsx:16` | ⭐⭐ |
| متن‌های حالت خالی/خطا | strings | سخت‌کد | `ui.empty_copy.*` | FE | `library.tsx`، `music-hub.tsx`، `profile.tsx` | ⭐ |

---

## دسته ۶ — برند / محتوا (CMS)
محتوای نمایشی و برندینگ؛ بدون اثر عملکردی.

| مورد | نوع | کد پیشنهادی | لایه | محل |
|---|---|---|---|---|
| متن‌های مارکتینگ صفحه اصلی | strings | `home.hero` ، `home.features` | FE | `home.tsx:29-101` |
| برندینگ اپ (نام / نسخه‌ی فوتر) | strings | `branding.name` ، `branding.version` | FE | `app-layout.tsx:44,114,153` |
| PWA manifest | struct | `pwa.manifest` | BT | `vite.config.ts:35-63` |

---

## خط امنیتی — غیرقابل پیکربندی (فقط مقدار تنظیم‌پذیر، هرگز منطق)
| مورد | دلیل |
|---|---|
| اسرار B2 / Clerk / RunPod | امنیت |
| validation magic-bytes | اصالت محتوا سمت سرور |
| قفل atomic سهمیه | یکپارچگی (عدد قابل تنظیم است، اعمال سمت سرور) |
| گارد production DB | ایمنی محیط |
