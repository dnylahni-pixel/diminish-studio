# گزارش ارزیابی امنیتی — Diminish Studio

**تاریخ:** ۲۰۲۶-۰۸-۰۸
**نوع ارزیابی:** White-box (بررسی کامل کد + اجرای زنده و اعتبارسنجی پویا)
**چارچوب:** OWASP WSTG

---

## ۱) خلاصه مدیریتی

| # | یافته | شدت | CVSS | نوع |
|---|---|---|---|---|
| ۱ | نبود احراز هویت و کنترل مالکیت در `/api/learning/*` | Medium | 6.5 | پویا (PoC زنده) |
| ۲ | نبود احراز هویت در پنل‌های ادمین (`apps/admin` و `apps/admin-new`) | High | 8.2 | پویا (PoC زنده) |
| ۳ | CVE-2026-42349 در `@clerk/clerk-react@5.61.3` | High | 8.1 | وابستگی (SCA) |
| ۴ | CVE-2026-53571 در `vite@7.3.3` (سرور توسعه، ویندوز) | High | 7.5 | وابستگی (SCA) |
| ۵ | CVE-2026-53632 در `vite@7.3.3` (افشای هش NTLMv2، ویندوز) | Medium | 5.5 | وابستگی (SCA) |

**ریسک کلی: بالا.** پنل‌های مدیریتی بدون هیچ ورودی در دسترس هستند و فهرست واقعی کاربران (نام، ایمیل، شناسه) را افشا می‌کنند؛ API یادگیری بدون احراز هویت قابل خواندن/نوشتن/دستکاری است؛ و سه CVE تأییدشده در وابستگی‌ها وجود دارد.

---

## ۲) یافته ۱ — نبود احراز هویت و کنترل مالکیت در `/api/learning/*`

**شدت:** Medium — **CVSS:** 6.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N`) — **CWE-306**

**فایل:** `apps/api-server/src/routes/learning.ts`
**مسیرها:** `GET/POST /api/learning/sessions`، `POST /api/learning/sessions/:id/attempt`، `GET /api/learning/mastered-chords`

### علت ریشه‌ای
هر چهار هندلر بدون `getAuth()` ثبت شده‌اند و همه‌ی کوئری‌ها از ثابت هاردکد `DEMO_USER_ID = 1` استفاده می‌کنند. هندلر attempt نیز `parseInt(req.params.id)` را بدون هیچ بررسی مالکیت می‌پذیرد.

### شواهد (تست زنده روی سرور توسعه — بدون هیچ هدر Authorization)
```text
GET /api/learning/sessions
→ 200  | x-clerk-auth-status: signed-out | []

POST /api/learning/sessions   {"chordName":"AUTHZ-TEST-S3MJW8","instrument":"guitar"}
→ 201  | {"id":1,"userId":1,"chordName":"AUTHZ-TEST-S3MJW8",...,"attemptsCount":0,"successCount":0}

POST /api/learning/sessions/1/attempt   {"success":true,"confidenceScore":0.9}
→ 200  | {"id":1,"sessionId":1,"success":true,"confidenceScore":0.9}

