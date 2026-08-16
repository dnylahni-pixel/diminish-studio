# شکاف‌ها، ریسک‌ها و Unknownهای فنی

## 1. وضعیت تصمیم‌ها

تمام تصمیم‌های سطح مالک محصول ثبت شده‌اند:

- زبان دامنه: `CONTEXT.md`
- تصمیم‌ها: `docs/adr/0001..0027`
- تصمیم باز مالک محصول: صفر

Agentها حق بازکردن دوباره این تصمیم‌ها یا جایگزین‌کردن آن‌ها با default دلخواه ندارند.

## 2. شکاف‌های بحرانی فعلی

| ID | شکاف |
|---|---|
| GAP-001 | Analyze بدون auth و ownership است. |
| GAP-002 | Learning از `DEMO_USER_ID` استفاده می‌کند. |
| GAP-003 | test harness و CI امن وجود ندارد. |
| GAP-004 | Admin Integration API وجود ندارد. |
| GAP-005 | User EnforcementGateway و OperationExecutor وجود ندارند. |
| GAP-006 | runtime operation manifest وجود ندارد. |
| GAP-007 | published policy sync/preview/rollback/maintenance pause وجود ندارد. |
| GAP-008 | quote و immutable operation fingerprint وجود ندارند. |
| GAP-009 | usage idempotency uniqueness و operation journal کامل نیست. |
| GAP-010 | actual provider cost و absorbed loss governance کامل نیست. |
| GAP-011 | manual retry/block/refund case management وجود ندارد. |
| GAP-012 | User runtime credential فعلی از least privilege فاصله دارد. |
| GAP-013 | upload و Analyze recovery state machine کامل نیست. |
| GAP-014 | OpenAPI با runtime drift دارد. |

## 3. Unknownهای فنی قابل تصمیم توسط Agent

این موارد تصمیم محصول نیستند. Agent باید با evidence و test بهترین طراحی سازگار با ADRها را انتخاب کند:

- technology دقیق service identity کوتاه‌عمر
- schema و serialization نسخه قرارداد API
- storage format published policy snapshot
- transaction design atomic sync و rollback
- exact fields و canonicalization operation fingerprint
- content hash در برابر object version یا ترکیب هر دو
- quote cleanup TTL بدون اثر تجاری
- permit heartbeat و lease implementation
- operation journal persistence
- outbox/inbox برای outcome delivery
- concurrency lock implementation
- alert transport و retention storage
- migration rollout و backward compatibility

هر انتخاب hard-to-reverse یا surprising باید ADR فنی تازه داشته باشد.

## 4. موارد نیازمند Approval، نه تصمیم معماری

- هر تغییر Admin repo
- هر migration Admin/shared database
- اجرای staging
- deployment یا secret provisioning
- تغییر production data
- فعال‌کردن pilot برای user واقعی
- public rollout

نبود approval فقط task وابسته را متوقف می‌کند و نباید lane مستقل امنیت User را مسدود کند.

## 5. Invariantهای غیرقابل مذاکره

- no direct Admin DB access from User production
- no client-selected capability code
- no paid operation without quote/authorization/reservation
- no provider retry after costly failure
- no capture before valid result
- no automatic block/unblock/retry/refund governance
- no half-applied policy sync
- no unconnected capability execution
- no bypass of EnforcementGateway
- no real paid external call in tests

## 6. Driftهای DB که migration task می‌خواهند

- `users.clerk_id` nullability
- storage quota default drift
- missing unique usage idempotency constraint
- no deterministic single primary subscription constraint
- migration history table empty
- current role دارای write/DDL privilege گسترده

هیچ‌یک نباید با DDL مستقیم روی DB مشترک حل شود. migration file، isolated test، compatibility و rollback قبل از approval لازم‌اند.

## 7. معیار آمادگی implementation

implementation عمومی زمانی آغاز می‌شود که:

- immediate security lane مستقل شروع شده باشد.
- isolated test harness آماده باشد.
- contract نسخه اول Integration API نوشته و contract-tested شود.
- Admin task مربوط approval صریح داشته باشد.

تعریف capability codeهای واقعی پیش‌شرط ساخت Foundation نیست. fake tracer capability برای اثبات معماری استفاده می‌شود.
