# 🎯 Decision Helper

ابزار مستقل تصمیم‌گیری بر پایه‌ی فایل‌های JSON. مدل (Claude) سوال‌هایش را به‌جای پرسیدن در چت، به‌صورت فایل `pending-<id>.json` در پوشه‌ی `decision-inbox/` می‌نویسد؛ تو با این ابزار همه‌ی فایل‌ها را می‌بینی، یکی را انتخاب می‌کنی، پاسخ می‌دهی و به‌صورت `resolved-<id>.json` (با `status: "resolved"` و پاسخ‌های داخلش) کنار بقیه ذخیره می‌شود تا مدل جواب‌ها را بخواند.

هیچ وابستگی ندارد: یک فایل HTML (UI) + یک فایل سرور Node.

## اجرا

```bash
pnpm decisions
# یا:
node decision-helper/server.mjs
```

مرورگر را باز کن: **http://localhost:4173**

| متغیر محیطی | پیش‌فرض | توضیح |
|---|---|---|
| `PORT` | `4173` | پورت سرور |
| `DECISION_INBOX_DIR` | `<repo>/decision-inbox` | مسیر پوشه‌ی تصمیم‌ها |
| `BRAIN_DUMP_DIR` | `<repo>/brain-dump` | مسیر پوشه‌ی فایل جعبه‌ی ذهن |

## فایل‌ها

```
decision-helper/
  index.html      ← UI (لایت، RTL، بدون کتابخانه)
  server.mjs      ← سرور Node بدون وابستگی (HTTP + API)
  schema.json     ← فرمت رسمی فایل تصمیم
  example/        ← نمونه‌ی فایل در انتظار

decision-inbox/   ← پوشه‌ی داده (تخت): pending-*.json و resolved-*.json
brain-dump/       ← جعبه‌ی ذهن: یک فایل brain-dump.json با آیتم‌های افکار/گره‌های معلق
```

## فرمت فایل

فایل‌های در انتظار: `pending-<id>.json` — بعد از پاسخ، به `resolved-<id>.json` تغییر نام می‌یابد.

```jsonc
{
  "schemaVersion": 1,
  "id": "2026-08-08-auth-approach",      // = slug فایل
  "title": "رویکرد احراز هویت",
  "context": "زمینه‌ی کوتاه (اختیاری)",
  "status": "pending",                    // pending | resolved
  "createdAt": "2026-08-08T10:00:00.000Z",
  "resolvedAt": null,
  "source": "claude",
  "questions": [
    {
      "id": "q1",
      "question": "کدام روش؟",
      "type": "multi-choice",             // choice | multi-choice | text | number
      "options": ["Clerk", "Auth.js", "کاستوم"],  // فقط برای choice / multi-choice
      "required": true,
      "note": "راهنمای اختیاری",
      "answer": null,                     // بعد از resolve پر می‌شود
      "answeredAt": null
    }
  ]
}
```

شکل `answer`: `choice`/`text` → string · `multi-choice` → string[] · `number` → number · بی‌پاسخ → `null`.

## skill مدل

اسکیل `.claude/skills/decision-inbox/SKILL.md` به Claude یاد می‌دهد که موقع نیاز به تصمیم، به‌جای سوال در چت، فایل `pending-*.json` بسازد و بعداً جواب‌ها را از `resolved-*.json` بخواند. بعد از نوشتن فایل، مدل یک خط می‌گوید: «یک فایل تصمیم در انتظار جواب است — `pnpm decisions` را باز کن.»

## API

| Route | توضیح |
|---|---|
| `GET /` | صفحه‌ی UI |
| `GET /api/files` | فهرست فایل‌ها (`{ files, inboxDir }`) |
| `GET /api/files/:id` | محتوای کامل یک فایل |
| `POST /api/files/:id/resolve` | ثبت پاسخ‌ها → نوشتن `resolved-<id>.json` و حذف فایل pending |
| `GET /api/schema` | `schema.json` |
| `GET /api/brain-dump` | فهرست آیتم‌های جعبه‌ی ذهن |
| `POST /api/brain-dump/items` | افزودن آیتم جدید (`{ text }`) |
| `DELETE /api/brain-dump/items/:id` | حذف یک آیتم |

## نکات

- ابزار شخصی و محلی است؛ بدون auth. پورت را فقط برای خودت باز کن.
- فایل‌های `decision-inbox/` در git ثبت می‌شوند (مثل docs)؛ در صورت تمایل می‌توانی آن‌ها را gitignore کنی.
