# فهرست اتصال Admin و User Application

> وضعیت: معماری و Roadmap نسخه دوم بر اساس تصمیم‌های صریح مالک محصول
>
> برنچ کاری User: `docs/admin-user-plan-enforcement-analysis`
>
> تاریخ بازنویسی: `2026-07-29`

## هدف

این مجموعه برای ساخت یک اتصال عمومی و قابل توسعه میان سیستم مدیریتی و User Application است:

- مالک محصول قابلیت، پلن، قیمت، محدودیت، اعتبار، انتشار، پایلوت و کنترل‌های دستی را در Admin مدیریت می‌کند.
- User Application عملکرد واقعی قابلیت را از طریق دریچه عمومی به سیستم متصل می‌کند.
- افزودن یا تغییر قیمت، محدودیت، وابستگی و عضویت پلن نباید موتور User Application را تغییر دهد.
- ساخت رفتار نرم‌افزاری واقعاً جدید فقط به Adapter همان عملکرد نیاز دارد، نه بازنویسی سیستم پلن و اعتبار.

## منابع حقیقت

ترتیب اعتبار تصمیم‌ها:

1. دستور صریح فعلی مالک محصول
2. [`../../CONTEXT.md`](../../CONTEXT.md)
3. ADRهای پذیرفته‌شده در [`../adr/`](../adr/)
4. مدل هدف در [`04-INTEGRATION-AND-SECURITY-MODEL.md`](./04-INTEGRATION-AND-SECURITY-MODEL.md)
5. Roadmapها
6. تحلیل وضعیت فعلی دو repository

اگر یک سند قدیمی با CONTEXT یا ADR تعارض داشت، CONTEXT و ADR معتبرند.

## قانون ریپوی واحد با دو اپ متمایز

چیدمان تک‌ریپویی در ADR 0028 ثبت شده است.

User Application (`apps/diminish-studio` + بک‌اند `apps/api-server`):

```text
/home/danial/diminish all project/diminish-studio
```

Admin (`apps/admin`):

```text
/home/danial/diminish all project/diminish-studio/apps/admin
```

- تغییر اپ‌ها/پکیج‌های کاربران مطابق Allowed paths هر task مجاز است.
- تغییر Admin (`apps/admin`) مطلقاً ممنوع نیست، اما هر task تغییردهنده Admin نیازمند تأیید صریح مالک محصول است.
- تأیید معماری کلی، مجوز خودکار تغییر Admin در taskهای آینده نیست.
- DDL/DML روی دیتابیس مشترک یا production فقط با task مستقل، محیط مشخص و تأیید صریح مجاز است.

## ترتیب مطالعه Agent اجرایی

1. `CONTEXT.md`
2. تمام ADRها در `docs/adr/` به ترتیب شماره
3. `docs/admin-user-integration/01-BRANCH-AND-SCOPE.md`
4. `02-USER-APPLICATION.md`
5. `03-ADMIN-AND-SHARED-DATABASE.md`
6. `04-INTEGRATION-AND-SECURITY-MODEL.md`
7. `05-GAPS-DECISIONS-AND-UNKNOWNS.md`
8. `06-NEEDS-DECISIONS.md`
9. `roadmaps/00-EXECUTION-CONTRACT.md`
10. Roadmapها به ترتیب شماره
11. reportهای dependency

## فایل‌ها

| فایل | هدف |
|---|---|
| `CONTEXT.md` | زبان قطعی دامنه و روابط |
| `docs/adr/*.md` | تصمیم‌های معماری تأییدشده |
| `01-BRANCH-AND-SCOPE.md` | محدوده، approval و ایمنی ریپوی واحد |
| `02-USER-APPLICATION.md` | evidence وضعیت فعلی User Application |
| `03-ADMIN-AND-SHARED-DATABASE.md` | evidence وضعیت فعلی Admin و DB |
| `04-INTEGRATION-AND-SECURITY-MODEL.md` | معماری هدف اتصال |
| `05-GAPS-DECISIONS-AND-UNKNOWNS.md` | شکاف‌های فنی و unknownهای باقی‌مانده |
| `06-NEEDS-DECISIONS.md` | فقط تصمیم‌های باز مالک محصول |
| `roadmaps/00-EXECUTION-CONTRACT.md` | قرارداد اجرای taskهای عمیق و مستقل |
| `roadmaps/01-FOUNDATION-AND-SECURITY.md` | تست و رفع فوری امنیت فعلی |
| `roadmaps/02-ENTITLEMENTS-AND-USAGE.md` | Module اتصال مدیریتی و کنترل‌پلین |
| `roadmaps/03-ROLLOUT-AND-OPERATIONS.md` | Gateway کاربر، tracer capability و rollout |

## وضعیت فعلی

- snapshot امن `FND-001` قبلاً با موفقیت ثبت شده است.
- تصمیم‌های سطح مالک محصول بسته شده‌اند؛ `06-NEEDS-DECISIONS.md` باید صفر تصمیم باز نشان دهد.
- taskهای قدیمی پس از `FND-001` با Roadmap نسخه دوم supersede شده‌اند.
- اصلاح امنیت بحرانی routeهای فعلی نباید منتظر تکمیل سیستم پلن یا تصمیم تجاری بماند.
