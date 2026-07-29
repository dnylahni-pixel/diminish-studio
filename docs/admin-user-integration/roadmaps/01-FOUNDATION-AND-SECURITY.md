# Roadmap 01 — Foundation و محافظت فوری

> قرارداد الزامی: [`00-EXECUTION-CONTRACT.md`](./00-EXECUTION-CONTRACT.md)
>
> همه taskها فقط در User repo اجرا می‌شوند. Admin مطلقاً read-only است.

## Phase 1 — Preflight و تصمیم‌های مسدودکننده

- [x] `FND-001` ثبت snapshot امن branch، environment و DB metadata
  - Depends on: none
  - هدف: ثبت branch/commit، DB identity بدون host/secret، table/index/constraint metadata و aggregateهای غیرشخصی.
  - Allowed paths: `docs/admin-user-integration/task-reports/FND-001-*.md`, همین Roadmap
  - ممنوع: DDL/DML، خواندن row شخصی، چاپ URL/credential، تغییر Admin
  - Tests: commandهای read-only باید exit code 0 داشته باشند؛ secret scan گزارش باید صفر باشد.
  - Evidence: current branch، HEAD، counts، schema drift و query list sanitized.
  - Completion: snapshot قابل بازتولید و تمام `UNK-001..007` تعیین یا صریح BLOCKED شوند.
  - Report: `task-reports/FND-001-safe-branch-environment-db-metadata-snapshot.md`
  - Commit: `25b9529adafc5ef58e72bc4699e3ebd07e1d1b3f`

