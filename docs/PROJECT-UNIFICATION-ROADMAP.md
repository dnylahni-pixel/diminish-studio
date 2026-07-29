# Roadmap یکدست‌سازی Diminish Studio

> Branch اجرایی: `unified-local-development`
>
> تاریخ snapshot: `2026-07-29`
>
> وضعیت: فعال
>
> اولویت: یک مسیر روشن برای توسعه، API، دیتابیس و deployment

## 1. مسئله دقیق چیست؟

پروژه خراب یا نیازمند بازنویسی کامل نیست. ساختار اولیه Replit قابل استفاده است، اما مسیر استاندارد آن نیمه‌کاره رها شده و قابلیت‌های جدید از مسیرهای موازی اضافه شده‌اند.

در نتیجه، اکنون چند منبع حقیقت هم‌زمان وجود دارد:

1. routeهای واقعی Express در `artifacts/api-server`
2. قرارداد OpenAPI در `lib/api-spec`
3. client جنریت‌شده React Query در `lib/api-client-react`
4. validation/typeهای جنریت‌شده در `lib/api-zod`
5. درخواست‌های مستقیم `customFetch` در بعضی pageها
6. URL پیش‌فرض hard-coded مربوط به Render در client
7. تنظیمات dashboardهای Vercel و Render که داخل repository ثبت نشده‌اند
8. schema فایل‌های Drizzle، migrationهای SQL و migration خودکار قدیمی startup

هیچ‌کدام به‌تنهایی اشتباه نیستند؛ مشکل این است که رابطه و ترتیب تغییر آن‌ها مشخص نبوده است.

## 2. هدف نهایی

### تجربه توسعه

- توسعه‌دهنده فقط `pnpm dev` اجرا کند.
- Frontend روی `http://localhost:5173` بالا بیاید.
- Backend روی `http://localhost:3000` بالا بیاید.
- تغییر Frontend فوراً با HMR دیده شود.
- تغییر Backend بدون build دستی restart شود.
- Frontend لوکال فقط Backend لوکال را صدا بزند، نه Render.
- secretها فقط در `.env.local` باشند و هرگز commit نشوند.

### معماری API

- OpenAPI منبع حقیقت قرارداد HTTP باشد.
- Orval از OpenAPI، client React Query و Zod contract تولید کند.
- Frontend endpointها را از client جنریت‌شده مصرف کند.
- `customFetch` فقط Adapter مشترک transport، auth و error parsing باشد.
- route جدید بدون OpenAPI و code generation کامل تلقی نشود.

### دیتابیس

- برنامه read/write باشد؛ read-only بودن برای runtime مناسب نیست.
- تغییر schema فقط با migration صریح انجام شود.
- اجرای عادی برنامه migration خودکار نزند.
- migration قبل از اجرا قابل review و rollback/recovery باشد.
- local، preview و production مقصد مشخص داشته باشند.

### Deployment

- Vercel فقط Frontend را build و deploy کند.
- Render فقط Backend را build و deploy کند.
- هر دو از همین repository استفاده کنند.
- dashboardها حداقل تنظیم داشته باشند و تنظیم اصلی داخل repository ثبت شود.
- push به branch انتخاب‌شده بتواند auto-deploy را فعال کند.

## 3. تصمیم معماری نهایی

### Monorepo حفظ می‌شود

```text
artifacts/diminish-studio   Web application: React + Vite
artifacts/api-server        HTTP API: Express
lib/api-spec                قرارداد HTTP و منبع code generation
lib/api-client-react        client و hookهای Frontend
lib/api-zod                 schema و typeهای قرارداد Backend
lib/db                      schema، migration و DB access
scripts                     فرمان‌های development و automation
docs                        معماری، عملیات و تصمیم‌ها
```

Frontend و Backend به دو repository جدا تقسیم نمی‌شوند و در یک deploy هم ادغام نمی‌شوند. monorepo برای shared contract و تغییر atomic مناسب‌تر است؛ Vercel و Render می‌توانند از یک repository بخش متفاوتی را build کنند.