GET /api/learning/sessions (بعد از ۳ تلاش بدون ورود روی session id=1)
→ 200  | {"id":1,"userId":1,...,"attemptsCount":3,"successCount":2}
```

سطرهای تستی پس از آزمون از دیتابیس توسعه پاک‌سازی شدند.

### راه‌حل (کد پیشنهادی)

**۱) ایمپورت‌ها و حذف `DEMO_USER_ID` (خطوط ۱–۹):**
```typescript
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { learningSessionsTable, chordAttemptsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { sendError } from "../lib/http-errors";
import { getOrCreateUser } from "../lib/user-utils";

const router = Router();
```

**۲) `GET /sessions` (خطوط ۱۱–۱۳):**
```typescript
router.get("/sessions", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const user = await getOrCreateUser(clerkUserId);
    const sessions = await db.select().from(learningSessionsTable).where(eq(learningSessionsTable.userId, user.id));
```

**۳) `POST /sessions` (خطوط ۲۸–۳۲):**
```typescript
router.post("/sessions", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const user = await getOrCreateUser(clerkUserId);
    const { chordName, instrument } = req.body;
    const [session] = await db.insert(learningSessionsTable).values({
      userId: user.id,
```

**۴) `POST /sessions/:id/attempt` — افزودن بررسی مالکیت (خطوط ۵۳–۶۳):**
```typescript
router.post("/sessions/:id/attempt", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const user = await getOrCreateUser(clerkUserId);
    const id = parseInt(req.params.id);
    const { success, confidenceScore } = req.body;

    // Ownership check: only the session owner may submit attempts
    const [existing] = await db.select().from(learningSessionsTable).where(eq(learningSessionsTable.id, id));
    if (!existing || existing.userId !== user.id) {
      return sendError(res, 404, "LEARNING_SESSION_NOT_FOUND", "Session not found");
    }

    // Insert attempt
    const [attempt] = await db.insert(chordAttemptsTable).values({
      sessionId: id,
      success,
      confidenceScore,
    }).returning();
```

**۵) `GET /mastered-chords` (خطوط ۹۱–۹۵):**
```typescript
router.get("/mastered-chords", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const user = await getOrCreateUser(clerkUserId);
    const sessions = await db.select().from(learningSessionsTable).where(
      and(eq(learningSessionsTable.userId, user.id), eq(learningSessionsTable.mastered, true))
    );
```

---

## ۳) یافته ۲ — نبود احراز هویت در پنل‌های ادمین

**شدت:** High — **CVSS:** 8.2 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N`) — **CWE-306**

**فایل‌ها:** `apps/admin` و `apps/admin-new`
**مسیرها:** `/en`، `/en/users`، `/en/plans`، `/en/features`، `/api/integrations/runpod/*` (ادمین)؛ `/`، `/features`، `/behavior`، `/lab` (ادمین جدید)

### علت ریشه‌ای
هیچ‌کدام از دو اپ ادمین احراز هویت ندارند: `identity-adapter` در `apps/admin/src/integrations/runpod/server/identity-adapter.ts:30-31` به **هر** درخواست نقش `owner` می‌دهد؛ هیچ `middleware.ts`، گارد layout یا صفحه‌ی ورود وجود ندارد؛ server action های ادمین جدید (`settings/actions.ts` و...) بدون گارد هستند و `SETTINGS_ACTOR = "owner"` را هاردکد کرده‌اند.

### شواهد (تست زنده — بدون کوکی و بدون هدر Authorization)
```text
GET /en/users    → 200  Set-Cookie: (none)
GET /en          → 200  Set-Cookie: (none)
GET /en/plans    → 200  Set-Cookie: (none)
GET /en/features → 200  Set-Cookie: (none)
GET / (admin-new)→ 200  Set-Cookie: (none)
GET /features    → 200  Set-Cookie: (none)
```

فهرست واقعی کاربران در پاسخ بدون ورود `/en/users`:
```html
<a href="/en/users/2">daniel.ahani2731</a>
<p>daniel.ahani2731@gmail.com</p>
{"id":2,"username":"daniel.ahani2731","email":"daniel.ahani2731@gmail.com","createdAt":"2026-07-22T12:02:13.823Z",...}
{"id":...,"username":"dnylahni","email":"dnylahni@gmail.com",...}
```

### راه‌حل (کد پیشنهادی)

> ⚠️ طبق `CLAUDE.md`، تغییرات `apps/admin` نیازمند **تأیید صریح مالک محصول** است.

**۱) جایگزینی stub «همیشه owner» در `apps/admin/src/integrations/runpod/server/identity-adapter.ts` (خطوط ۳۰–۳۱):**
```typescript
export async function resolveRunpodPolicyContext(): Promise<RunpodPolicyContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new RunpodApiError({
      category: "unauthenticated",
      message: "Authentication required",
      httpStatus: 401,
    });
  }
  return { actorId: userId, role: "owner" };
}
```

**۲) ایمپورت‌های لازم (خطوط ۱–۲ همان فایل):**
```typescript
import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { RunpodPolicyContext } from "./policy";
import { RunpodApiError } from "./errors";
```

**۳) گارد layout ادمین — `apps/admin/src/app/(admin)/layout.tsx` (خطوط ۱–۱۰):**
```typescript
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AdminShell>{children}</AdminShell>;
}
```

**۴) گارد layout ادمین جدید — `apps/admin-new/src/app/(admin)/layout.tsx` (خطوط ۱–۶):**
```typescript
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/shell/admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AdminShell>{children}</AdminShell>;
}
```

**۵) افزودن وابستگی `@clerk/nextjs` به `apps/admin-new/package.json` (خط ۱۴):**
```json
{
  "dependencies": {
    "@clerk/nextjs": "^7.6.0",
    "@neondatabase/serverless": "^1.1.0"
  }
}
```

**۶) بازگرداندن وضعیت صحیح خطا در `apps/admin/src/app/api/integrations/runpod/billing-reports/route.ts` (خطوط ۴۴–۴۹):**
```typescript
if (error instanceof RunpodApiError) {
  return NextResponse.json(
    { ok: false, error: { message: error.message, category: error.category } },
    { status: error.httpStatus ?? 500 },
  );
}
```

