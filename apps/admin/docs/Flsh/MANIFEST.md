# Diminish Database Intelligence Engine — Manifest

این سند جزئیات مسئولیت‌ها و ساختار تک‌تک فایل‌های اضافه شده به پروژه را با دقت ساختاری بالا تشریح می‌کند.

## فهرست فایل‌های پروژه

| مسیر فایل | مسئولیت اصلی | نوع اجرا / تغییر شِما | وابستگی‌ها |
| :--- | :--- | :--- | :--- |
| `src/db/schema.ts` | تعریف فیزیکی ۳۸ جدول اصلی و فرعی دامنه‌های کاتالوگ، اشتراک‌ها، درگاه‌های پرداخت و لجر اعتباری | تغییر شِما (Write) | Drizzle ORM |
| `src/features/fixtures.ts` | داده‌های آزمایشی قطعی (Deterministic Fixtures) حاوی کدهای خطا، نشت درآمد و چرخه‌های کاتالوگ | فقط خواندنی (Read-Only) | هیچ |
| `src/features/intelligence-engine.ts` | پیاده‌سازی تفصیلی محاسبات تحلیلی، ممیزی‌های لجر، مصالحه تراکنش‌ها و گراف دایره‌ای وابستگی‌ها | دوحالت دیتابیس / درون‌حافظه (Read/Write) | `src/db/schema.ts`, `src/features/fixtures.ts` |
| `src/app/intelligence-lab/actions.ts` | تعریف هوشمند Server Actions در Next.js جهت تراکنش‌های ایمن پایگاه‌داده و اجرای ایزوله کدهای ممیزی | اجرا روی سرور (Server-side API) | `src/features/intelligence-engine.ts` |
| `src/app/intelligence-lab/page.tsx` | پنل کنترل عملیاتی و شبیه‌ساز فارسی و RTL آزمایشگاه هوش داده | کامپوننت تعاملی (Client UI Component) | `src/app/intelligence-lab/actions.ts`, `src/features/fixtures.ts` |
| `src/app/page.tsx` | بازطراحی هوم‌پیج پروژه به عنوان دروازه ورود به سیستم تصمیم‌یار کلاینت | فقط خواندنی (Portal Link) | Next.js Link, Drizzle |
| `MANIFEST.md` | لیست کل فایل‌های تغییریافته و ایجاد شده، به انضمام مسئولیت‌ها و پیوستار اجرایی | سند راهنما | هیچ |
| `README.md` | مستندات استقرار، گام‌های بازرسی، ابزارهای اعتبارسنجی و گایدلاین استارت آپ | سند راهنما | هیچ |
| `docs/capability-map.md` | نگاشت هوش داده‌ای؛ کدام جداول چه تصمیم‌های کلانی را ممکن می‌سازند | سند راهنما | هیچ |
| `docs/formulas-and-kpis.md` | تعریف ریاضی، ابعاد زمانی، واحد ممیزی و محدودیت‌های ممیزی‌های مالی | سند راهنما | هیچ |
| `docs/assumptions-and-limitations.md` | فرضیات محافظه‌کارانه و محدودیت‌های در نظر گرفته شده در پیاده‌سازی | سند راهنما | هیچ |