### جریان استاندارد یک endpoint

```text
OpenAPI contract
      ↓
Orval generation
      ↓
React Query client + Zod contract
      ↓
Express implementation
      ↓
Frontend consumption
      ↓
contract/integration tests
```

برای routeهای موجود که ابتدا implementation شده‌اند، migration معکوس انجام می‌شود:

```text
Existing runtime behavior
      ↓
تثبیت semantics و امنیت
      ↓
ثبت در OpenAPI
      ↓
regenerate
      ↓
جایگزینی درخواست مستقیم Frontend
```

### نقش `customFetch`

`customFetch` حذف نمی‌شود. این Module باید فقط این مسئولیت‌ها را پنهان کند:

- افزودن base URL
- افزودن Clerk token
- headerهای مشترک
- parse کردن JSON/text/blob
- تبدیل HTTP failure به error استاندارد

pageها نباید مستقیماً endpoint جدید را با `customFetch` تعریف کنند. endpoint باید از OpenAPI جنریت شود و کد جنریت‌شده در داخل از `customFetch` استفاده کند.

## 4. Snapshot واقعی وضعیت فعلی

### اندازه تقریبی

| ناحیه | تعداد فایل فعلی |
|---|---:|
| Frontend source | 90 |
| Backend source | 21 |
| DB package | 21 |
| API spec/client/Zod | 42 |

### Build و typecheck

| بررسی | وضعیت |
|---|---|
| Frontend typecheck | موفق |
| Frontend production build | موفق |
| Backend esbuild bundle | موفق |
| Backend typecheck | ناموفق در دو route |
| تست خودکار | وجود ندارد |
| CI build/test | وجود ندارد |

خطاهای typecheck موجود:

- `artifacts/api-server/src/routes/chords.ts`
- `artifacts/api-server/src/routes/songs.ts`
- علت: تمام code pathها مقدار برنمی‌گردانند.

### توسعه لوکال

انجام شده:

- `pnpm dev`
- `pnpm dev:web`
- `pnpm dev:api`
- Vite HMR
- Backend watch/restart
- env مرکزی `.env.local`
- Frontend محلی به `http://localhost:3000`
- migration خودکار startup خاموش
- تنظیم Pool برای اتصال پایدارتر Neon

Smoke test ثبت‌شده:

- Frontend: HTTP 200
- Backend health: HTTP 200
- DB-backed songs request: HTTP 200
- Clerk-authenticated library/quota در تست دستی: HTTP 200/304
- تغییر Backend باعث restart خودکار شده است.

### Drift میان runtime و OpenAPI

routeهای runtime که در OpenAPI نیستند:

- `POST /songs/{id}/analyze`
- `GET /song-details/{id}`
- `POST /uploads/presign`
- `POST /uploads/confirm`
- `DELETE /uploads/{uploadToken}/{ext}`

اختلاف معنایی:

- OpenAPI: `DELETE /library/{songId}`
- runtime: `DELETE /library/:id`
- runtime فعلی حذف کامل song و objectهای آن را انجام می‌دهد، نه صرفاً detach از library.

endpointهای مشکوک یا قدیمی:

- OpenAPI دارای register/login است.
- runtime register/login با معماری فعلی Clerk هم‌راستا نیست و باید حذف یا صریحاً به behavior درست تبدیل شود.
- processing jobهای قدیمی `/songs/process*` باید با Analyze واقعی مقایسه شوند.

### مصرف Frontend

مسیر استاندارد جنریت‌شده در این بخش‌ها استفاده می‌شود:

- Music Hub
- Profile
- Library
- Storage Quota
- Chords/Learn

مسیر مستقیم موقت در این بخش‌ها استفاده می‌شود:

- Player → Song Details و Analyze
- Process → Upload presign/confirm/cancel

`AudioEngine` برای خواندن URL فایل صوتی از `fetch` مستقیم استفاده می‌کند؛ این مورد API business نیست و الزاماً نیاز به generated client ندارد.

### امنیت و behavior بحرانی