**اقدامات تکمیلی (پیشنهادی در تغییر بعدی):**
- افزودن `middleware.ts` با `clerkMiddleware()` و matcher محافظ برای هر دو اپ (دفاع لایه‌ای).
- گاردگذاری تک‌تک server action ها در `apps/admin-new/src/features/*/actions.ts` با `auth()` و استخراج بازیگر حسابرسی از نشست به‌جای ثابت `owner`.
- همان گارد برای `/api/integrations/runpod/connection-status`.
- جایگزینی `role: "owner"` با جستجوی واقعی نقش ادمین پس از فراهم‌شدن منبع نقش.

---

## ۴) یافته‌های وابستگی (SCA)

### ۴-۱) CVE-2026-42349 — `@clerk/clerk-react@5.61.3`

**شدت:** High — **CVSS:** 8.1 — **CWE-863**

**توضیح:** دور زدن مجوز (authorization bypass) در SDK رسمی Clerk هنگام ترکیب بررسی‌های سازمان/صورتحساب/بازتأیید. محدوده‌ی آسیب‌پذیر `>= 5.9.0, <= 5.61.5`؛ وصله در `5.61.6`.

**استفاده در کد:** مستقیم — `ClerkProvider` (main.tsx:3)، `useAuth` (App.tsx:6)، `SignIn`/`SignUp` (login.tsx:1، register.tsx:1). API آسیب‌پذیر خاص (سازمان/بازتأیید) در کد برنامه یافت نشد؛ بنابراین مسیر بهره‌برداری ممکن است در امکانات فعلی قابل دسترس نباشد.

**راه‌حل:** ارتقای `@clerk/clerk-react` به `>= 5.61.6` در `apps/diminish-studio/package.json` و اجرای `pnpm install`.

### ۴-۲) CVE-2026-53571 — `vite@7.3.3` (سرور توسعه، ویندوز)

**شدت:** High — **CVSS:** 7.5 — **CWE-22**

**توضیح:** دور زدن `server.fs.deny` از طریق مسیرهای جایگزین ویندوز در سرور توسعه‌ی Vite؛ امکان خواندن فایل دلخواه (شامل فایل‌های env محلی) توسط وب‌سایت مخرب. محدوده‌ی آسیب‌پذیر `>= 7.0.0, <= 7.3.4`؛ وصله در `7.3.5`.

**اعلام از طریق:** کاتالوگ `vite: ^7.3.2` در `pnpm-workspace.yaml:30` → `vite@7.3.3` در `pnpm-lock.yaml:6628`؛ مصرف‌کننده‌ها: `apps/diminish-studio` و `apps/mockup-sandbox`.

