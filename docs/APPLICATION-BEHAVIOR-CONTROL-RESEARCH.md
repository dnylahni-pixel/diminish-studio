# Application Behavior Control Systems — Research

> **تحقیق: کنترل رفتار نرم‌افزار نسخه کاربر از داشبورد مدیریتی**
>
> تاریخ: `2026-08-05` · برنچ: `unified-local-development` · وضعیت: تحقیق و اینوینتوری (هیچ تغییری در کد اعمال نشده)
>
> این سند حاصل کاوش موازی کدبیس است: نسخه کاربر (`apps/diminish-studio` + `apps/api-server`) و سمت مدیریتی (`apps/admin` + `apps/admin-new`).

---

## ۱. خلاصه مدیریتی

هدف این تحقیق: پیدا کردن تمام رفتارهای نرمافزاری در **نسخه کاربر** که امروز **سختکد (hardcoded)** هستند و میتوان آنها را از **داشبورد مدیریتی** بدون تغییر کد کنترل کرد.

### یافتههای کلیدی

| # | یافته | شدت |
|---|---|---|
| 1 | در بکاند کاربر (api-server) حدود **۱۶ مقدار/سوئیچ سختکد** وجود دارد: سهمیه ذخیرهسازی، حداکثر حجم و مدت آپلود، MIME type های مجاز، timeout تحلیل، سقف rate limit، قانون مهارت آکورد، شمار قابلیتهای ویژه، انقضای URL های امضاشده و… | 🔴 بالا |
| 2 | در فرانت کاربر حدود **۱۳ رفتار سختکد** وجود دارد: حدهای آپلود (کپی دوم از بکاند)، فعال/غیرفعال بودن «ورود با لینک»، آستانههای هشدار سهمیه، سطحهای پیچیدگی آکورد، متنهای مارکتینگ، مسیرهای استاتیک و… | 🔴 بالا |
| 3 | یک **موتور «قانون-به-صورت-دیتا» (policy-as-data)** از قبل در `apps/admin` و `apps/admin-new` ساخته شده است: کاتالوگ قابلیت (`features`)، پلنهای نسخهدار (`plan_versions`)، محدودیتها (`plan_limits`)، قیمتگذاری (`feature_pricing_rules`) و یک **resolver خالص** (`features/runtime.ts` + `features/policy.ts`) که دسترسی/محدودیت/قیمت را از روی دیتای دیتابیس حل میکند. | 🟢 آماده |
| 4 | مشکل اصلی: این موتور از **runtime کاربر هیچجایی مصرف نمیشود**. `features.is_active` / `defaultAccess` / plan limits امروز کاملاً قابل ویرایش از داشبورد هستند ولی **هیچ رفتاری را در اپ واقعاً تغییر نمیدهند**. | 🔴 شکاف مرکزی |
| 5 | هیچ جدول `settings`/`feature_flags`، هیچ API مدیریتی (Integration API v1)، هیچ لایه احراز هویت ادمین در api-server و هیچ endpoint نوشتن (publish / featured / quota) وجود ندارد. | 🟠 شکاف زیرساختی |

### توصیه یکخطی

**شروع کار با یک `GET /config/bootstrap` است** (برگرداندن حدها و feature flags به فرانت در startup) + یک جدول `settings` KV — کمترین هزینه با بیشترین تأثیر فوری؛ سپس اتصال موتور کاتالوگ قابلیت به runtime کاربر از طریق Integration API (طبق ADR 0009) برای کنترل واقعی رفتارها.

---

## ۲. روش و محدوده

- **نسخه کاربر (منبع رفتارها):** `apps/diminish-studio` (فرانت React 19 + wouter) و `apps/api-server` (بکاند Express 5 + Drizzle) بههمراه `packages/db` (schema کاربر) و `packages/api-spec` / `api-client-react` / `api-zod` (قرارداد + client).
- **داشبورد مدیریتی (سمت دریافتکننده کنترل):** `apps/admin` (ادمین کامل) و `apps/admin-new` (بازسازی UI روی Appica UI؛ محل جدید کاتالوگ قابلیت).
- هر رفتار به یکی از سه کلاس دستهبندی شد:
  - **(A) سختکد** — در کد/محیط ثابت شده و میتواند به کنترلپنل منتقل شود.
  - **(B) داده-محور** — از قبل در دیتابیس است و در runtime قابل تغییر است.
  - **(C) ناایمن برای پیکربندی** — امنیت/هزینه؛ باید در کد بماند (فقط مقدارش قابل تنظیم باشد، نه منطق).

> این سند **فقط تحقیق و اینوینتوری** است؛ هیچ فایلی تغییر، migrate یا build نشده است.

---

## ۳. نقشهی ۹ حوزه به کدبیس (وضعیت هر مکانیزم در این پروژه)

پاسخ به این پرسش که «هرکدام از مکانیزمهای کنترل رفتار کجا در این کدبیس وجود دارد یا ندارد»:

