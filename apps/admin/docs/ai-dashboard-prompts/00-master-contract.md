# Master Contract

## Product

Diminish Super Admin یک Control Plane تجاری برای مدیریت کاربران، پلن‌ها، اشتراک‌ها، اعتبار، مصرف و پرداخت است؛ نه پنل مدیریت محتوای موسیقی.

## Stack

- Next.js `16.2.11` با App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- Drizzle ORM + Neon
- UI primitives موجود در `src/components/ui`
- Design tokens موجود در `src/app/globals.css`

## Architecture

- Page و Layout به‌صورت Server Component باقی بمانند مگر واقعاً interaction لازم باشد.
- فقط leaf component تعاملی `"use client"` بگیرد.
- Queryها در `src/features/<domain>/queries.ts` و typeها در `types.ts` قرار بگیرند.
- Client Component هرگز `db` یا schema سرور را import نکند.
- Filter، Sort و Pagination در URL search params ذخیره شوند.
- در Next 16، `params` و `searchParams` را Promise در نظر بگیر.
- هر route باید loading، empty و error state واقعی داشته باشد.

## Visual Language

- UI انگلیسی و LTR باقی بماند.
- Sidebar و Header فعلی baseline هستند و نباید سلیقه‌ای بازطراحی شوند.
- محتوای صفحه fluid، با padding برابر `24px` و فاصله عمودی `24px` باشد.
- کارت‌ها کم، هدفمند و هم‌ارتفاع باشند.
- رنگ Primary فقط برای active state و primary action استفاده شود.
- از gradient، glassmorphism، نمودار تزئینی و رنگ‌های زیاد استفاده نشود.
- عددها tabular، statusها semantic و متن‌های کم‌اهمیت neutral باشند.

## Component Recipes

- KPI: `Card` + `Text` + `NumericText` + `Badge` + در صورت نیاز `Sparkline`
- Toolbar: `SearchInput` + `Select`/`MultiSelect` + `DateRangePicker` + `Button`
- Table: `DataTable` + `Pagination` + `DropdownMenu`
- Detail header: `Heading` + `Text` + `StatusIndicator` + `Button`/`SplitButton`
- Detail sections: `Tabs` + `Card` + `DescriptionList`
- Event history: `Timeline`
- Filter panel: `Drawer`
- Confirmation خطرناک: `AlertDialog`
- Async state: `Skeleton`، `LoadingState`، `EmptyState`، `ErrorState`
- هشدار درون صفحه: `Alert` یا `Banner`

## Data Rules

- هیچ mock، random number یا fake trend در نسخه متصل به دیتابیس نمایش داده نشود.
- صفر داده باید Empty State حرفه‌ای تولید کند، نه نمودار جعلی.
- مبلغ‌ها minor unit هستند؛ با currency format شوند و currencyهای مختلف با هم جمع نشوند.
- مقدارهای `bigint` در مرز Server/Client به string امن تبدیل شوند.
- برای trend مصرف از `usage_daily_aggregates` استفاده شود، نه scan روی `usage_events`.
- Queryها باید aggregate و paginated باشند و N+1 تولید نکنند.
- timestamp با timezone به timezone کاربر نمایش داده شود؛ relative time همراه tooltip تاریخ دقیق.

## Status Tones

- active / paid / succeeded / published / confirmed: `success`
- trialing / scheduled / pending / draft: `info`
- past_due / expiring / paused / partially_refunded: `warning`
- canceled / failed / void / expired / suspended / uncollectible: `danger`
- archived / inactive / closed: `neutral`

## Output Contract For Every Model

- سؤال نپرس؛ با فرض‌های محافظه‌کارانه کار را کامل کن.
- فقط فایل‌های مجاز Prompt را تغییر بده.
- کد ناقص، placeholder، TODO و pseudo-code تحویل نده.
- dependency جدید نصب نکن.
- اگر دسترسی به repo نداری، محتوای کامل هر فایل را بده، نه diff.
- در پایان فهرست فایل‌ها، تصمیم‌های مهم و commandهای validation را کوتاه بنویس.
