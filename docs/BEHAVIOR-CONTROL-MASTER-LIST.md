# Behavior Control — Master List (فهرست کامل برای دسته‌بندی توسط مالک)

> تاریخ: `2026-08-05` · منبع: [`docs/APPLICATION-BEHAVIOR-CONTROL-RESEARCH.md`](APPLICATION-BEHAVIOR-CONTROL-RESEARCH.md)
>
> ## طرز کار
> 1. هر ردیف یک رفتار است؛ **هیچ گروه‌بندی‌ای از پیش رویش تحمیل نشده**.
> 2. در ستون آخر «دسته‌بندی شما» برچسب خود را بنویسید (تک یا چندتایی با `+` — یک مورد می‌تواند **چند محور** باشد، مثل `کلی + فرانت`).
> 3. برچسب‌ها کاملاً با شماست — می‌توانید از واژه‌های خودتان استفاده کنید؛ ستون «پیشنهاد قبلی» فقط پیشنهاد اولیه است و نظر شما معتبر است.
> 4. برچسب‌های رایج به عنوان نقطه شروع: `کلی` `پلن` `کاربر` `منبع` `فرانت` `برند` `عملیاتی` `امنیتی` — یا هرچه خودتان می‌خواهید.
>
> وقتی پر شد بگویید؛ من فهرست را می‌خوانم و بر اساس **دسته‌بندی شما** بازسازی می‌کنم. (اگر ترجیح می‌دهید، به‌جای ویرایش فایل، در چت هم می‌توانید به شکل `BC-05: کلی` یا `BC-09: کلی + پلن` بگویید.)