| حوزه | وضعیت در Diminish Studio | محل دقیق |
|---|---|---|
| **۱. Feature Flag** | داده وجود دارد (`features.is_active`، `defaultAccess` در metadata) ولی **هیچ مصرف runtime ندارد**؛ هیچ kill switch فعالی در بکاند کاربر نیست (تنها استثنا: `backendConfig.runPod` خالی → 503). | `admin-new/.../catalog/features.ts` + `api-server/.../routes/analyze.ts:83` |
| **۲. Workflow Engine** | موتور جریان کاری وجود ندارد. تنها «جریان»: چرخهی تحلیل (processing→completed/error) و چرخهی آپلود (pending→uploaded) که بهصورت **UPDATE درون handler** نوشته شدهاند؛ بدون صف، بدون تعریف مرحله بهصورت داده. | `api-server/.../routes/analyze.ts` + `uploads.service.ts:185-210` |
| **۳. Rules Engine** | دادهی قوانین وجود دارد: `plan_limits` (limit/period/behavior)، `feature_pricing_rules`، `plan_change_rules` و یک **resolver خالص** (`resolveOptionalFeaturePolicy` + `getRuntimeFeaturePolicy`). ولی این resolver فقط در ادمین است و runtime کاربر از آن استفاده نمیکند. | `admin-new/src/features/features/{policy,runtime}.ts` + `catalog/rules.ts` |
| **۴. Dynamic Routing** | وجود ندارد. مسیرهای فرانت با wouter **کاملاً استاتیک** تعریف شدهاند؛ هیچ route manifest دادهمحور نیست. | `apps/diminish-studio/src/App.tsx:39-95` |
| **۵. State Machine** | بخشی وجود دارد: enum های وضعیت (`songs.status`، `analysis_status`، `subscription_status` و…) و انتقالها بهصورت inline انجام میشوند؛ ماشین وضعیت متمرکز وجود ندارد. | `packages/db/src/schema/songs.ts` + `song-analyses.ts` |
| **۶. Event-Driven** | فقط **audit** وجود دارد: `subscription_events` و `runpod_audit_log`. هیچ Event→Action / automation وجود ندارد. | `admin-new/.../billing/subscription-events.ts` |
| **۷. Config Management** | وجود ندارد. `backendConfig` (api-server) یک **snapshot فقط-env از boot** است و هیچ جدول پیکربندی runtime در `packages/db` نیست. | `api-server/src/config.ts` |
| **۸. Headless CMS / Admin** | بخشی: کاتالوگ قابلیت/پلن در `admin-new` قابل ویرایش از UI است (create/update/archive). ولی «محتوا/کامپوننت» اپ کاربر را کنترل نمیکند. | `admin-new/src/components/features/*` |
| **۹. No-Code / Low-Code** | بهصورت مفهومی: اکشن عمومی `saveFeaturePlanPolicy` («تنظیم دسترسی/محدودیت/قیمت برای یک قابلیت») نزدیکترین چیز است. هیچ builder جریان/فرم ندارد. | `admin-new/src/features/features/actions.ts` |

**نتیجه:** کدبیس در میانهی راه است — سمت «تعریف و ویرایش» (control) تقریباً کامل است؛ سمت «مصرف در runtime» (data plane) خالی است.

---

## ۴. اینوینتوری رفتارهای سختکد — بکاند کاربر (`apps/api-server`)

مسیر پایه: `/home/danial/diminish all project/diminish-studio/apps/api-server`

### ۴.۱ جدول کامل (موردهای A)

| # | رفتار | چه چیزی از داشبورد کنترل میشود | مقدار فعلی | محل | اولویت |
|---|---|---|---|---|---|
| 1 | **سهمیه ذخیرهسازی پیشفرض هر کاربر** | عدد (گیگابایت) | `1_073_741_824` (۱GB) | `src/routes/uploads/uploads.constants.ts:12` + `packages/db/src/schema/users.ts:19` | ⭐⭐⭐ |
| 2 | **حداکثر حجم فایل آپلود** | عدد (بایت) | `104_857_600` (۱۰۰MB) | `uploads.constants.ts:11` + `uploads.schema.ts:6,13` | ⭐⭐⭐ |
| 3 | **حداکثر مدت فایل صوتی** | عدد (ثانیه) | `600` (۱۰ دقیقه) | `uploads.constants.ts:13` + `uploads.schema.ts:8,16` | ⭐⭐ |
| 4 | **انواع MIME مجاز** | لیست رشتهها | ۵ نوع | `uploads.constants.ts:3-9` (با `MIME_TO_EXT`) | ⭐⭐ |
| 5 | **انقضای URL پیشامضاشده (presign)** | عدد (ثانیه) | `900` (۱۵ دقیقه) | `uploads.constants.ts:14` (+ یک کپی hardcode در `uploads.service.ts:109-111` — ریسک drift) | ⭐⭐ |
| 6 | **سقف نرخ آپلود (rate limit)** | عدد (تعداد/پنجره) | `10` در `60_000ms`، **در-حافظهی per-process** | `uploads.service.ts:29-44` | ⭐⭐ |
| 7 | **فعال بودن تحلیل (RunPod)** | toggle بولی | فقط بررسی `backendConfig.runPod` | `analyze.ts:83-90` + `config.ts:122-128` | ⭐⭐⭐ |
| 8 | **timeout فراخوانی RunPod** | عدد (میلیثانیه) | `300_000` (۵ دقیقه) | `analyze.ts:113` | ⭐⭐ |
| 9 | **انقضای URL امضاشدهی تحلیل** | عدد (ثانیه) | `3600` | `analyze.ts:99` | ⭐ |
| 10 | **انقضای URL امضاشدهی master track** | عدد (ثانیه) | `900` | `song-details.ts:155` | ⭐ |
| 11 | **تعداد آهنگهای ویژه (featured)** | عدد | `.limit(8)` | `songs.ts:80` | ⭐⭐ |
| 12 | **قانون مهارت آکورد** | دو عدد (آستانه تلاش + نرخ موفقیت) | `attempts >= 5` و `success >= 80%` | `learning.ts:69` | ⭐⭐ |
| 13 | **بازهی retry احراز هویت Clerk** | عدد (ثانیه) — **تکراری در دو فایل** | `60` | `users.ts:37` + `library.ts:87` | ⭐ |
| 14 | **نسخهی برچسب تحلیل (analysis version)** | رشته | `"1"` | `analyze.ts:228,236` | ⭐ |
| 15 | **اتصال مسیرهای learning/chords به کاربر آزمایشی** | toggle بولی (غیرفعالکردن دموی بدون auth) | `DEMO_USER_ID = 1` و **بدون هیچ بررسی Clerk** | `chords.ts:9` + `learning.ts:9` | ⭐⭐ |
| 16 | **پارامترهای اتصال SQL (pool)** | عدد (connect/idle/max) | `15_000` / `30_000` / max ۵ dev-۱۰ prod | `packages/db/src/index.ts:15-19` | ⭐ |

