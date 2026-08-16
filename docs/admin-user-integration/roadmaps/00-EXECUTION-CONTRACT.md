# قرارداد اجرای Roadmap نسخه دوم

## 1. یک Agent، یک task عمیق

هر Agent فقط یک task-level checkbox اجرا می‌کند، اما task باید یک نتیجه قابل استفاده و testable پشت یک Interface مشخص تولید کند.

ممنوع:

- task جدا برای هر table mapping
- task جدا برای هر helper کوچک
- commit pass-through بدون behavior
- افزودن abstraction بدون Adapter و test واقعی

## 2. آمادگی task

task آماده است اگر:

- checkbox آن `[ ]` باشد.
- تمام Depends onهای صریح `[x]` با report و hash معتبر باشند.
- approval لازم آن موجود باشد.
- blocker مخصوص همان dependency نداشته باشد.

کامل‌نبودن task قبلی فایل یا Roadmap به‌تنهایی blocker نیست. dependency پنهان ممنوع است.

## 3. Priority

اگر چند task آماده‌اند:

1. Critical security User
2. test/isolation foundation
3. contract و tracer foundation
4. Admin integration task دارای approval
5. User gateway/adapter
6. rollout/operations

فقط اولین task آماده در بالاترین priority اجرا می‌شود.

## 4. Approval

Metadata هر task یکی از این‌هاست:

- `Approval: USER_ONLY`
- `Approval: ADMIN_REQUIRED`
- `Approval: CROSS_REPO_REQUIRED`
- `Approval: PRODUCTION_REQUIRED`

برای Admin/production، report باید متن یا reference تأیید صریح مالک محصول را ثبت کند. نبود approval نتیجه `WAITING_APPROVAL` است، نه مجوز حدس.

## 5. Lifecycle

1. branch/status هر دو repo
2. CONTEXT و ADRها
3. task و dependency reports
4. baseline commits و worktree fingerprints
5. approval verification
6. evidence از code فعلی
7. implementation فقط Allowed paths
8. targeted tests
9. related regression tests
10. typecheck/build
11. secret scan
12. status/fingerprint نهایی
13. report
14. checkbox و hash
15. commit در هر repo تغییریافته
16. توقف

## 6. Completion Gate

- Interface task کامل و محدود است.
- implementation complexity پشت Module متمرکز است.
- حداقل یک Adapter واقعی یا fake معتبر Interface را اثبات می‌کند.
- happy path، deny، malformed، dependency failure و boundary تست شده‌اند.
- DB taskها transaction، rollback، concurrency و idempotency را تست کرده‌اند.
- external taskها zero paid network call دارند.
- User و Admin تغییرات خارج scope ندارند.
- report و commit hash کامل‌اند.

## 7. Failure

اگر test fail، approval مفقود، DB target نامطمئن، secret exposure یا unrelated change رخ داد:

- checkbox unchecked
- commit ممنوع
- report `FAILED`, `BLOCKED` یا `WAITING_APPROVAL`
- فقط dependent taskها متوقف می‌شوند
- laneهای مستقل ادامه‌پذیرند

## 8. Test قواعد

### Interface tests

- caller فقط Interface را ببیند.
- implementation detail در test public contract نشت نکند.
- حداقل دو Adapter برای Seamهای replaceable: production adapter و fake.

### Integration API

- service identity
- contract version compatibility
- authz و malformed input
- quote fingerprint conflict
- idempotent replay
- transaction rollback
- concurrent reserve/capture/release
- no PII/secret

### OperationExecutor

- quote/confirm/authorize order
- zero provider call on denial
- provider exactly once
- outcome retry without provider replay
- cancel/timeout/recovery
- resource concurrency

### Policy Sync

- selective snapshot
- atomic apply
- preview correctness
- rollback
- maintenance pause
- old API version compatibility

## 9. Migration

- migration فقط در repository مالک schema
- isolated PostgreSQL first
- fresh و upgrade fixture
- duplicate/preflight checks
- rollback یا forward recovery
- no `push --force`
- no shared/production execution without independent approval

## 10. Report

Report در User repo:

```text
docs/admin-user-integration/task-reports/TASK-<ID>-<slug>.md
```

باید شامل:

- approval
- repos و branches
- baseline/final fingerprints
- files
- commands/exit codes/test counts
- Interface و Adapter proof
- security and failure evidence
- User commit hash
- Admin commit hash اگر وجود دارد
- remaining risks

## 11. State Format

```markdown
- [ ] `ID` عنوان
  - Depends on: `...`
  - Priority: `CRITICAL | FOUNDATION | PLATFORM | ADAPTER | ROLLOUT`
  - Approval: `...`
  - Repositories: `...`
  - Outcome: `...`
  - Allowed paths: `...`
  - Tests: `...`
  - Report: `PENDING`
  - Commits: `PENDING`
```