- Analyze هنوز perimeter کامل auth/ownership/usage ندارد.
- Learning و بخشی از Chords هنوز `DEMO_USER_ID = 1` دارند.
- B2 و RunPod Adapter تستی ندارند.
- CORS allowlist مشخص ندارد.
- اجرای external paid operation guard کامل ندارد.

این موارد در Roadmap اصلی Admin/User نیز ثبت شده‌اند و یکدست‌سازی نباید امنیت را به تعویق بیندازد.

## 5. اجرای لوکال

### فرمان روزمره

```bash
pnpm dev
```

آدرس‌ها:

```text
Frontend  http://localhost:5173
Backend   http://localhost:3000
Health    http://localhost:3000/api/healthz
Readiness http://localhost:3000/api/readyz
```

### در لوکال چه چیزی استفاده می‌شود؟

```text
Browser
  → Frontend local :5173
  → Backend local :3000
  → Neon از DATABASE_URL محلی
  → Clerk development keys
  → Backblaze bucket/key تعریف‌شده در env
  → RunPod فقط هنگام اجرای Analyze
```

در اجرای لوکال:

- Vercel استفاده نمی‌شود.
- Render استفاده نمی‌شود.
- push یا build ابری لازم نیست.
- تغییر کد روی سرویس production اثر ندارد.
- تنها سرویس‌های خارجی تعریف‌شده در `.env.local` قابل استفاده‌اند.

### فایل env

فایل واقعی:

```text
.env.local
```

قواعد:

- gitignored
- permission برابر `600`
- هرگز در commit، screenshot یا chat عمومی قرار نگیرد.
- `.env.example` فقط نام متغیر و مقدار جعلی دارد.

## 6. سیاست دیتابیس و migration

### read/write یا read-only؟

runtime برنامه باید read/write باشد، چون این عملیات‌ها write می‌کنند:

- ساخت/به‌روزرسانی user
- upload و confirm
- library mutation
- learning session و attempts
- analysis status/result
- quota counters

read-only فقط برای audit و بررسی ایمن metadata استفاده می‌شود.

### وضعیت connection فعلی لوکال

connection فعلی:

- Neon است.
- role آن read/write و دارای privilege گسترده است.
- جدول‌های User و جداول Admin را دارد.
- aggregate آن با snapshot shared قبلی هم‌خوان است.
- بنابراین باید فعلاً shared و حساس فرض شود، حتی اگر URL آن با Render متفاوت باشد.

این تفاوت URL لزوماً یعنی دیتابیس متفاوت نیست؛ Neon می‌تواند برای یک database، endpoint مستقیم، pooled endpoint، branch یا role متفاوت ارائه کند. برای اثبات یکسان یا متفاوت بودن باید identity هش‌شده Render و local مقایسه شود؛ مقدار secret نباید نمایش داده شود.

### سیاست فعلی ایمنی

- `RUN_MIGRATIONS=false`
- `pnpm dev` هیچ DDL اجرا نمی‌کند.
- application همچنان read/write data دارد.
- migration فقط با فرمان مستقل اجرا می‌شود.

این یعنی برنامه عادی کار می‌کند، اما start شدن آن table یا column را خودکار تغییر نمی‌دهد.

### مدل هدف migration

```text
schema change
  → migration file
  → review SQL
  → isolated/dev execution
  → application tests
  → backup/recovery note
  → production approval
  → production migration
  → application deploy
```

### موارد ممنوع

- `drizzle-kit push --force` روی production
- migration در startup هر replica
- استفاده از production DB در Preview Vercel/Render
- schema edit مستقیم در Neon console بدون migration file
- پاک‌کردن یا تغییر data production برای تست

### workflow فعلی خطرناک

`.github/workflows/drizzle-push.yml` اکنون:

- manual است، که خوب است.
- از `--force` استفاده می‌کند، که باید حذف شود.
- dependency را هنگام workflow دوباره add می‌کند، که reproducible نیست.
- environment classification و backup gate ندارد.