### ۴.۲ انتقالهای وضعیت (State Transitions) — امروز inline هستند

- **تحلیل:** `analysis_status` → `processing` (upsert) → `completed` با `analysisVersion:"1"` یا `error` (۴ مسیر error). همه UPDATE درون handler؛ **بدون صف/پسزمینه** — درخواست HTTP تا ۵ دقیقه باز میماند. `analyze.ts:103-259` + پیشفرض `pending` در `packages/db/src/schema/song-analyses.ts:17`.
- **آپلود:** `songs.status`: `pending` در insert → `uploaded` بعد از کپی S3. `uploads.service.ts:185-210`.
- **انتشار/عدم انتشار:** **هیچ endpoint ای وجود ندارد.** فیلتر `status="published"` در `songs.ts:35` هست، ولی هیچجای api-server `published` را ست نمیکند — انتشار امروز فقط از طریق دستی/Admin-دیتابیس ممکن است. **شکاف واقعی.**
- **سشن یادگیری:** شمارندهها و `mastered` درون handler محاسبه میشوند. `learning.ts:66-75`.

### ۴.۳ درزهای اعمال سیاست (Enforcement Seams) — جایی که درگاه آینده وصل میشود

- تنها «دروازه» واقعی: **دروازه سهمیه ذخیرهسازی** — دو لایه: بررسی دوستانه در app (`uploads.service.ts:81-93`) + بررسی atomic در SQL (`uploads.repository.ts:56-63`). این بهترین الگوی قالب برای درگاه اعمال قوانین آینده است.
- `src/middlewares/` خالی است (فقط `.gitkeep`). زنجیره میدلور فقط: `pinoHttp → cors → json → urlencoded → clerkMiddleware` (`app.ts:12-35`).
- **هیچ error-handler سراسری، هیچ async wrapper، هیچ authz متمرکز وجود ندارد** — هر route `getAuth(req)` را جداگانه انجام میدهد (`lib/user-utils.ts:46-97`).
- `lib/http-errors.ts` — envelope استاندارد `{ error, code, details? }` (قابل پردازش ماشینی) و مناسب برای یک پنل که روی کدهای پایدار عمل کند. تنها مجموعه کد متمرکز: `UploadErrorCode`؛ بقیه route ها کد رشتهی inline دارند.

### ۴.۴ موارد (C) — ناایمن برای پیکربندی (باید در کد بمانند)

- اسرار B2 / Clerk / RunPod (`config.ts:111-128`).
- جدول validation magic-bytes (`uploads.constants.ts:25-31`) — اصالت محتوا باید سمت سرور بماند.
- قفل atomic سهمیه (`uploads.repository.ts:56-63`) — *عدد* قابل تنظیم است ولی اعمالش سمت سرور.
- گارد دیتابیس production خارج از production (`config.ts:62-82`).

---

## ۵. اینوینتوری رفتارهای سختکد — فرانت کاربر (`apps/diminish-studio`)

### ۵.۱ جدول کامل (موردهای A)

