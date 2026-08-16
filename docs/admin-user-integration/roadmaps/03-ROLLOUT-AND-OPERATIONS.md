# Roadmap 03 — User Gateway، Tracer و Rollout

## User Runtime Core

- [ ] `USR-101` ساخت EnforcementGateway و API Adapter
  - Depends on: `FND-104`, `ADM-101`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: تنها Interface User برای manifest، presentation، quote، authorize و outcome با fake و production Adapter
  - Allowed paths: User domain/integration/config/tests
  - Tests: adapter conformance، service identity rotation، timeout، version mismatch، fail-closed
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `USR-102` ساخت Runtime Manifest Publisher و Presentation Cache
  - Depends on: `USR-101`, `ADM-103`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: manifest امن، sync دستی-triggered refresh، normal hidden و pilot coming-soon presentation
  - Allowed paths: User operation registry/presentation/cache/tests
  - Tests: connected/unconnected، stale cache، manual refresh، no runtime authorization from cache
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `USR-103` ساخت OperationExecutor عمومی
  - Depends on: `USR-101`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: quote→confirm→authorize→execute-once→validate→capture/release پشت Interface واحد
  - Allowed paths: User operation domain/tests
  - Tests: free/paid، fingerprint mutation، no provider on deny، provider exactly once، valid/invalid result، actual quantity
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `USR-104` ساخت Operation Journal و Outcome Recovery
  - Depends on: `USR-103`, `FND-102`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: durable state، outcome outbox، heartbeat، cancel/timeout و no costly provider retry
  - Allowed paths: User operation journal/schema/migration/worker/tests
  - Tests: crash در هر boundary، duplicate worker، report retry، provider call count one، resource lock
  - Report: `PENDING`
  - Commits: `PENDING`

## Tracer Capability

- [ ] `TRC-101` اتصال fake capability کامل end-to-end
  - Depends on: `ADM-105`, `USR-102`, `USR-104`
  - Priority: `ADAPTER`
  - Approval: `CROSS_REPO_REQUIRED`
  - Repositories: User + Admin test/fixture scope
  - Outcome: capability تازه فقط با Admin data و یک OperationAdapter اضافه شود؛ engine code unchanged
  - Allowed paths: integration fixtures، fake adapters، e2e tests؛ no production data
  - Tests: define/publish/sync/manifest/quote/confirm/reserve/success/failure/loss/recovery/concurrency
  - Report: `PENDING`
  - Commits: `PENDING`

## Real Adapters

- [ ] `ANL-101` اتصال Analyze به OperationExecutor
  - Depends on: `SEC-102`, `SEC-104`, `TRC-101`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: Analyze فقط OperationAdapter باشد؛ signed URL و RunPod بعد از permit؛ no auto costly retry
  - Allowed paths: Analyze adapter/orchestration/tests
  - Tests: quote mutation، deny zero B2/RunPod، success capture، provider failure release/loss، crash recovery، same-song concurrency
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `STO-101` اتصال Upload/Storage به OperationExecutor
  - Depends on: `TRC-101`, `FND-102`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: presign/confirm/storage limit با operation fingerprint، idempotency و recoverable journal
  - Allowed paths: Upload/storage modules/schema/migrations/tests
  - Tests: file swap invalidates quote، exact fit، concurrent confirm، crash boundaries، one quota account
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `LRN-101` اتصال Learning capability presentation/enforcement
  - Depends on: `SEC-103`, `TRC-101`
  - Priority: `ADAPTER`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: access gating عمومی بدون تکرار plan logic داخل routeها
  - Allowed paths: Learning adapters/tests
  - Tests: included/addon/missing/paused، row isolation، no Gateway bypass
  - Report: `PENDING`
  - Commits: `PENDING`

## Release

- [ ] `REL-101` همگام‌سازی OpenAPI و generated clients
  - Depends on: `ANL-101`, `STO-101`, `LRN-101`
  - Priority: `ROLLOUT`
  - Approval: `USER_ONLY`
  - Repositories: User
  - Outcome: secure runtime contracts و shared reason codes
  - Allowed paths: User API spec/generated clients/contract tests
  - Tests: generation clean، runtime validation، no unrelated diff
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `REL-102` افزودن CI کامل بدون production dependencies
  - Depends on: `REL-101`, `ADM-108`
  - Priority: `ROLLOUT`
  - Approval: `CROSS_REPO_REQUIRED`
  - Repositories: User + Admin CI
  - Outcome: unit/contract/integration/migration/e2e با PostgreSQL و provider fake
  - Allowed paths: CI/test scripts only
  - Tests: local equivalents exit 0، zero secrets، zero real external request
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `REL-103` اجرای pilot با addon برای کاربران منتخب
  - Depends on: `REL-102`
  - Priority: `ROLLOUT`
  - Approval: `PRODUCTION_REQUIRED`
  - Repositories: deployment/report scope
  - Outcome: capability fake/Analyze برای selected users، dashboards، pause/rollback drill
  - Allowed paths: approved staging/deployment config و report
  - Tests: allow/deny، quote، cost، loss، manual controls، recovery
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `REL-104` rollout عمومی
  - Depends on: `REL-103`
  - Priority: `ROLLOUT`
  - Approval: `PRODUCTION_REQUIRED`
  - Repositories: approved deployment/report scope
  - Outcome: staged public plan enablement با stop conditions و rollback
  - Allowed paths: approved deployment config و report
  - Tests: canary، metrics، failure rate، provider cost، rollback
  - Report: `PENDING`
  - Commits: `PENDING`
