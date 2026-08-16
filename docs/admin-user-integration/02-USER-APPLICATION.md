# شناخت کامل User Application

## 1. ساختار و فناوری

User repo یک pnpm workspace با TypeScript است:

| بخش | مسیر | فناوری |
|---|---|---|
| API | `apps/api-server` | Node.js، Express 5، TypeScript، esbuild |
| Frontend | `apps/diminish-studio` | React 19، Vite، Wouter، Zustand، React Query، Clerk |
| UI sandbox | `apps/mockup-sandbox` | Vite و React |
| DB library | `packages/db` | PostgreSQL، `pg`, Drizzle ORM |
| قرارداد API | `packages/api-spec/openapi.yaml` | OpenAPI 3.1 |
| validation client | `packages/api-zod` | Orval-generated Zod |
| React client | `packages/api-client-react` | Orval-generated React Query |

اسکریپت‌های ریشه در `package.json:5` فقط build و typecheck دارند. test runner و lint script موجود نیست.

## 2. API boot و middleware

- entrypoint: `apps/api-server/src/index.ts`
- app: `apps/api-server/src/app.ts:9`
- logging: Pino و `pino-http` در `app.ts:11`
- CORS بدون allowlist در `app.ts:30`
- body parser در `app.ts:31`
- Clerk middleware در `app.ts:34`
- router زیر `/api` در `app.ts:36`
- runtime migration در startup و بدون await برای readiness در `app.ts:38`

وجود `clerkMiddleware()` به‌تنهایی route را محافظت نمی‌کند؛ هر handler باید `getAuth(req)` و authorization مناسب داشته باشد.

## 3. route inventory و مرز دسترسی

| Route | وضعیت auth فعلی | اثر/هزینه | نکته |
|---|---|---|---|
| `GET /api/healthz` | public | کم | health سطح process، نه dependency health |
| `GET /api/songs` | public | DB read | فهرست published |
| `GET /api/songs/featured` | public | DB read | فهرست featured |
| `GET /api/songs/:id` | public | DB read | ownership/status کامل enforce نمی‌شود |
| `GET /api/song-details/:id` | public | DB + signed B2 URL | contract خارج OpenAPI و cost surface |
| `POST /api/songs/:id/analyze` | **بدون auth** | DB + B2 + RunPod paid compute | بحرانی‌ترین مسیر سوءاستفاده |
| `GET/PATCH /api/users/me` | Clerk | DB و Clerk در cold path | user scoped |
| `GET /api/library` | Clerk | DB | user scoped |
| `GET /api/library/quota` | Clerk | DB | counter-based quota |
| `DELETE /api/library/:id` | Clerk + ownership | DB + B2 delete | در عمل حذف کامل song، نه detach ساده library |
| `GET /api/chords*` | public | DB | catalog آموزشی |
| `GET/POST /api/learning/*` | **بدون auth** | DB read/write | `DEMO_USER_ID = 1` در `learning.ts:8` |
| `POST /api/uploads/presign` | Clerk | DB + B2 signed PUT | in-memory rate limit |
| `POST /api/uploads/confirm` | Clerk | DB + چند B2 operation | atomic quota increment، ولی flow transaction کامل ندارد |
| `DELETE /api/uploads/:token/:ext` | Clerk | B2 delete | key با Clerk user id scope می‌شود |

Router wiring در `apps/api-server/src/routes/index.ts:14` قابل مشاهده است.

## 4. Auth و user lifecycle

Backend از `@clerk/express` و Frontend از `@clerk/clerk-react` استفاده می‌کند. Frontend token را از Clerk به custom fetch می‌دهد.

`getOrCreateUser` در `apps/api-server/src/lib/user-utils.ts`:

1. lookup با `clerk_id`؛
2. در نبود row، دریافت profile از Clerk؛
3. insert با `ON CONFLICT (clerk_id) DO NOTHING`؛
4. re-read برنده race.

این مسیر برای ایجاد کاربر race-safe است، اما plan assignment، subscription، credit account و entitlement bootstrap انجام نمی‌دهد.

## 5. DB connection و core schema

Connection در `packages/db/src/index.ts` از `DATABASE_URL` و `pg.Pool` استفاده می‌کند. schema User شامل ۹ جدول است:

| جدول | نقش | روابط مهم |
|---|---|---|
| `users` | هویت داخلی و storage counter | `clerk_id`, `storage_used_bytes`, `storage_quota_bytes` |
| `artists` | هنرمند | مستقل |
| `songs` | فایل و metadata آهنگ | nullable FK به user و artist |
| `song_analyses` | نتایج AI | PK/FK به song با cascade |
| `song_stems` | stem URLها | PK/FK به song با cascade |
| `library` | اتصال user/song | `song_id` در code FK ندارد |
| `chords` | catalog آکورد | مستقل |
| `learning_sessions` | session آموزشی | FK به user |
| `chord_attempts` | تلاش آموزشی | FK به session |