| # | رفتار | چه چیزی از داشبورد کنترل میشود | محل | اولویت |
|---|---|---|---|---|
| 1 | **حدهای آپلود** (پسوند/۱۰۰MB/۶۰۰s) — **کپی دوم از بکاند** | اعداد + لیست قالبها | `src/process.tsx:56-58` (`ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE`, `MAX_DURATION`) — ریسک drift با `uploads.constants.ts` | ⭐⭐⭐ |
| 2 | **ورود با لینک (URL import)** — «بهزودی» | flag بولی برای نمایش/فعالکردن فرم | `process.tsx:306` (کامنت) + `:601-615` (فرم و دکمهها `disabled`) | ⭐⭐⭐ |
| 3 | **آستانههای هشدار سهمیه** (رنگها ۷۰%/۹۰% و متن «Almost full») | اعداد + متن | `src/components/StorageQuotaBar.tsx:42-48,58-59` | ⭐⭐ |
| 4 | **سهمیه پیشفرض ۱GB** (نمایش) | عدد | از `GET /library/quota` میآید؛ ریشه در `packages/db/.../users.ts:19` | ⭐⭐⭐ |
| 5 | **مجموعه مسیرها + قابلیت دیدهشدن منو** (Music Hub / Library / Learn / Process / Profile) | فعال/غیرفعال ماژولها، برچسبها، ترتیب | `App.tsx:39-83` (Route های استاتیک wouter) + `app-layout.tsx:16-22` (`navItems`) | ⭐⭐ |
| 6 | **دسترسپذیری تحلیل** | toggle سراسری/هرکاربر (امروز سرور با 503 fail میکند) | `player.tsx:335-351` (دکمه) | ⭐⭐ |
| 7 | **سطحهای پیچیدگی آکورد + برچسبها** | کدام سطوح فعال + متن نمایشی | `player.tsx:356` (`["simple","medium","pro"]`) + `player-utils.tsx:52` | ⭐ |
| 8 | **متنهای مارکتینگ صفحه اصلی** (hero، badge «Pro-grade chord analysis»، کارتهای feature) | متن (CMS-like) | `home.tsx:29,31-37,64-65,69-101` | ⭐⭐ |
| 9 | **مسیر پس از ورود** | target ریدایرکت | `login.tsx` و `register.tsx` → `fallbackRedirectUrl="/library"` | ⭐ |
| 10 | **برندینگ اپ** (نام سایدبار/هدر، نسخه فوتر) | رشته نام + رشته نسخه | `app-layout.tsx:44,153,114` («DiminishStudio», «v1.0.0») | ⭐ |
| 11 | **PWA manifest + کش آفلاین** (نام، توضیح، رنگ، `screenshots:[]`، کش `/api` به مدت ۵ دقیقه) | **build-time** — فقط اگر خط rebuild وجود داشته باشد | `vite.config.ts:35-63,66,89-98` | ⭐ |
| 12 | **محدودیتهای موتور پلیر** (گام سرعت 0.3–2.0، نیمپرده −12..12) | اعداد | `player.tsx:243-244` | ⭐ |
| 13 | **متنهای حالت خالی/خطا** («Failed to load songs.», «No songs found…» و…) | رشتهها | `library.tsx:102,182`؛ `music-hub.tsx:128,132`؛ `profile.tsx:61,66`؛ `StorageQuotaBar.tsx:35` | ⭐ |

### ۵.۲ نکات مهم فرانت

- **تقریباً هیچ feature gating ای در UI نیست:** هیچ بررسی پلن/نقش/isOwner در فرانت وجود ندارد؛ مالکیت و وضعیت انتشار **سمت سرور** اعمال میشود (باید بماند). تنها شرطهای شباهت-gate: `enabled: !!selectedChord` در `learn.tsx:14` و دکمه «Analyze» وقتی `!song.beatGrid` در `player.tsx:335` — هر دو داده-محور.
- **کد مردهی جالب:** `useGetFeaturedSongs` (client جنریتشده) و endpoint `GET /songs/featured` وجود دارد ولی فرانت هیچوقت آن را صدا نمیزند (`home.tsx` صفحهی مارکتینگ استاتیک است). یک کنترلپنل میتواند آهنگهای ویژه را واقعاً به خانه ببرد.
- **مسیرها کاملاً استاتیکاند** (wouter، `App.tsx`) — هیچ route manifest دادهمحور نیست؛ قابلیت نمایش/مخفیسازی ماژول per-plan/environment ندارد.
- **کانفیگ runtime ندارد:** تنها knobs فرانت متغیرهای `VITE_*` هستند که **build-time** validation میشوند (`config-schema.ts:4-9`). تغییر runtime نیاز به یک endpoint `GET /config` دارد که اپ در `main.tsx` در startup بخواند.

---

## ۶. آنچه از قبل داده-محور است (قابل تنظیم بدون کد — کلاس B)

اینها امروز از دیتابیس میآیند و بدون تغییر کد قابل تنظیماند (البته فقط با دستکاری مستقیم DB — چون endpoint نوشتن وجود ندارد):

- `songs.status` (منتشر/خصوصی)، `songs.featured`، `songs.playCount`، `songs.difficulty`
- ردیفهای `chords`، `song_analyses.*` (timeline ها)، `users.storage_quota_bytes` / `storage_used_bytes`

> ⚠️ باوجود داده-محور بودن، **هیچ endpoint نوشتن** برای اینها در api-server نیست (بهجز `/uploads/*` و `/users/me`) — یعنی از HTTP قابل تغییر نیستند.

---