**راه‌حل:** ارتقای `vite` به `>= 7.3.5` در کاتالوگ `pnpm-workspace.yaml` و اجرای `pnpm install`. (محیط‌های لینوکس و build تولیدی در امان‌اند؛ فقط توسعه‌ی محلی ویندوز آسیب‌پذیر است.)

### ۴-۳) CVE-2026-53632 — `vite@7.3.3` (افشای هش NTLMv2، ویندوز)

**شدت:** Medium — **CVSS:** 5.5 — **CWE:** (طبق advisory)

**توضیح:** افشای هش NTLMv2 از طریق مسیر UNC در کامپوننت `launch-editor` سرور توسعه‌ی Vite؛ نیازمند تعامل کاربر و ویندوز. وصله در `vite@7.3.5` / `launch-editor@2.14.1`.

**راه‌حل:** همان ارتقای `vite` به `>= 7.3.5` (یا pin کردن `launch-editor >= 2.14.1` با override).

---

## ۵) مشاهدات تکمیلی (پیشنهاد اصلاح — بدون تأثیر مستقیم اثبات‌شده)

1. **CORS باز:** `app.use(cors())` در `apps/api-server/src/app.ts` → پاسخ همه‌ی APIها `Access-Control-Allow-Origin: *` برمی‌گرداند (بدون `Allow-Credentials`، لذا ریسک محدود). پیشنهاد: محدودسازی به allowlist دامنه‌ی فرانت.
2. **`PATCH /users/me` بدون اعتبارسنجی ورودی:** در `apps/api-server/src/routes/users.ts` مستقیم از `req.body` مقدار می‌گیرد؛ برخورد نام کاربری تکراری → 500. پیشنهاد: اعتبارسنجی zod + بازگرداندن 409.
3. **URLهای قابل پیش‌بینی فایل‌های آپلودی:** کلید `songs/<userId>/<songId>.<ext>` با شناسه‌های ترتیبی و URL دائمی بدون امضا. پیشنهاد: بررسی عمومی‌نبودن باکت B2 و در صورت نیاز خصوصی‌سازی + URL امضا‌شده.
4. **نبود Row-Level Security:** جداسازی داده‌ها فقط در لایه‌ی اپلیکیشن است. پیشنهاد: RLS به‌عنوان لایه‌ی دفاعی دوم.
5. **نبود rate limiting سراسری و هدرهای امنیتی** در بک‌اند API.
6. **هدر `Authorization` خراب → 500:** میان‌افزار Clerk به‌جای 401 خطای 500 برمی‌گرداند (مشاهده‌شده حین تست). پیشنهاد: اصلاح مدیریت خطا.
7. **json5@1.0.2 / CVE-2022-46175:** مثبت کاذب — نسخه‌ی 1.0.2 نسخه‌ی وصله‌شده‌ی خط 1.x است (آسیب‌پذیر: `<=1.0.1` و `2.0.0–2.2.1`)؛ نیازی به اقدام نیست.

---

## ۶) برنامه‌ی اقدام پیشنهادی

**فوری:**
1. سیم‌کشی Clerk در هر دو پنل ادمین (یافته ۲) — پس از تأیید صریح شما برای `apps/admin`.
2. افزودن `getAuth()` + بررسی مالکیت به چهار route یادگیری (یافته ۱).

**کوتاه‌مدت:**
3. ارتقای `@clerk/clerk-react` به `>= 5.61.6` و `vite` به `>= 7.3.5`.
4. محدودسازی CORS به allowlist.
5. اعتبارسنجی zod برای `PATCH /users/me`.
6. بررسی ACL باکت B2.

**میان‌مدت:**
7. RLS در دیتابیس؛ rate limiting سراسری؛ هدرهای امنیتی (helmet)؛ مدل نقش واحد (RBAC).

**بازآزمایی:** پس از اعمال اصلاحات — تست بدون ورود صفحات ادمین و API یادگیری (باید 401/403 بدهد)، تست مالکیت جلسات، بررسی هدرهای CORS و نسخه‌های وابستگی‌ها.