این workflow تا بازطراحی نباید برای production اجرا شود.

## 7. Deployment: Vercel و Render چگونه کار می‌کنند؟

هر دو سرویس همان GitHub repository را clone می‌کنند، اما فرمان build متفاوت دارند.

```text
GitHub push
   ├─ Vercel → فقط Frontend را build می‌کند
   └─ Render → فقط Backend را build می‌کند
```

### آیا فقط push کافی است؟

بله، اگر یک بار Dashboard درست تنظیم شود و Auto Deploy روشن باشد:

1. تغییرات را لوکال با `pnpm dev` تست می‌کنیم.
2. commit می‌کنیم.
3. branch موردنظر را push می‌کنیم.
4. Vercel و Render commit جدید را تشخیص می‌دهند.
5. هرکدام فرمان build خود را اجرا می‌کنند.

تا قبل از ثبت config قطعی، نباید فرض کرد dashboard فعلی دقیقاً تنظیم زیر را دارد.

## 8. تنظیم قطعی Vercel

### مسئولیت

فقط build و میزبانی Frontend static.

### تنظیم پیشنهادی Dashboard

| Setting | Value |
|---|---|
| Repository | همین repository |
| Production Branch | branch انتشار، بعداً `main` |
| Root Directory | repository root |
| Framework Preset | Vite یا Other |
| Install Command | `corepack enable && pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @workspace/diminish-studio build` |
| Output Directory | `artifacts/diminish-studio/dist/public` |
| Node.js | 22 |
| Auto Deploy | روشن |

### Environment Variables

فقط:

```text
VITE_CLERK_PUBLISHABLE_KEY
VITE_APP_ENVIRONMENT=production
VITE_API_BASE_URL=https://<render-api-domain>
BASE_PATH=/
WEB_PORT=5173
NODE_ENV=production
```

`WEB_PORT` فقط برای سازگاری config build فعلی است و بعداً می‌تواند حذف شود.

### secretهای ممنوع در Vercel

```text
DATABASE_URL
CLERK_SECRET_KEY
B2_KEY_ID
B2_APPLICATION_KEY
RUNPOD_API_KEY
```

متغیرهای `VITE_*` داخل bundle مرورگر قرار می‌گیرند و secret نیستند.

### SPA rewrite

فایل فعلی:

```text
artifacts/diminish-studio/vercel.json
```

فقط rewrite مربوط به SPA دارد. چون Root Directory هدف repository root است، config deployment باید در Phase 5 به root منتقل یا با تنظیم Root Directory هماهنگ شود. این ambiguity باید حذف شود.

### Preview Deployment

هر branch/PR می‌تواند Preview Frontend داشته باشد، اما:

- نباید به production DB وصل شود.
- ترجیحاً به Backend preview یا Backend staging وصل شود.
- تا ساخت staging backend، Preview فقط برای UI غیرمخرب قابل اعتماد است.

## 9. تنظیم قطعی Render

### مسئولیت

فقط build و اجرای Backend API.

### تنظیم پیشنهادی Dashboard