## ۷. سمت دریافتکننده: زیرساخت آماده در داشبورد (`apps/admin` + `apps/admin-new`)

### ۷.۱ چه چیزی از قبل قابل مدیریت از UI است (واقعاً رفتار-تغییردهنده، ولی فقط در سطح کاتالوگ)

- **کاتالوگ قابلیت (قلب کنترلپنل):** اکشنهای `createFeature` / `updateFeature` / `addFeatureDependency` / `removeFeatureDependency` / `saveFeaturePlanPolicy` / `archiveFeature` (حذف نرم با `is_active=false`). فیلدهای قابل ست بدون کد: **kind** (`boolean|metered|quota|package`)، **is_active**، **defaultAccess (allow/deny)** (داخل `features.metadata` jsonb)، unit، توضیح، وابستگیهای سخت/نرم، و **overrides per-plan-version** (دسترسی/محدودیت/قیمت/هزینه اعتبار). — `admin-new/src/features/features/actions.ts` + `apps/admin/src/features/features/actions.ts`
- **پلنها (کاتالوگ مونیتایزیشن):** `createPlan` (از صفر یا clone) همهی `plans`, `plan_versions`, `plan_prices`, `plan_credit_policies`, `plan_features`, `plan_limits`, `feature_pricing_rules`, `plan_addons` را در **یک تراکنش** مینویسد. **فعلاً اکشن publish/version وجود ندارد** — فقط creation. — `apps/admin/src/features/plans/actions.ts:147,272-410`
- **ماژول RunPod (کنترل سرویس خارجی):** CRUD کامل (pods، endpoints، network volumes، templates، registry auths، settings)، گزارشهای billing، وضعیت اتصال، لاگ audit لوکال — با یک **ماتریس مجوز** (viewer/billing_viewer/operator/admin/owner × عملیات). — `apps/admin/src/integrations/runpod/`
- **نماهای read-only:** User 360، لیست کاربران، Overview KPIs. **فقط query — هیچ اکشن block/refund/grant/subscription وجود ندارد.**

### ۷.۲ موتور سیاست موجود (پلی به runtime)

یک resolver خالص از قبل نوشته شده که تصمیم allow/deny + limit + هزینه را از روی دادهی کاتالوگ حل میکند:

- `resolveOptionalFeaturePolicy` — اولویت تصمیم: `inactive → deny`، سپس `plan override`، سپس `feature default`، سپس `system-default allow` + محاسبه limit و هزینه واحد. — `admin-new/src/features/features/policy.ts:31-77`
- `getRuntimeFeaturePolicy` — حل بازگشتی وابستگیها با **تشخیص cycle (fail-closed)** + جمعآوری limits/pricing/config برای یک feature کد مشخص روی یک `planVersionId`. — `admin-new/src/features/features/runtime.ts:57-245`
- `quoteRuntimeFeatureUsage` — محاسبه هزینه/مقدار/مجاز بودن یک مصرف. — `runtime.ts:247-270`

> ⚠️ **grep سراسری نشان میدهد اینها هیچجای پروژه جز admin/admin-new استفاده نمیشوند** — یعنی «موتور آماده» فعلاً به برق وصل نیست.

### ۷.۳ مدل دادهی کنترلپلین (۳۸ جدول + ۳۶ pg enum در admin)

دستهبندی مهم: **schema مدیریتی در `apps/admin`/`apps/admin-new` است، نه در `packages/db`.** `packages/db` فقط schema کاربر (songs, artists, analyses, learning, users) دارد.

| گروه | جدولها | نکته |
|---|---|---|
| کاتالوگ | `features`, `feature_dependencies` | `code` یکتا و پایدار |
| کاتالوگ پلن | `plans`, `plan_versions` (draft/published/retired), `plan_prices`, `plan_features`, `plan_limits`, `feature_pricing_rules`, `plan_credit_policies`, `plan_change_rules` | نسخهدار + CHECK constraint ها |
| افزونه/کوپن | `addons`, `plan_addons`, `addon_prices`, `addon_features`, `coupons` | |
| بیلینگ | `subscriptions`, `subscription_periods/schedules/addons/discounts/events`, `trials`, `transactions`, `invoices`, `invoice_items`, `payment_methods`, `tax_rates`, `coupon_redemptions`, `usage_daily_aggregates` | `subscription_events` = audit |
| اعتبار | `credit_accounts`, `credit_ledger` (immutable), `credit_grants`, `credit_reservations`, `credit_expirations`, `credit_packages`, `credit_package_prices`, `usage_events` | ledger با توازنهای CHECK |
| مشترک | `users` (پل به data plane) | ⚠️ **drift:** `storage_quota_bytes` پیشفرض 200MiB در admin در برابر 1GiB در `packages/db` |
| لاگ | `runpod_audit_log` (SQLite) | |

enum های کلیدی: `feature_kind`، `plan_version_status`، `limit_period`/`limit_behavior`، `feature_price_metric`/`model`، `credit_policy_reset`، `subscription_status`، `ledger_entry_type`، `usage_status` و… (فایل: `apps/admin/src/db/schema/enums.ts`).

