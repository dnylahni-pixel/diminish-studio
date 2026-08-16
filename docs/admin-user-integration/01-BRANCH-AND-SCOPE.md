# Branch، محدوده و Approval

## ریپوی واحد با دو اپ متمایز

چیدمان تک‌ریپویی در ADR 0028 ثبت شده است.

### User Application — `apps/diminish-studio` و بک‌اند `apps/api-server`

```text
/home/danial/diminish all project/diminish-studio
```

برنچ الزامی:

```text
docs/admin-user-plan-enforcement-analysis
```

### Admin — `apps/admin`

```text
/home/danial/diminish all project/diminish-studio/apps/admin
```

Admin دارای تغییرات محلی متعلق به کاربر است. Agent حق پاک‌کردن، reset، stash، format عمومی یا بازگردانی آن‌ها را ندارد.

## قانون Approval

هر task باید یکی از این وضعیت‌ها را صریحاً داشته باشد:

- `USER_ONLY`: فقط اپ‌ها/پکیج‌های کاربران (خارج از `apps/admin`)؛ approval اضافه لازم نیست.
- `ADMIN_APPROVAL_REQUIRED`: تغییر `apps/admin` لازم است؛ قبل از اولین write باید تأیید صریح مالک محصول گرفته شود.
- `CROSS_REPO_APPROVAL_REQUIRED`: هر دو اپ (User Application و Admin) تغییر می‌کنند؛ approval Admin و محدوده فایل‌ها باید صریح باشد.
- `PRODUCTION_APPROVAL_REQUIRED`: هرگونه deployment، DDL/DML یا داده واقعی؛ approval مستقل لازم است.

تأیید کلی اینکه «Admin قابل تغییر است» جای approval مخصوص task را نمی‌گیرد.

## قبل از هر task

```bash
git -C '/home/danial/diminish all project/diminish-studio' branch --show-current
git -C '/home/danial/diminish all project/diminish-studio' status --short --branch
```

اگر branch درست نبود، هیچ تغییر یا commit مجاز نیست.

## قوانین تغییر

- فقط Allowed paths همان task تغییر کند.
- تغییر unrelated ممنوع است.
- secret، token، URL دیتابیس، email، Clerk ID، signed URL و PII چاپ یا commit نشود.
- تماس پولی RunPod/B2/Clerk در test ممنوع است.
- migration فقط روی PostgreSQL ایزوله تست شود.
- production DB و shared DB برای DDL/DML بدون approval مستقل ممنوع‌اند.
- خواندن metadata و aggregate غیرشخصی فقط read-only و sanitized مجاز است.

## قرارداد Admin

Admin control plane و مالک تعریف تجاری قابلیت‌هاست. تغییرات مجاز آینده ممکن است شامل این موارد باشند:

- Module مستقل API اتصال مدیریتی
- service-to-service authentication
- published policy sync، preview و rollback
- runtime connection manifest
- quote، reserve، capture، release و audit
- کنترل‌های دستی loss، retry، block و refund

هیچ‌یک از این موارد بدون task آماده و approval صریح مجوز اجرا ندارند.

## Commit

- هر task موفق یک commit در ریپوی واحد می‌خواهد.
- hash commit در report ثبت می‌شود.
- task ناقص یا test‌نشده commit نمی‌شود.
- report و Roadmap در ریشه‌ی ریپو نگهداری می‌شوند.

## کنترل عدم آلودگی

قبل و بعد task، status و fingerprint ریپوی واحد ثبت شود. تفاوت تازه خارج Allowed paths نتیجه را `FAILED` می‌کند.
