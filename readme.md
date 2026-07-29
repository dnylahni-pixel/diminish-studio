# Diminish Studio

## اجرای لوکال

از ریشه پروژه فقط این فرمان را اجرا کنید:

```bash
pnpm dev
```

نسخه هدف runtime در `.node-version` برابر Node.js 22 است.

سپس:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/api/healthz`
- Dependency readiness: `http://localhost:3000/api/readyz`

تغییرات Frontend با HMR فوراً در مرورگر دیده می‌شوند و تغییرات Backend باعث restart خودکار می‌شوند.

برای مشاهده وضعیت sanitized محیط بدون نمایش secret:

```bash
pnpm env:status
```

## اتصال‌های محیط لوکال

- Frontend لوکال به Backend لوکال روی port `3000` وصل می‌شود.
- Backend لوکال مستقیماً به Neon تعریف‌شده در `.env.local` وصل می‌شود.
- Render و Vercel در اجرای لوکال استفاده نمی‌شوند.
- `.env.local` secret دارد، gitignored است و نباید commit شود.
- migration هنگام `pnpm dev` خودکار اجرا نمی‌شود.

## دیتابیس

اتصال توسعه read/write است و برنامه می‌تواند داده بخواند و بنویسد. تغییر schema باید با فرمان migration صریح و پس از بررسی migration انجام شود، نه هنگام هر بار start شدن برنامه.