> **توجه:** دادهی seed موجود نیست — snapshot واقعی (FND-001) نشان داد: `features=0`، `plan_limits=0`، `subscriptions=0`، `credit_accounts=0`، `usage_events=0` و فقط یک پلن draft (`gpcaht`). migrations مدیریتی هنوز روی دیتابیس مشترک اعمال نشدهاند.

### ۷.۴ زیرساخت قابل استفاده مجدد

- الگوی per-domain `{queries.ts | actions.ts | types.ts}` با triad لیست/جزئیات/ساخت + pagination سرور-محور — در هر دو ادمین.
- اکشن عمومی `saveFeaturePlanPolicy` = یک «ویرایشگر سیاست آماده» برای هر قابلیت روی هر نسخه پلن.
- ابزارهای governance خالص: `dependency-cycle-detector.ts`، `plan-version-governance.ts` (آمادگی انتشار + diff نسخه)، `entitlement-engine/index.ts`، `users/intelligence/`.
- UI جدید (admin-new): Appica UI + TanStack Data Table، دیالوگ ساخت/ویرایش قابلیت با AlertDialog تأیید.
- ماتریس مجوز RunPod (تنها کد authorization واقعی). ⚠️ Clerk در admin نصب ولی **استفاده نشده**؛ `identity-adapter` فعلاً به همه `owner` میدهد.

---

## ۸. تحلیل شکاف (Gap Analysis) — چه چیزهایی برای اتصال واقعی کم است

| # | شکاف | وضعیت |
|---|---|---|
| 1 | **هیچ جدول settings/feature-flags در `packages/db` نیست**؛ `backendConfig` فقط-env و immutable در boot است | 🔴 |
| 2 | **هیچ Integration API v1 + service identity** (ADR 0009 / ADM-101) ساخته نشده؛ قرارداد نسخهدار HTTP برای runtime وجود ندارد | 🔴 |
| 3 | **هیچ policy sync / published-snapshot / preview / rollback / maintenance pause** (ADR 0012/0008 / ADM-102) — draft و published هیچجای پروژه جدا نیستند | 🔴 |
| 4 | **موتور سیاست در runtime مصرف نمیشود** — `features.is_active`/limits امروز هیچ رفتاری را تغییر نمیدهند | 🔴 مرکزی |
| 5 | **هیچ endpoint نوشتن** برای publish / featured / quota در api-server نیست | 🟠 |
| 6 | **هیچ لایه authz ادمین در api-server** نیست (فقط Clerk؛ بدون نقش/allowlist) | 🟠 |
| 7 | **هیچ audit عمومی** برای تغییر config/state نیست | 🟠 |
| 8 | **کپی مضاعف حدها در کلاینت/سرور** (`process.tsx` vs `uploads.constants.ts`) — ریسک drift | 🟠 |
| 9 | **تحلیل synchronous و بدون صف** — درخواست ۵ دقیقهای باز؛ پایهی شکننده برای یک flow که پنل بخواهد کنترل/مشاهده کند | 🟠 |
| 10 | **بدون CI برای گارد codegen/typecheck/build** — `api:check` فقط local است | 🟡 |
| 11 | **بدون seed data** و migrations مدیریتی اعمالنشده | 🟡 |
| 12 | **drift سهمیه پیشفرض** بین admin (200MiB) و packages/db (1GiB) | 🟡 |

---

## ۹. پیشنهاد معماری اتصال (برای ساخت Control Panel)

### ۹.۱ اصل معماری: «دو لایه»

```
┌─────────────────────────────────────────────────────────────┐
│  داشبورد مدیریتی (Control Plane)                              │
│  admin-new: کاتالوگ قابلیت / پلن / محدودیت / قیمت / اعتبار      │
│  + Integration API v1 (در آینده طبق ADR 0009)                 │
└───────────────▲─────────────────────────────────────────────┘
                │  فقط از طریق قرارداد نسخهدار (هویت سرویس کوتاهعمر)
                │  — دسترسی مستقیم runtime به جدولهای مدیریتی ممنوع
┌───────────────┴─────────────────────────────────────────────┐
│  نسخه کاربر (Data Plane)                                     │
│  api-server: درگاه اعمال قوانین (Policy Gateway)              │
│    └─ feature code → تصمیم allow/deny/limit/price            │
│  فرانت: GET /config/bootstrap در startup                     │
└─────────────────────────────────────────────────────────────┘
```

دو لایه با هم ترکیب میشوند:

**لایه ۱ — Config/Feature ساده (ارزش فوری، هزینه کم):**
- جدول `app_settings` در `packages/db`: `(key, value jsonb, version, updated_at, changed_by)`.
- Endpoint عمومی `GET /config/bootstrap` در api-server که حدها، آستانهها، feature flags و متنها را برمیگرداند.
- فرانت این را در `main.tsx` میخواند و بهجای ثابتهای hardcode استفاده میکند (رفع drift کلاینت/سرور).
- داشبورد: اکشنهای CRUD روی settings + نسخهبندی + audit.

