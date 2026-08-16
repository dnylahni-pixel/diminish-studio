# Roadmap 02 — Management Integration Module

> تمام taskهای این Roadmap تغییر Admin می‌خواهند و قبل از write نیازمند approval صریح مالک محصول هستند.

## Control Plane Core

- [ ] `ADM-101` ساخت Module مستقل Integration API v1 و service identity
  - Depends on: `FND-104`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: versioned internal API shell، short-lived service auth، request correlation و contract conformance
  - Allowed paths: Admin integration module/config/tests؛ UI unrelated ممنوع
  - Tests: valid/expired/wrong audience token، version negotiation، rate limit، secret redaction
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-102` ساخت Published Policy Snapshot و Manual Sync Module
  - Depends on: `ADM-101`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: selective atomic sync، impact preview، immutable snapshot، rollback و optional maintenance pause
  - Allowed paths: Admin integration/policy sync/schema/migrations/tests/UI محدود sync
  - Tests: partial selection، atomic failure، rollback، concurrent sync، pause on/off، affected-user counts
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-103` ساخت Runtime Manifest و Capability Availability Module
  - Depends on: `ADM-101`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: authenticated manifest ingestion، connected/unconnected status و presentation response
  - Allowed paths: Admin integration/manifest/schema/tests/UI status
  - Tests: stale manifest، unknown operation، version mismatch، forged caller، connected/unconnected
  - Report: `PENDING`
  - Commits: `PENDING`

## Commercial Enforcement Core

- [ ] `ADM-104` ساخت Quote and Authorization Module
  - Depends on: `ADM-102`, `ADM-103`, `FND-102`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: deep Interface برای primary plan/addons، published policy، dependencies، limits، pricing، quote fingerprint و user confirmation
  - Allowed paths: Admin integration/domain/schema/migrations/tests
  - Tests: fake arbitrary capability بدون engine change، one primary plan، addons، missing/unconnected، fingerprint mutation، manual pause
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-105` ساخت Atomic Reservation and Outcome Module
  - Depends on: `ADM-104`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: authorize/reserve/capture/release با idempotency، negative credit ceiling، actual quantity و ledger invariants
  - Allowed paths: Admin integration/credits/usage/schema/migrations/tests
  - Tests: 20 concurrent reserves، replay/conflict، frozen account، over-reserve، rollback، capture/release exactly once
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-106` ساخت Actual Cost, Loss and Manual Governance Module
  - Depends on: `ADM-105`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: provider cost، absorbed loss، per-user totals، alerts و manual retry/block/unblock/refund cases
  - Allowed paths: Admin integration/governance/schema/migrations/tests/UI محدود governance
  - Tests: success/failure cost، atomic totals، threshold alert-only، manual state transitions، idempotent full/partial refund، audit
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-107` ساخت Recovery, Retention and Alerting Module
  - Depends on: `ADM-106`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: stuck reservation/outcome recovery، configurable retention و high-priority operational alerts
  - Allowed paths: Admin integration/workers/config/tests/UI alerts
  - Tests: concurrent workers، lease loss، already-finalized، retention dry-run، no auto governance mutation
  - Report: `PENDING`
  - Commits: `PENDING`

- [ ] `ADM-108` اثبات backward-compatible v1/vNext Integration API
  - Depends on: `ADM-102`, `ADM-103`, `ADM-107`
  - Priority: `PLATFORM`
  - Approval: `ADMIN_REQUIRED`
  - Repositories: Admin
  - Outcome: previous contract remains usable during rolling upgrade
  - Allowed paths: Admin integration contract/tests/deployment docs
  - Tests: old client/new server، new client/old fixture، deprecation telemetry، rollback
  - Report: `PENDING`
  - Commits: `PENDING`

## Exit

Roadmap 02 با API مدیریتی production-ready، بدون دسترسی مستقیم User به DB و با کنترل‌های دستی مصوب کامل می‌شود.
