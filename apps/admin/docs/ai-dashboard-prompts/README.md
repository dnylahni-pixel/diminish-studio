# Diminish Super Admin — AI Prompt Kit

این پوشه برای ساخت مرحله‌ای داشبورد توسط چند مدل AI طراحی شده است؛ هر مدل فقط یک قطعه کوچک می‌سازد، اما خروجی نهایی باید کاملاً یکپارچه دیده شود.

## روش استفاده

1. Promptها را دقیقاً با ترتیب شماره اجرا کن.
2. متن کامل هر فایل را مستقیماً برای مدل بفرست.
3. اگر مدل به پروژه دسترسی دارد، باید خودش فایل‌ها را ویرایش کند.
4. اگر مدل وب است، باید محتوای کامل فایل‌های ساخته یا ویرایش‌شده را تحویل دهد؛ خروجی را در همان مسیرها قرار بده.
5. قبل از جایگزینی یک فایل shared مثل `src/components/ui/navigation.tsx` مطمئن شو مدل exportهای نامرتبط را حذف نکرده باشد.
6. بعد از هر مرحله `npm run lint` و `npm run build` را اجرا کن.
7. تا مرحله قبلی Build نشده، مرحله بعد را شروع نکن.
8. دو مدل را هم‌زمان روی یک شماره یا فایل مشترک اجرا نکن.

## ترتیب اجرا

1. `01-foundation-shell.prompt.md`
2. `02-overview-dashboard.prompt.md`
3. `03-users-list.prompt.md`
4. `04-user-360.prompt.md`
5. `05-plans-list.prompt.md`
6. `06-plan-detail.prompt.md`
7. `07-subscriptions-list.prompt.md`
8. `08-subscription-detail.prompt.md`
9. `09-credits-usage.prompt.md`
10. `10-billing.prompt.md`
11. `11-trials-promotions.prompt.md`
12. `12-reports-alerts.prompt.md`
13. `13-admin-settings.prompt.md`
14. `14-integration-hardening.prompt.md`

## قانون طلایی

- هر Prompt مستقل و قابل کپی است.
- مدل حق بازطراحی بخش‌های قبلی را ندارد.
- مدل حق ساخت مجدد UI primitiveهای موجود را ندارد.
- دامنه اصلی فقط Users، Plans، Subscriptions، Credits، Billing و وابستگی‌های آن‌هاست.
- داده‌های Songs، Artists و Chords جزو داشبورد اصلی نیستند.

فایل `00-master-contract.md` مرجع معماری و طراحی برای بررسی خروجی مدل‌هاست.