**لایه ۲ — کنترل واقعی رفتار از کاتالوگ (درست، طبق ADR):**
- امتداد الگوی موجود: هر رفتار سختکد یک **feature code** میگیرد (جدول نگاشت ۹.۳).
- api-server از طریق **درگاه اعمال قوانین** (یک تابع/میدلور در نقاط اعمال موجود — مثل دروازه سهمیه در `uploads.repository.ts`) کد قابلیت را میپرسد و جواب allow/deny/limit/price میگیرد.
- منبع تصمیم میتواند: (الف) کش/استور محلی از Integration API، یا (ب) در گام اول، خواندن یک snapshot همگامشده (مطابق مدل ADR «نسخه منتشرشده»). هرگز دسترسی مستقیم به جداول مدیریتی.

### ۹.۲ اصول اتصال (برگرفته از ADRها)

1. **runtime فقط «نسخه منتشرشده» قوانین را میخواند** — draft روی رفتار اثر نمیگذارد (ADR 0008، 0012).
2. **انتشار + همگامسازی دستی + پیشنمایش + بازگردانی** — atomic، با نمایش اثر (ADM-102).
3. **کد پایدار قابلیت تغییر نمیکند** — فقط archive (ADR 0020).
4. **هویت سرویس کوتاهعمر** برای ارتباط سرور-به-سرور؛ بدون API key دائمی (ADR 0009).
5. **موارد (C) در کد میمانند** — اسرار، magic-bytes، قفل atomic، گارد production. فقط مقدار قابل تنظیم است.

### ۹.۳ جدول نگاشت پیشنهادی: رفتار سختکد → feature code در کاتالوگ

| رفتار (A) | نوع قابلیت پیشنهادی | کد پیشنهادی |
|---|---|---|
| فعال بودن تحلیل | boolean | `analyze.enabled` |
| timeout تحلیل | setting (KV) | `analyze.timeout_ms` |
| انقضای URL تحلیل | setting (KV) | `analyze.signed_url_expiry_s` |
| نسخهی تحلیل | setting (KV) | `analyze.version` |
| حداکثر حجم آپلود | quota per-plan | `upload.max_file_size_bytes` |
| حداکثر مدت آپلود | quota per-plan | `upload.max_duration_s` |
| انواع MIME مجاز | setting (KV, list) | `upload.allowed_mime_types` |
| انقضای presign | setting (KV) | `upload.presign_expiry_s` |
| rate limit آپلود | setting (KV) | `upload.rate_limit` |
| سهمیه پیشفرض ذخیرهسازی | quota per-plan (default) | `storage.quota_default_bytes` |
| انقضای URL master | setting (KV) | `player.master_url_expiry_s` |
| تعداد آهنگهای ویژه | setting (KV) | `songs.featured_count` |
| قانون مهارت آکورد | setting (KV) | `learning.mastery_min_attempts` + `learning.mastery_success_rate` |
| retry Clerk | setting (KV) | `auth.retry_after_seconds` |
| دموی learning/chords | boolean | `learning.demo_enabled` |
| ورود با لینک (فرانت) | boolean | `import_url.enabled` |
| آستانههای هشدار سهمیه | setting (KV) | `ui.storage_warning_thresholds` |
| سطحهای پیچیدگی آکورد | setting (KV) | `ui.chord_levels` |
| مسیر پس از ورود | setting (KV) | `ui.post_login_redirect` |
| متنهای مارکتینگ | setting (KV, CMS-lite) | `home.*` / `branding.*` |
| انتشار/ویژهسازی آهنگها | داده-محور + endpoint نوشتن | `songs.published` / `songs.featured` |

> نکته: مواردی که «عدد/آستانه»اند → تنظیم KV ساده. مواردی که «مجوز مصرف/حد»اند → مدل `plan_limits`/`feature_pricing_rules` (برای اینکه per-plan و per-user شوند). موارد بولی → `features.is_active` + `defaultAccess`.

### ۹.۴ اولویتهای امنیتی در اتصال

- endpoint های کنترلپنل نیاز به **درگاه هویت ادمین** دارند (Clerk + allowlist/نقش) — امروز این لایه وجود ندارد و هر تغییری از admin باید audit شود.
- تغییر config باید **نسخهدار + قابل بازگشت** باشد.
- جدا کردن «داده نمایشی cache» از «قوانین اجرایی» (طبق CONTEXT: cache فقط snapshot همگامشده را میخواند).

---

## ۱۰. نقشه راه پیشنهادی پیادهسازی

> مراحل با اولویت «ارزش ÷ هزینه» مرتب شدهاند. هر قدم که `apps/admin` یا `apps/admin-new` را تغییر دهد طبق guardrail نیازمند تأیید صریح مالک محصول است.