| Setting | Value |
|---|---|
| Service Type | Web Service |
| Repository | همین repository |
| Branch | branch انتشار، بعداً `main` |
| Root Directory | repository root |
| Runtime | Node |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build` |
| Start Command | `pnpm --filter @workspace/api-server start` |
| Health Check Path | `/api/healthz` |
| Auto Deploy | روشن |
| Node.js | 22 |

### Environment Variables

```text
NODE_ENV=production
APP_ENVIRONMENT=production
LOG_LEVEL=info
RUN_MIGRATIONS=false
DATABASE_ENVIRONMENT=production
DATABASE_URL
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
B2_ENDPOINT
B2_REGION
B2_KEY_ID
B2_APPLICATION_KEY
BUCKET_NAME
RUNPOD_ENDPOINT
RUNPOD_API_KEY
```

`PORT` را Render فراهم می‌کند و نباید مقدار ثابت اجباری شود.

### migration و deploy

Render نباید هنگام start migration اجرا کند.

ترتیب release دارای schema change:

1. backup/recovery check
2. اجرای migration job مستقل
3. تأیید موفقیت
4. deploy Backend
5. health و smoke test

در آینده می‌توان Render Pre-Deploy Command یا job مستقل تعریف کرد، اما فقط بعد از ساخت migration runner امن.

## 10. ماتریس محیط‌ها

| محیط | Frontend | Backend | DB | هدف |
|---|---|---|---|---|
| Local | localhost:5173 | localhost:3000 | Neon connection محلی فعلی | توسعه روزمره |
| Vercel Preview | Vercel preview | staging/preview API | dev/staging DB | بررسی PR |
| Render Staging | Vercel preview/staging | Render staging | Neon dev/staging branch | تست integration |
| Production | Vercel production | Render production | Neon production | کاربران واقعی |

در حال حاضر local و production-like resources کاملاً از هم جدا نشده‌اند. جداسازی staging یک مرحله لازم است، اما مانع ادامه یکدست‌سازی کد نیست.

## 11. تصمیم درباره فایل‌ها

### نگه داشته می‌شوند

- `artifacts/diminish-studio`
- `artifacts/api-server`
- `lib/api-spec`
- `lib/api-client-react`
- `lib/api-zod`
- `lib/db`
- `customFetch`
- pnpm workspace

### migrate و یکدست می‌شوند

- درخواست‌های مستقیم Player و Process
- Upload/Analyze/Song Details contract
- register/login contract
- library delete semantics
- env validation
- migration workflow
- Vercel/Render config
- error contract
- auth/current-user resolution

### کاندید حذف پس از اثبات عدم مصرف

- fallback hard-coded آدرس Render در `custom-fetch.ts`
- Replit Cartographer
- Replit Dev Banner
- Replit runtime error overlay، در صورت داشتن جایگزین
- alias قدیمی `attached_assets` در صورت عدم مصرف
- `artifacts/mockup-sandbox` اگر فقط artifact طراحی و بلااستفاده باشد
- endpointهای processing قدیمی اگر Analyze جایگزین قطعی آن‌هاست
- register/login قدیمی بعد از تثبیت Clerk-only flow
- repository helper deprecated در Upload
- workflow خطرناک `drizzle-push --force`

هیچ موردی صرفاً بر اساس نام حذف نمی‌شود؛ ابتدا reference scan، build و behavior test انجام می‌شود.

## 12. فازهای اجرایی

### Phase 0 — Baseline و ایمنی

وضعیت: تقریباً کامل

- [x] branch مستقل `unified-local-development`
- [x] `.env.example`
- [x] `.env.local` gitignored با permission `600`
- [x] snapshot build/typecheck
- [x] inventory runtime/OpenAPI
- [x] خاموش‌کردن migration خودکار
- [x] ثبت Roadmap
- [x] ثبت commit baseline یکدست‌سازی

معیار خروج:

- secret track نشده باشد.
- branch مستقل باشد.
- وضعیت خطاهای قبلی ثبت شده باشد.

### Phase 1 — Local Development یک‌فرمانی

وضعیت: پیاده‌سازی شده، نیازمند commit

- [x] `pnpm dev`
- [x] `pnpm dev:web`
- [x] `pnpm dev:api`
- [x] Frontend HMR
- [x] Backend watch/restart
- [x] env مرکزی root
- [x] base URL لوکال
- [x] DB Pool timeout/keepalive
- [x] smoke test Frontend/health/DB
- [x] پیام shutdown تمیز بدون نمایش failure هنگام Ctrl+C
- [x] افزودن health dependency check جدا از process health

معیار خروج:

- تغییر یک component بدون build در مرورگر دیده شود.
- تغییر یک route باعث restart خودکار شود.
- هیچ درخواست business لوکال به Render نرود.

### Phase 2 — Config Module و Environment Contract

وضعیت: تکمیل شده

- [x] Module مرکزی config با Zod
- [x] envهای Frontend و Backend جدا و typed
- [x] حذف validation پراکنده B2/RunPod/Clerk
- [x] حذف fallback production از client
- [x] افزودن `packageManager` و Node engine
- [x] `.node-version` یا `.nvmrc`
- [x] script برای چاپ وضعیت sanitized محیط

معیار خروج:

- startup با پیام دقیق متغیر مفقود fail شود.
- secret هیچ‌وقت log نشود.
- local/preview/production قابل تشخیص باشند.

### Phase 3 — تثبیت Runtime قبل از Contract

وضعیت: شروع نشده

- [ ] رفع دو خطای Backend typecheck
- [ ] تعیین behavior نهایی Song Details
- [ ] تعیین behavior نهایی Analyze
- [ ] تعیین lifecycle کامل Upload
- [ ] تعیین library detach در برابر destructive delete
- [ ] حذف یا تثبیت `/songs/process*`
- [ ] حذف یا تثبیت register/login
- [ ] error response استاندارد

معیار خروج:

- behavior هر endpoint عمدی، مستند و قابل تست باشد.
- هیچ endpoint مبهمی وارد OpenAPI نشود.

### Phase 4 — OpenAPI به‌عنوان منبع حقیقت

وضعیت: شروع نشده

- [ ] افزودن Analyze
- [ ] افزودن Song Details
- [ ] افزودن Upload presign/confirm/cancel
- [ ] اصلاح Library
- [ ] اصلاح auth/error schemas
- [ ] regenerate React Query client
- [ ] regenerate Zod contract
- [ ] جایگزینی `customFetch` مستقیم در pageها
- [ ] generated-diff check

معیار خروج:

- صفر business endpoint مستقیم در pageها
- صفر route runtime خارج OpenAPI، جز health/internal صریح
- code generation reproducible و بدون diff پس از اجرای دوباره

### Phase 5 — Backend Moduleهای عمیق و تست‌پذیر

وضعیت: شروع نشده

- [ ] App factory جدا از process listen
- [ ] auth/current-user Module
- [ ] Songs Module
- [ ] Library Module
- [ ] Learning Module
- [ ] Upload Module با B2 Adapter
- [ ] Analyze Module با RunPod Adapter
- [ ] DB transaction و operation state مشخص
- [ ] error/logging Module

معیار خروج:

- routeها orchestration کوتاه داشته باشند.
- منطق business پشت Interface محدود متمرکز شود.
- B2 و RunPod حداقل production و fake Adapter داشته باشند.

### Phase 6 — تست و امنیت فوری

وضعیت: شروع نشده

- [ ] test runner
- [ ] API test harness
- [ ] auth و ownership Analyze
- [ ] حذف `DEMO_USER_ID`
- [ ] تست Clerk current-user
- [ ] تست Upload بدون B2 واقعی
- [ ] تست Analyze بدون RunPod واقعی
- [ ] CORS allowlist
- [ ] no-paid-call assertions
- [ ] typecheck کامل سبز

معیار خروج:

- deny path هیچ تماس خارجی نزند.
- تمام routeهای user-scoped ownership تست داشته باشند.
- testها production secret نیاز نداشته باشند.

### Phase 7 — Migration System

وضعیت: شروع نشده

- [ ] تعیین owner واحد schema
- [ ] baseline migration قابل اعتماد
- [ ] migration runner صریح
- [ ] حذف runtime migration قدیمی
- [ ] حذف `push --force`
- [ ] تست fresh DB
- [ ] تست upgrade DB
- [ ] recovery procedure
- [ ] environment approval gate

معیار خروج:

- schema از migration صفر قابل بازسازی باشد.
- اجرای migration دوباره behavior تعریف‌شده داشته باشد.
- production migration بدون approval ممکن نباشد.

### Phase 8 — Deployment as Code

وضعیت: شروع نشده

- [ ] config root برای Vercel
- [ ] `render.yaml` یا سند dashboard قطعی
- [ ] Node/pnpm version pin
- [ ] CI typecheck/test/build
- [ ] OpenAPI drift check
- [ ] Preview environment
- [ ] deployment smoke script
- [ ] rollback checklist

معیار خروج:

- یک developer تازه فقط با خواندن repository بداند هر سرویس چگونه build می‌شود.
- dashboard magic به حداقل برسد.
- push branch مشخص، deployment قابل پیش‌بینی ایجاد کند.

### Phase 9 — پاکسازی Replit و Legacy

وضعیت: شروع نشده

- [ ] بررسی مصرف `mockup-sandbox`
- [ ] بررسی مصرف Replit plugins
- [ ] بررسی `attached_assets`
- [ ] حذف endpointهای superseded
- [ ] حذف generated typeهای بی‌مصرف پس از اصلاح spec
- [ ] dependency cleanup
- [ ] README نهایی

معیار خروج:

- هر package در workspace مالک و هدف روشن داشته باشد.
- هیچ مسیر build یا API موازی بدون دلیل باقی نماند.

## 13. ترتیب commit پیشنهادی

1. `chore: establish safe local environment contract`
2. `dev: run web and api with hot reload`
3. `refactor: centralize runtime configuration`
4. `fix: stabilize current api behavior and types`
5. `api: align openapi with runtime routes`
6. `refactor: move frontend calls to generated client`
7. `test: add api security and adapter harness`
8. `db: replace runtime schema changes with migrations`
9. `deploy: codify vercel render and ci`
10. `chore: remove obsolete replit and legacy paths`

هر commit باید:

- scope محدود داشته باشد.
- secret نداشته باشد.
- build/typecheck/test مرتبط را ثبت کند.
- به‌تنهایی قابل review و rollback باشد.

## 14. برآورد حجم کار

| فاز | فایل‌های تقریبی | سختی |
|---|---:|---|
| Local dev و env | 6 تا 10 | کم تا متوسط |
| Config و runtime stabilization | 8 تا 15 | متوسط |
| OpenAPI/client migration | 12 تا 22 + generated | متوسط |
| Backend modules/tests/security | 18 تا 35 | زیاد |
| Migration system | 8 تا 18 | زیاد و حساس |
| Deployment/CI/cleanup | 8 تا 16 | متوسط |

کل محتمل:

- 40 تا 75 فایل
- حدود 10 commit کوچک
- بدون نیاز به rewrite کامل
- قابل انجام مرحله‌به‌مرحله با تست بعد از هر commit

برآورد زمانی قطعی قبل از ورود به هر فاز داده نمی‌شود، چون migration و امنیت به evidence دیتابیس و behavior واقعی وابسته‌اند. معیار مدیریت کار، commit و acceptance test است نه انتظار build ابری.

## 15. ترتیب اولویت واقعی

1. commit کردن local development فعلی
2. Config Module
3. رفع typecheck و behaviorهای مبهم
4. امنیت Analyze و Learning
5. تکمیل OpenAPI و حذف requestهای موازی
6. test harness
7. migration system
8. deployment as code
9. پاکسازی Replit/legacy
10. ادامه Roadmap بزرگ Admin/User enforcement

یکدست‌سازی پایه باید قبل از توسعه سنگین Roadmap enforcement انجام شود، اما security بحرانی نباید منتظر پایان همه پاکسازی‌ها بماند.

## 16. Definition of Done کل پروژه

پروژه زمانی یکدست محسوب می‌شود که:

- `pnpm dev` تنها فرمان توسعه روزمره باشد.
- `pnpm typecheck`, `pnpm test`, `pnpm build` سبز باشند.
- تمام endpointهای business در OpenAPI باشند.
- Frontend فقط generated client را برای business API مصرف کند.
- routeهای Backend منطق پراکنده DB/provider نداشته باشند.
- migration خودکار startup و `push --force` وجود نداشته باشد.
- Vercel/Render build از repository قابل فهم و reproducible باشد.
- Preview و Production DB به‌وضوح جدا باشند.
- Replit artifacts باقی‌مانده دلیل روشن داشته باشند یا حذف شده باشند.
- هیچ secret یا production fallback در source وجود نداشته باشد.
