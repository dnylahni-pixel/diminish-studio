# Diminish Studio — pnpm monorepo

> برنچ کاری: `unified-local-development`

> ⚠️ قبل از هر کاری: [AGENTS.md](AGENTS.md) را کامل بخوان.
> برای هر task مرتبط با UI ادمین جدید، داک‌های `docs/admin-ui-rebuild/` و
> `apps/admin-new/src/components/lab/CONVENTIONS.md` طبق بخش ۴ AGENTS.md
> اجباری است.

نقشه‌ی سریع ریپو برای هر agent/AI: قبل از هر کاری اول همین را بخوان تا بدانی کدام پوشه را بخوانی و کدام را دست نزنی.

## نقشه‌ی ریپو

| مسیر | پکیج | چیست |
|---|---|---|
| `apps/diminish-studio` | `@workspace/diminish-studio` | اپ کاربران: Vite + React 19 (Clerk، PWA) |
| `apps/api-server` | `@workspace/api-server` | بک‌اند کاربران: Express 5 + Drizzle |
| `apps/admin` | `@workspace/admin` | اپ مدیریتی (کنترل‌پلین): Next.js 16 — **تغییرش نیازمند تأیید صریح مالک است** |
| `apps/mockup-sandbox` | `@workspace/mockup-sandbox` | sandbox طراحی UI (ارجاعی، در dev.mjs نیست) |
| `packages/api-client-react` | `@workspace/api-client-react` | client جنریت‌شده‌ی React Query |
| `packages/api-spec` | `@workspace/api-spec` | قرارداد OpenAPI + orval codegen |
| `packages/api-zod` | `@workspace/api-zod` | schema/type جنریت‌شده‌ی zod |
| `packages/db` | `@workspace/db` | schema و migration های Drizzle |
| `scripts/` | `@workspace/scripts` | dev orchestration، post-merge، env-status |
| `docs/` | — | ADRها، معماری، `admin-user-integration` |

## دستورها

- `pnpm dev` — api روی `:3000` + web روی `:5173`
- `pnpm --filter @workspace/admin dev` — ادمین (اپ مستقل Next)
- `pnpm run build` — typecheck + build همه‌چیز **به‌جز** ادمین
- `pnpm --filter @workspace/admin build` — build ادمین
- `pnpm run api:check` — orval codegen + گارد git diff
- `pnpm run typecheck:libs` — `tsc --build` روی پکیج‌ها

## قواعد (guardrails)

- تغییر `apps/admin` مطلقاً ممنوع نیست، اما هر task تغییردهنده‌ی آن نیازمند تأیید صریح مالک محصول است (مستندات [`docs/admin-user-integration/00-INDEX.md`](docs/admin-user-integration/00-INDEX.md)).
- ادمین هنوز Clerk/auth ندارد — `identity-adapter` فعلاً به همه `owner` می‌دهد؛ اتصال auth یک تسک جداگانه است.
- `.env` هرگز commit نمی‌شود؛ اسرار در `.env.local` ریشه و `apps/admin/.env` هستند (هر دو ignore شده‌اند).
- ایمپورت بین‌پکیجی فقط با نام `@workspace/*` (هرگز مسیر نسبی `../`). بعد از تغییر OpenAPI، client ها را با `pnpm run api:codegen` بازتولید کن.
- ماژول‌های native (مثل `better-sqlite3`) باید به `onlyBuiltDependencies` در `pnpm-workspace.yaml` اضافه شوند وگرنه pnpm اسکریپت build آن‌ها را بلاک می‌کند.
- کد جنریت‌شده (`packages/*/src/generated`) دستی ویرایش نمی‌شود.
- **قانون طلایی کنترل رفتار:** هر دکمه/پیام/مسیر/عدد/سوییچ جدید باید کد پایدار داشته
  باشد و از کاتالوگ «کنترل رفتار» خوانده شود؛ hardcode ممنوع است (به‌جز اسرار و امنیت).
- UI ادمین جدید با **BEUI** ساخته می‌شود (نه Appica): `apps/admin-new/src/components/beui/`
  + مستندات beui.dev / MCP beui.
