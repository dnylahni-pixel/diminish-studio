# Roadmap 01 — امنیت فوری و Foundation

## Evidence موجود

- [x] `FND-001` snapshot امن branch، environment و DB metadata
  - Depends on: none
  - Priority: `FOUNDATION`
  - Approval: `USER_ONLY`
  - Repositories: User docs only
  - Outcome: snapshot و `UNK-001..007`
  - Report: `task-reports/FND-001-safe-branch-environment-db-metadata-snapshot.md`
  - Commits: User `25b9529adafc5ef58e72bc4699e3ebd07e1d1b3f`

## Lane A — امنیت بحرانی مستقل

- [ ] `SEC-101` ساخت Security Test Harness برای API
  - Depends on: none
  - Priority: `CRITICAL`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: Vitest/Supertest، Clerk fake، DB/provider spies و deterministic request identity در یک test interface
  - Allowed paths: User package/test config و API test support
  - Tests: health smoke، authenticated/unauthenticated، zero Clerk/B2/RunPod network
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `SEC-102` بستن perimeter کامل Analyze
  - Depends on: `SEC-101`
  - Priority: `CRITICAL`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: auth، internal user resolve، song ownership و zero external side effect قبل از allow
  - Allowed paths: Analyze route/module و tests
  - Tests: unauth 401، wrong owner deny، missing owner deny، owner path characterization، malformed ID، DB failure
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `SEC-103` حذف DEMO_USER_ID از کل Learning surface
  - Depends on: `SEC-101`
  - Priority: `CRITICAL`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: تمام learning read/writeها user-scoped، ownership-safe و counters atomic
  - Allowed paths: Learning routes/repository/tests
  - Tests: auth، row isolation، malformed input، 20 concurrent attempts، no lost update
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `SEC-104` افزودن emergency abuse guard برای Analyze
  - Depends on: `SEC-102`, `FND-102`
  - Priority: `CRITICAL`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: distributed-safe temporary limiter که بعداً پشت Gateway باقی می‌ماند
  - Allowed paths: User limiter/Analyze adapter/User migration در صورت نیاز
  - Tests: multi-instance simulation، concurrency، expiry، zero provider call after deny
  - Report: `PENDING`
  - Commits: `PENDING`

## Lane B — Test و Contract Foundation

- [ ] `FND-102` ساخت Isolated PostgreSQL Harness و migration baseline
  - Depends on: none
  - Priority: `FOUNDATION`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: ephemeral/isolated DB، production URL refusal، migration up/upgrade/cleanup و contract ۹ جدول User
  - Allowed paths: User test DB tooling، migrations tests، test docs
  - Tests: fresh، rerun، parallel isolation، cleanup، schema assertions
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `FND-103` ساخت Integration Contract Test Kit
  - Depends on: `SEC-101`
  - Priority: `FOUNDATION`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: fake Management API، fake clock، idempotency/concurrency helpers و contract fixtures reusable
  - Allowed paths: User test support و shared contract fixtures
  - Tests: fake adapter conformance، timeout، replay، payload conflict
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `FND-104` تعریف v1 Integration API contract مستقل از transport
  - Depends on: `FND-103`
  - Priority: `FOUNDATION`
  - Approval: `USER_ONLY`
  - Repositories: User docs/spec/contract tests
  - Outcome: command/result schemas برای manifest، presentation، quote، authorize، outcome و governance reason codes
  - Allowed paths: User API spec/contract package/tests/docs
  - Tests: schema round-trip، backward-compatible fixtures، no PII fields، unknown enum handling
  - Report: `PENDING`
  - Commits: `PENDING`

## Exit

Roadmap 01 وقتی کامل است که security بحرانی فعلی بسته، test DB ایزوله و contract v1 قابل تست باشد. هیچ feature code واقعی یا تصمیم قیمت‌گذاری پیش‌شرط این Roadmap نیست.