- [ ] `FND-002` ثبت decision matrix محیط و migration ownership
  - Depends on: `FND-001`
  - هدف: بستن `DEC-001` و `DEC-002` با شواهد موجود یا ثبت blocker انسانی.
  - Allowed paths: فقط Markdown این مجموعه
  - Tests: link/path validation.
  - Evidence: owner هر domain، DB مجاز تست، production prohibition، rollback owner.
  - Completion: هیچ ambiguity درباره محل migration test و اجرای deployment نماند؛ در غیر این صورت BLOCKED.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-003` ثبت feature-code contract مصوب
  - Depends on: `FND-002`
  - هدف: بستن `DEC-004` برای analysis/storage/upload/learning بدون insert در Admin.
  - Allowed paths: فقط Markdown این مجموعه
  - Tests: هر code باید با pattern DB و unique mapping route→feature بررسی شود.
  - Evidence: source/approver، kind، unit، missing-limit semantics.
  - Completion: codeها قطعی؛ نبود approval یعنی BLOCKED.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-004` ثبت subscription/status/limit/overage policy
  - Depends on: `FND-003`
  - هدف: بستن `DEC-003`, `DEC-005..009`.
  - Allowed paths: فقط Markdown این مجموعه
  - Tests: policy table باید تمام statusها، periods، multiple-subscription و overage را پوشش دهد.
  - Evidence: truth table allow/deny و boundary examples UTC.
  - Completion: هر input یک نتیجه deterministic داشته باشد؛ ambiguity یعنی BLOCKED.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-005` ثبت storage source-of-truth و downgrade policy
  - Depends on: `FND-004`
  - هدف: بستن `DEC-010` و drift 1 GiB/200 MiB.
  - Allowed paths: فقط Markdown این مجموعه
  - Tests: examples برای new user، upgrade، downgrade زیر usage، deletion و reconcile.
  - Evidence: canonical source، cache semantics، backfill و no-auto-delete rule.
  - Completion: migration/backfill contract قطعی؛ ambiguity یعنی BLOCKED.
  - Report: `PENDING`
  - Commit: `PENDING`

## Phase 2 — Test foundation

- [ ] `FND-006` افزودن minimal Vitest harness برای API server
  - Depends on: `FND-005`
  - هدف: test runner و یک smoke test بدون تغییر behavior production.
  - Allowed paths: root/workspace package config لازم، `artifacts/api-server/package.json`, test config و test helpers API
  - Tests: health app smoke؛ خود command test؛ typecheck.
  - Evidence: test count، exit 0، هیچ external call/DB production.
  - Completion: test command deterministic و documented.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-007` ساخت Clerk auth mock قابل تنظیم
  - Depends on: `FND-006`
  - هدف: authenticated/unauthenticated/wrong-user scenarios بدون Clerk واقعی.
  - Allowed paths: test helpers/mocks API server
  - Tests: سه حالت token؛ اثبات zero Clerk network call.
  - Evidence: mock contract و test output.
  - Completion: route testها بتوانند identity را per-test کنترل کنند.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-008` ساخت PostgreSQL integration harness ایزوله
  - Depends on: `FND-007`
  - هدف: DB ephemeral یا database اختصاصی test با cleanup قطعی.
  - Allowed paths: API test helpers، test scripts/config، docs اجرای test
  - Tests: create/migrate/query/cleanup smoke؛ refusal برای production-looking URL.
  - Evidence: unique test DB/schema، cleanup log، no shared DB mutation.
  - Completion: parallel-safe و repeatable.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `FND-009` افزودن baseline migration contract test برای ۹ جدول User
  - Depends on: `FND-008`
  - هدف: ثبت shape واقعی User schema قبل از schema integration.
  - Allowed paths: migration integration tests
  - Tests: fresh DB، columns، FK، unique، defaults و rerun behavior.
  - Evidence: schema assertions و drift report.
  - Completion: baseline سبز؛ failure موجود باید BLOCKED گزارش شود نه پنهان.
  - Report: `PENDING`
  - Commit: `PENDING`

## Phase 3 — محافظت فوری routeهای پرریسک

- [ ] `SEC-001` افزودن تست قرمز auth برای Analyze
  - Depends on: `FND-007`
  - هدف: قبل از fix ثابت کند unauthenticated request نباید RunPod/B2/DB side effect داشته باشد.
  - Allowed paths: analyze route tests و test mocks
  - Tests: 401 و zero calls برای S3 signing، RunPod fetch و analysis write.
  - Evidence: test ابتدا failure فعلی و سپس در commit فقط test به‌صورت expected failing قابل commit نیست؛ task باید harness policy برای todo/known-failure نداشته باشد. پس completion فقط با test executable که current defect را reproducibly ثبت کند در report؛ checkbox **نباید** زده شود مگر Roadmap صریحاً اجازه test-only failing نمی‌دهد. این task باید همراه تغییر behavior نباشد؛ بنابراین معیار completion: test با assertion روی behavior فعلی و security characterization، نه assertion desired.
  - Completion: characterization test سبز که lack of auth را نشان دهد و گزارش severity؛ fix در `SEC-002`.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-002` enforce کردن Clerk auth روی Analyze
  - Depends on: `SEC-001`
  - هدف: رد unauthenticated request پیش از هر side effect.
  - Allowed paths: analyze route، auth helper لازم، tests
  - Tests: unauthenticated 401؛ authenticated path؛ zero external call در denial؛ related route tests.
  - Evidence: call-order spy و HTTP response.
  - Completion: auth gate fail-closed و tests سبز.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-003` enforce کردن song ownership روی Analyze
  - Depends on: `SEC-002`
  - هدف: فقط مالک song بتواند analysis درخواست کند.
  - Allowed paths: analyze route/repository/helper و tests
  - Tests: owner allow، non-owner/unknown 404 یا policy مصوب، nullable owner deny، zero RunPod call.
  - Evidence: DB integration + route test.
  - Completion: IDOR بسته و no information leak contract رعایت شود.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-004` افزودن distributed-safe Analyze request limiter
  - Depends on: `SEC-003`, `FND-004`
  - هدف: limit پایه abuse مستقل از plan؛ backend طبق `DEC-013`.
  - Allowed paths: User API limiter module، analyze adapter، schema/migration User در صورت مصوب، tests
  - Tests: boundary، expiry، concurrent requests، multi-instance simulation.
  - Evidence: 429 + Retry-After، zero RunPod after deny.
  - Completion: restart/replica bypass طبق design بسته شود.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-005` جایگزینی `DEMO_USER_ID` در GET learning sessions
  - Depends on: `FND-007`
  - هدف: فقط GET sessions را به Clerk user scope متصل کند.
  - Allowed paths: learning route/helper/tests
  - Tests: unauth 401، own rows only، other rows hidden، user creation error mapping.
  - Evidence: route + DB integration.
  - Completion: فقط این endpoint اصلاح؛ دیگر learning endpointها untouched.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-006` جایگزینی `DEMO_USER_ID` در POST learning sessions
  - Depends on: `SEC-005`
  - هدف: فقط create session را user-scoped و validated کند.
  - Allowed paths: learning route/schema/tests
  - Tests: auth، input bounds، inserted user ID، malformed body.
  - Evidence: DB row owner.
  - Completion: یک endpoint کامل.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-007` افزودن ownership و atomic counters به submit attempt
  - Depends on: `SEC-006`
  - هدف: فقط attempt endpoint؛ حذف read-modify-write race.
  - Allowed paths: learning route/repository/tests
  - Tests: non-owner deny؛ 20 concurrent attempts بدون lost update؛ validation.
  - Evidence: DB final counters برابر event count.
  - Completion: ownership و concurrency هر دو اثبات شوند.
  - Report: `PENDING`
  - Commit: `PENDING`

- [ ] `SEC-008` user-scope کردن mastered chords
  - Depends on: `SEC-007`
  - هدف: فقط mastered endpoint.
  - Allowed paths: learning route/tests
  - Tests: auth و row isolation.
  - Evidence: HTTP + DB fixture.
  - Completion: هیچ `DEMO_USER_ID` runtime باقی نماند.
  - Report: `PENDING`
  - Commit: `PENDING`
