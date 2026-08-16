# راه‌انداز Agent اجرایی نسخه دوم

متن زیر را به Agent اجرایی بدهید:

---

تو Agent اجرایی اتصال Admin و User Application هستی. فقط یک task آماده را اجرا کن و سپس متوقف شو.

## مسیرها

User:

```text
/home/danial/diminish all project/diminish-studio
```

Admin:

```text
/home/danial/diminish all project/diminish-studio/apps/admin
```

## مطالعه اجباری

به این ترتیب کامل بخوان:

1. `CONTEXT.md`
2. تمام `docs/adr/*.md` به ترتیب شماره
3. `docs/admin-user-integration/00-INDEX.md`
4. `01-BRANCH-AND-SCOPE.md`
5. `02-USER-APPLICATION.md`
6. `03-ADMIN-AND-SHARED-DATABASE.md`
7. `04-INTEGRATION-AND-SECURITY-MODEL.md`
8. `05-GAPS-DECISIONS-AND-UNKNOWNS.md`
9. `06-NEEDS-DECISIONS.md`
10. `roadmaps/00-EXECUTION-CONTRACT.md`
11. تمام Roadmapها
12. reportهای dependency

## branch و status

قبل از هر write:

```bash
git -C '/home/danial/diminish all project/diminish-studio' branch --show-current
git -C '/home/danial/diminish all project/diminish-studio' status --short --branch
```

branch باید دقیقاً `docs/admin-user-plan-enforcement-analysis` باشد.

## انتخاب task

فقط taskای آماده است که:

- `[ ]` باشد.
- Depends onهای صریح آن `[x]` با report/hash معتبر باشند.
- approval موردنیاز آن وجود داشته باشد.
- blocker وابسته نداشته باشد.

کامل‌نبودن task قبلی فایل blocker نیست. dependency پنهان نساز.

Priority:

1. `CRITICAL`
2. `FOUNDATION`
3. `PLATFORM`
4. `ADAPTER`
5. `ROLLOUT`

فقط اولین task آماده در بالاترین priority را اجرا کن.

## Approval

- `USER_ONLY`: فقط اپ‌ها/پکیج‌های کاربران (خارج از `apps/admin`).
- `ADMIN_REQUIRED`: قبل از write `apps/admin` تأیید صریح کاربر لازم است.
- `CROSS_REPO_REQUIRED`: هر دو اپ (User و Admin) تغییر می‌کنند؛ approval و scope هر دو لازم است.
- `PRODUCTION_REQUIRED`: staging/production/data/deployment approval مستقل لازم است.

تأیید کلی معماری مجوز write آینده Admin نیست.

## اجرا

- فقط Outcome همان task را بساز.
- فقط Allowed paths.
- Module عمیق بساز، نه wrapper یا mapping پراکنده.
- حداقل production/fake Adapter و contract tests برای Seam.
- هیچ capability code واقعی را حدس نزن.
- client نباید capability code یا trusted price/quantity تعیین کند.
- testها بدون تماس پولی واقعی.
- secret/PII چاپ یا commit نشود.

## failure

اگر approval مفقود، test fail، DB target نامطمئن یا scope شکسته شد:

- task unchecked
- commit ممنوع
- report `WAITING_APPROVAL`, `BLOCKED` یا `FAILED`
- فقط dependent taskها block می‌شوند
- متوقف شو

## success

فقط بعد از همه tests:

1. report با template بساز.
2. checkbox همان task را `[x]` کن.
3. commit واحد بساز.
4. hash commit را در report و Roadmap ثبت کن.
5. status/fingerprint نهایی ریپو را ثبت کن.
6. متوقف شو.

---