- **فاز ۰ — Bootstrap Config (فوری):** جدول `app_settings` + `GET /config/bootstrap` + فرانت در `main.tsx` حدهای آپلود و آستانههای سهمیه را بخواند. رفع drift کلاینت/سرور. (بدون تغییر admin)
- **فاز ۱ — صفحه Settings در داشبورد:** CRUD تنظیمات + نسخهبندی + audit در admin-new. شروع با مواردی که امروز فقط عدد/متناند (max_file_size، timeout، متنها، featured_count).
- **فاز ۲ — Runtime Consumer کاتالوگ:** اتصال `getRuntimeFeaturePolicy`-مانند به نقاط اعمال موجود در api-server (اول تحلیل `analyze.enabled`، بعد سهمیه آپلود per-plan). از Integration API سادهشده یا snapshot همگامشده. + درگاه هویت ادمین.
- **فاز ۳ — Endpoint های نوشتن دادهی محصول:** publish/unpublish آهنگ، featured، تنظیم quota کاربر، diff/version پلن. + رفع شکاف «هیچ مسیر نوشتن».
- **فاز ۴ — سختسازی:** seed data، CI برای `api:check`/typecheck/build، audit عمومی، ادغام پنل learning (غیرفعالکردن دمو)، رفع drift سهمیه (admin 200MiB vs db 1GiB).

---

## ۱۱. واژگان تخصصی

| واژه | معنی |
|---|---|
| **Feature Flag / Feature Toggle** | سوئیچ فعال/غیرفعال کردن یک قابلیت در runtime بدون deploy |
| **Kill Switch** | flag اضطراری برای خاموش کردن کامل یک قابلیت پرهزینه/معیوب |
| **Targeting / Segmentation** | اعمال شرطی flag برای گروه/درصد/کاربر خاص (در این پروژه: `defaultAccess` + `plan_override`) |
| **Rollout / Canary** | انتشار تدریجی قابلیت برای درصدی از کاربران |
| **Entitlement** | حق استفادهی یک کاربر از یک قابلیت بر اساس پلن/فعال بودن/وابستگیها |
| **Quota / Limit** | سقف مصرف (مقدار در بازه زمانی)؛ در پروژه: `plan_limits` با `limit_period` و `limit_behavior` (block/allow_overage) |
| **Metered feature** | قابلیت مصرفمحور (بر اساس unit/minute/مگابایت/request) با `feature_pricing_rules` |
| **Plan Version** | snapshot منتشرشدهی تنظیمات یک پلن (`plan_version_status`: draft/published/retired) |
| **Policy-as-Data** | قوانین بهصورت دادهی ذخیرهشده (نه کد) که runtime آن را ارزیابی میکند؛ در پروژه: `resolveOptionalFeaturePolicy` |
| **Control Plane / Data Plane** | لایهی تصمیم/پیکربندی جدا از لایهی اجرا؛ ادمین=control، runtime کاربر=data |
| **Policy Gateway (درگاه اعمال قوانین)** | نقطهی استاندارد در runtime که همهی درخواستهای محدود/هزینهدار از آن عبور میکنند (در پروژه: الگوی دروازه سهمیه در `uploads.repository.ts`) |
| **Draft / Published** | پیشنویس در حال ویرایش در برابر نسخهی منتشرشدهی قابلفعالسازی (این پروژه هنوز جداسازیاش را اعمال نکرده) |
| **Idempotency** | امکان replay امن یک عملیات بدون اثر دوباره (در پروژه: `uploadToken` دو مرحلهای؛ `usage_events.idempotency_key`) |
| **Reservation / Capture** | نگهداری موقت اعتبار قبل از اجرا و قطعیسازی بعد از نتیجه (جداول `credit_reservations` آمادهاند؛ موتور ساخته نشده) |
| **Stable Code** | شناسهی فنی تغییرناپذیر (`features.code`، `plan.code`) که هرگز تغییر نمیکند — فقط archive |
| **Magic Bytes** | بررسی هویت واقعی فایل سمت سرور (در پروژه: `MAGIC_BYTES_MAP`) — غیرقابل پیکربندی |

---

## ۱۲. فایلهای کلیدی برای ادامه کار

| لایه | فایل |
|---|---|
| کانفیگ بکاند (فقط-env) | `apps/api-server/src/config.ts` |
| حدهای آپلود | `apps/api-server/src/routes/uploads/uploads.constants.ts` + `uploads.schema.ts` |
| دروازه سهمیه (الگو) | `apps/api-server/src/routes/uploads/uploads.repository.ts` + `uploads.service.ts` |
| تحلیل (timeout/toggle/نسخه) | `apps/api-server/src/routes/analyze.ts` |
| قانون مهارت | `apps/api-server/src/routes/learning.ts` |
| envelope خطا | `apps/api-server/src/lib/http-errors.ts` |
| حدهای فرانت | `apps/diminish-studio/src/process.tsx` |
| مسیرهای فرانت (استاتیک) | `apps/diminish-studio/src/App.tsx` + `app-layout.tsx` |
| کاتالوگ قابلیت (data) | `apps/admin-new/src/db/schema/catalog/{features,plans,rules}.ts` |
| موتور سیاست (آماده ولی بیکار) | `apps/admin-new/src/features/features/{policy,runtime}.ts` |
| اکشنهای مدیریتی | `apps/admin-new/src/features/features/actions.ts` |
| قرارداد HTTP | `packages/api-spec/openapi.yaml` (+ orval → client/zod، گارد `api:check`) |
| دیتابیس کاربر | `packages/db/src/schema/` |
| مرجع معماری اتصال | `docs/adr/0009-*.md` + `docs/admin-user-integration/roadmaps/02-ENTITLEMENTS-AND-USAGE.md` |