| ID | مورد | نوع | لایه | مقدار فعلی | محل | پیشنهاد قبلی | دسته‌بندی شما |
|---|---|---|---|---|---|---|---|
| BC-01 | فعال بودن تحلیل (RunPod) | boolean | BE | فقط env | `api-server/.../routes/analyze.ts:83` | کلی | |
| BC-02 | timeout تحلیل | number | BE | `300000` ms | `analyze.ts:113` | کلی | |
| BC-03 | نسخه‌ی تحلیل | string | BE | `"1"` | `analyze.ts:228` | کلی | |
| BC-04 | انقضای URL تحلیل | number | BE | `3600` s | `analyze.ts:99` | کلی | |
| BC-05 | انقضای URL master track | number | BE | `900` s | `song-details.ts:155` | کلی | |
| BC-06 | حداکثر حجم آپلود | number | BE | `104857600` (100MB) | `uploads.constants.ts:11` | کلی | |
| BC-07 | حداکثر مدت آپلود | number | BE | `600` s | `uploads.constants.ts:13` | کلی | |
| BC-08 | انواع MIME مجاز | list | BE | ۵ نوع | `uploads.constants.ts:3` | کلی | |
| BC-09 | انقضای presign | number | BE | `900` s | `uploads.constants.ts:14` | کلی | |
| BC-10 | سقف نرخ آپلود (rate limit) | number | BE | `10` / `60000` ms | `uploads.service.ts:29` | کلی | |
| BC-11 | تعداد آهنگ‌های ویژه | number | BE | `8` | `songs.ts:80` | کلی | |
| BC-12 | قانون مهارت آکورد | number×۲ | BE | `≥5` تلاش، `≥80%` موفقیت | `learning.ts:69` | کلی | |
| BC-13 | retry احراز هویت Clerk | number | BE | `60` s | `users.ts:37` + `library.ts:87` | کلی | |
| BC-14 | پارامترهای SQL pool | number×۳ | BE | `15000`/`30000`/max | `packages/db/src/index.ts:15` | کلی | |
| BC-15 | دسترسی به قابلیت در پلن | boolean | DB | `plan_features.is_included` | `admin-new/.../catalog/plans.ts` | پلن | |
| BC-16 | سقف مصرف در پلن | number+period | DB | `plan_limits` | `admin-new/.../catalog/rules.ts:31` | پلن | |
| BC-17 | قیمت‌گذاری مصرف‌محور | struct | DB | `feature_pricing_rules` | `catalog/rules.ts:58` | پلن | |
| BC-18 | سیاست اعتبار پلن | struct | DB | `plan_credit_policies` | `catalog/rules.ts:89` | پلن | |
| BC-19 | قوانین تغییر پلن | struct | DB | `plan_change_rules` | `catalog/rules.ts:116` | پلن | |
| BC-20 | سهمیه‌ی پیش‌فرض ذخیره‌سازی پلن | number | DB | (پیشنهادی، از طریق `plan_limits`) | — | پلن | |
| BC-21 | defaultAccess قابلیت | enum | DB | `features.metadata.defaultAccess` | `catalog/features.ts:8` | پلن | |
| BC-22 | وابستگی قابلیت‌ها | graph | DB | `feature_dependencies` | `catalog/features.ts:24` | پلن | |
| BC-23 | سهمیه‌ی ذخیره‌سازی کاربر | number | DB | `users.storage_quota_bytes` | `packages/db/.../users.ts:19` | کاربر | |
| BC-24 | وضعیت کاربر | enum | DB | `user_status` (ستون هنوز نیست) | `admin-new/.../enums.ts:4` | کاربر | |
| BC-25 | حساب اعتبار کاربر | struct | DB | `credit_accounts` | `admin-new/.../credits/credit-accounts.ts:8` | کاربر | |
| BC-26 | اشتراک / افزونه / تخفیف کاربر | struct | DB | `subscriptions` و… | `admin-new/.../billing/*` | کاربر | |
| BC-27 | دموی یادگیری (اتصال به کاربر ۱) | boolean | BE | `DEMO_USER_ID = 1` بدون auth | `learning.ts:9` + `chords.ts:9` | کاربر | |
| BC-28 | دسترسی آزمایشی پایلوت | struct | — | ساخته نشده (ADR) | `CONTEXT.md` | کاربر | |
| BC-29 | انتشار / عدم انتشار آهنگ | enum | DB | `songs.status` | `packages/db/.../songs.ts:30` | منبع | |
| BC-30 | ویژه‌سازی آهنگ | boolean | DB | `songs.featured` | `songs.ts:79` | منبع | |
| BC-31 | سختی آهنگ | enum | DB | `songs.difficulty` | — | منبع | |
| BC-32 | وضعیت تحلیل آهنگ | enum | DB | `song_analyses.analysis_status` | `song-analyses.ts:17` | منبع | |
| BC-33 | کاتالوگ آکورد | data | DB | `chords` | — | منبع | |
| BC-34 | ورود با لینک (URL import) | boolean | FE | `disabled` | `process.tsx:306,601` | فرانت | |
| BC-35 | آستانه‌های هشدار سهمیه | numbers | FE | `70%` / `90%` | `StorageQuotaBar.tsx:42` | فرانت | |
| BC-36 | سطح‌های پیچیدگی آکورد | list | FE | `simple/medium/pro` | `player.tsx:356` | فرانت | |
| BC-37 | محدودیت‌های پلیر | numbers | FE | سرعت `0.3–2.0`، نیم‌پرده `−12..12` | `player.tsx:243` | فرانت | |
| BC-38 | مسیر پس از ورود | string | FE | `/library` | `login.tsx`، `register.tsx` | فرانت | |
| BC-39 | مسیرها / منو | struct | FE | استاتیک wouter | `App.tsx:39` + `app-layout.tsx:16` | فرانت | |
| BC-40 | متن‌های حالت خالی/خطا | strings | FE | سخت‌کد | `library.tsx`، `music-hub.tsx`، `profile.tsx` | فرانت | |
| BC-41 | متن‌های مارکتینگ | strings | FE | سخت‌کد | `home.tsx:29-101` | برند | |
| BC-42 | برندینگ اپ (نام / نسخه) | strings | FE | «DiminishStudio»، «v1.0.0» | `app-layout.tsx:44,114,153` | برند | |
| BC-43 | PWA manifest | struct | BT | `screenshots: []` و… | `vite.config.ts:35-63` | برند | |
| BC-44 | اسرار B2 / Clerk / RunPod | — | BE | env | `config.ts:111-128` | امنیتی | |
| BC-45 | validation magic-bytes | — | BE | `MAGIC_BYTES_MAP` | `uploads.constants.ts:25` | امنیتی | |
| BC-46 | قفل atomic سهمیه | — | BE | `incrementStorageUsed` | `uploads.repository.ts:56` | امنیتی | |
| BC-47 | گارد production DB | — | BE | env-check | `config.ts:62` | امنیتی | |