`users` در `packages/db/src/schema/users.ts:5`:

- `id`: serial integer PK
- `clerk_id`: unique و در code `NOT NULL`
- `username`, `email`: unique
- `password_hash`: legacy، با Clerk-managed value
- storage default در code: `1_073_741_824` bytes

## 6. migration و drift

SQL migrationها در `packages/db/drizzle/`:

1. `0000_add_file_columns.sql`
2. `0001_add_user_id_nullable_artist.sql`
3. `0002_add_mime_type.sql`
4. `0003_add_storage_quota.sql`
5. `0004_clerk_id_not_null.sql`

runtime migration در `packages/db/src/migrate.ts` فقط storage columns را با `IF NOT EXISTS` اضافه می‌کند و با migration فایل‌محور overlap دارد.

Metadata امن DB در زمان بررسی نشان داد:

- ۹ جدول User موجودند؛
- همان DB جداول plan/billing/credits Admin را هم دارد؛
- `users.clerk_id` در DB nullable است ولی code آن را NOT NULL می‌داند؛
- default واقعی `storage_quota_bytes` برابر 200 MiB گزارش شد، ولی User schema 1 GiB دارد؛
- migration tracking قابل اتکای واحد میان دو repo مشاهده نشد.

اتصال مستقیم نهایی به Neon بعداً timeout شد؛ بنابراین snapshot DB باید در preflight دوباره و read-only گرفته شود. هیچ DDL نباید از روی این سند اجرا شود.

## 7. upload و storage quota

Upload سه مرحله دارد:

1. Presign در `uploads.service.ts:47`
2. Confirm در `uploads.service.ts:117`
3. Cancel در `uploads.service.ts:240`

کنترل‌های موجود:

- MIME/size/duration با Zod؛
- quarantine key با Clerk user ID و UUID؛
- server-side size check؛
- magic-byte check؛
- atomic conditional increment در `uploads.repository.ts:51`؛
- decrement با `GREATEST(0, ...)` در `uploads.repository.ts:69`؛
- reconcile helper در `uploads.repository.ts:84`.

شکاف‌ها:

- rate limit فقط `Map` حافظه process است؛
- quota از ستون user می‌آید، نه plan version؛
- confirm شامل DB insert، B2 copy، DB finalize و quota update بدون transaction/operation journal واحد است؛
- idempotency key ندارد؛
- crash می‌تواند pending row، orphan object یا counter drift بسازد؛
- cleanup failureها در چند نقطه swallow می‌شوند؛
- reconcile helper scheduler ندارد.

## 8. RunPod analysis

`POST /api/songs/:id/analyze` در `apps/api-server/src/routes/analyze.ts:46`:

1. song را فقط با ID می‌خواند؛
2. signed B2 GET URL یک‌ساعته می‌سازد؛
3. status را `processing` می‌کند؛
4. RunPod را synchronously با timeout پنج دقیقه صدا می‌زند؛
5. beat/chord را upsert می‌کند؛
6. خطا را `error` می‌کند.

کنترل‌های مفقود:

- authentication؛
- ownership؛
- entitlement؛
- usage limit؛
- credit reservation؛
- distributed rate limit؛
- idempotency/dedup؛
- protection برابر concurrent analysis همان song؛
- audit correlation و recovery worker.

## 9. Frontend و API contract

Frontend routeهای اصلی: home، login/register، music hub، library، player، learn، process، profile.

OpenAPI با runtime drift دارد:

- upload routes در spec نیستند؛
- analyze route در spec نیست؛
- song-details route در spec نیست؛
- register/login در spec موفق تعریف شده‌اند ولی runtime به Clerk ارجاع و 400 می‌دهد؛
- `POST /library` در spec هست ولی runtime ندارد؛
- `DELETE /library/:id` semantics runtime حذف کامل song است؛
- `GET /library` shape با `LibraryEntry[]` مستند یکسان نیست.

Roadmap باید contract را بعد از تثبیت behavior امن به‌روز کند، نه قبل از آن.

## 10. تست، CI و عملیات

- test file و test runner وجود ندارد.
- root typecheck و build موجود است.
- GitHub Action فقط manual Drizzle push با `--force` دارد؛ test/typecheck/build اجرا نمی‌کند.
- no rollback migration، no staging evidence، no APM/metrics.
- Pino headerهای حساس را redact می‌کند، ولی user/entitlement/usage audit ندارد.

## 11. Environment variables شناخته‌شده

نام‌ها، نه مقادیر:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `B2_ENDPOINT`, `B2_REGION`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `BUCKET_NAME`
- `RUNPOD_ENDPOINT`, `RUNPOD_API_KEY`
- `VITE_API_BASE_URL`
- `PORT`, `BASE_PATH`, `LOG_LEVEL`, `NODE_ENV`

Secretها نباید در گزارش، test output یا commit ثبت شوند.
