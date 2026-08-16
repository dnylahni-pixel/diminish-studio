# چک‌پوینت دوزبانه‌سازی ادمین (fa/en) — برای ادامه از اینجا

> آخرین به‌روزرسانی: 2026-08-04 — **اپ در حال اجراست**
> مسیر پروژه: `/home/danial/diminish all project/diminish-studio` — برنچ `unified-local-development`
> ران: `pnpm --filter @workspace/admin dev -p 4000` → http://localhost:4000

## ⚡ معماری (مهم — تغییر کرد)

**معماری نهایی: rewrite-based، نه سگمنت `[lang]`** (چون حرکت فولدر با Bash مسدود شده بود):

- `src/proxy.ts` — لوکال از کوکی `locale` → بعد `Accept-Language` → پیش‌فرض `en`. مسیر بدون لوکال → **ریدایرکت** به `/en`/`/fa`؛ مسیر لوکال‌دار → **rewrite** به مسیر بدون لوکال + ست کوکی.
- `src/app/layout.tsx` — ریشه‌لِی‌اوت، لوکال را از کوکی می‌خواند (`resolveLocale`)، `<html lang dir>` + فونت‌ها + `I18nProvider` + `generateMetadata`.
- `src/app/[lang]/layout.tsx` — **پاس‌ترو بی‌اثر** (سگمنت `[lang]` نگه داشته شده تا URL ها معتبر بمانند، رندر نمی‌کند).
- `src/i18n/server.ts` — `getServerLocale()` و `getServerI18n()` (لوکال از کوکی). صفحه‌های سرور باید از این‌ها استفاده کنند، **نه** `params.lang`.
- `usePathname()` در کلاینت مسیر بدون لوکال برمی‌گرداند (چون rewrite شده) → `usePathnameWithoutLocale()` بی‌اثر ولی بی‌ضرر؛ `LocalizedLink`/`localePrefix` هنوز پیشوند `/en`-`/fa` می‌سازند که proxy rewrite می‌کند.

## ✅ وضعیت فعلی (تست‌شده — اپ کار می‌کند)

- **زیرساخت i18n کامل:** `src/i18n/{config,translate,server,client}` + `src/proxy.ts` + فونت Vazirmatn + `[dir="rtl"]` در `globals.css`
- **شل/ناوبری ترجمه‌شده:** `admin-shell`، `runpod-sub-nav`، `navigation` (Pagination/CommandMenu prop دار)، `feedback`
- **JSON مرج‌شده (en+fa):** `meta`، `common`، `nav`، `ui`، `runpod.nav`، `overview`، `plans`، `features`، `users`
- **تست runtime:** `/` → 307 به `/en`؛ `/en` → `lang="en" dir="ltr"`؛ `/fa` → `lang="fa" dir="rtl"`؛ صفحات overview/users/plans/features/runpod همه 200؛ عنوان‌ها ترجمه‌شده رندر می‌شوند (مثلاً `/fa/features` → «کاتالوگ قابلیت‌ها»)
- **۹ صفحه‌ی سرور فیکس‌شده:** `params.lang` → `getServerI18n()` (overview، features، runpod/* ، pods/[podId]، network-volumes/[volumeId])

## ⏳ باقی‌مانده

1. **JSON بخش Runpod — بازسازی لازم است.** عامل‌های runpod وسط کار قطع شدند و فایل‌های خروجی‌شان پاک شد → گزارش EN/FA از بین رفته. کدهای تبدیل‌شده کلیدهای `runpod.*` را دارند ولی متن اصلی انگلیسی فقط در نسخه‌های مرجعِ `apps/admin/docs/Sonnet` و `apps/admin/docs/Flsh` موجود است. روش: کلیدهای استفاده‌شده را `grep` کن، متن انگلیسی را از نسخه‌های مرجع بردار، فارسی بنویس، زیر `runpod` مرج کن. (کلیدهای موجود: `runpod.overview.*`، `runpod.common.*`، `runpod.pods.*`، `runpod.endpoints.*`، `runpod.networkVolumes.*`، `runpod.templates.*`، `runpod.registryAuths.*`، `runpod.reports.*`، `runpod.activity.*`، `runpod.settings.*`)
2. **Users ناقص:** `users-filters.tsx` و `user-detail.tsx` هنوز انگلیسی هاردکدند (نه crash، فقط ترجمه‌نشده). `user-detail` کامپوننت سرور است — اگر ترجمه شد از `getServerI18n()` استفاده کند.
3. **UI-primitives هنوز ترجمه نشده:** `components/ui/*` (به جز navigation/feedback که تمام‌اند) — date-time، inputs، select-combobox، overlay (Drawer/پایپ)، actions، data-display، file-upload، form-controls، layout، typography، charts. بیشتر این‌ها prop محورند (نمی‌شود hook زد) → prop با پیش‌فرض انگلیسی.
4. **templates/[templateId]/page.tsx و endpoints/[endpointId]/page.tsx** — هنوز انگلیسی (ترجمه نشده).
5. **sweep نهایی RTL** و **typecheck/build** — هنوز اجرا نشده.

## دستورها

- ران dev: `pnpm --filter @workspace/admin dev -p 4000` (لاگ: فایل خروجی task)
- typecheck: `pnpm --filter @workspace/admin typecheck`
- build: `pnpm --filter @workspace/admin build`

## مشخصات API (برای ادامه)

```ts
// کلاینت:
import { useI18n, LocalizedLink, useLocale, usePathnameWithoutLocale } from "@/i18n/client";
const { t, locale } = useI18n();
t("overview.title");
<LocalizedLink href="/users">…</LocalizedLink>
router.push(localePrefix(locale, "/plans"));   // localePrefix از "@/i18n/config"

// سرور (صفحه‌ی بدون [lang]):
import { getServerI18n } from "@/i18n/server";
const i18n = await getServerI18n();            // i18n.t / i18n.locale / i18n.dir
```

قوانین: ترجمه‌ی همه‌ی رشته‌های UI؛ `Intl.*("en-US")` دست نمی‌خورد؛ RTL: `ml→ms، mr→me، pl→ps، pr→pe، text-left→text-start، text-right→text-end، left-*→start-*، right-*→end-*، border-l/r→border-s/e، rounded-l/r→rounded-s/e` (سانترینگ `left-1/2 -translate-x-1/2` دست نمی‌خورد). فارسی رسمی با «شما».

## فایل‌هایی که دست نزن
`src/messages/*.json` (مرج مرکزی)، `src/i18n/*`، `src/proxy.ts`، `src/app/layout.tsx`، `src/app/[lang]/*`، `contract.ts` (تمام‌اند).
