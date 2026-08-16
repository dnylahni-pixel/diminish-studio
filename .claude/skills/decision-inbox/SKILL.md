---
name: decision-inbox
description: >-
  وقتی برای ادامه‌ی کار (مثلاً موقع پلن‌ریزی) به تصمیم یا پاسخ مالک نیاز داری، به‌جای پرسیدن در چت،
  یک فایل JSON در `decision-inbox/pending-*.json` بنویس؛ بعد از اینکه مالک با ابزار Decision Helper
  پاسخ داد، جواب‌ها را از `decision-inbox/resolved-*.json` بخوان و با آن ادامه بده.
  همچنین وقتی به تصمیم‌های از‌قبل‌گرفته‌شده نیاز داری، اول فایل‌های `resolved-*.json` را چک کن.
---

# تصمیم‌گیری مبتنی بر فایل (Decision Inbox)

به‌جای قطع کردن جریان چت با سوال، تصمیم‌های در انتظار را به‌صورت فایل JSON در پوشه‌ی `decision-inbox/` بنویس.
مالک بعداً با ابزار `decision-helper/` (اجرا: `pnpm decisions` → http://localhost:4173) آن‌ها را باز می‌کند، پاسخ می‌دهد و فایل به‌صورت `resolved-<id>.json` ذخیره می‌شود.

## جریان کار

1. **اول بخوان:** قبل از نوشتن هر تصمیم، چک کن تصمیم مشابهی از قبل هست:
   - `decision-inbox/resolved-*.json` → تصمیم‌های از‌قبلی‌گرفته‌شده (جواب‌ها داخل `questions[].answer` است).
   - `decision-inbox/pending-*.json` → تصمیمِ در انتظار که مالک هنوز جواب نداده.
   - اگر تصمیمِ مرتبط از قبل حل شده یا هنوز در انتظار است، **تکراری ننویس**؛ اگر pending است، به کاربر یادآوری کن که جوابش منتظر است.
2. **اگر تصمیم لازم بود و وجود ندارد:** یک فایل `decision-inbox/pending-<slug>.json` بساز (slug = نام کوتاه کباب‌کیس، یکتا، مثل `plan-auth-approach`).
3. **یک خط به کاربر بگو** که فایلی در انتظار جواب است و با `pnpm decisions` می‌تواند پاسخ دهد — سوال را در چت تکرار نکن.
4. **بعداً بخوان:** وقتی بعداً دوباره همان موضوع را پیش بردی، `decision-inbox/resolved-<slug>.json` را بخوان و با پاسخ‌ها ادامه بده.

## فرمت فایل (مطابق `decision-helper/schema.json`)

```jsonc
{
  "schemaVersion": 1,
  "id": "plan-auth-approach",          // = slug؛ باید با نام فایل یکی باشد: pending-plan-auth-approach.json
  "title": "رویکرد احراز هویت",
  "context": "زمینه‌ی کوتاه — چه چیزی تصمیم گرفته می‌شود و چرا",   // اختیاری
  "status": "pending",
  "createdAt": "<ایزو-UTC کنونی>",
  "resolvedAt": null,
  "source": "claude",
  "questions": [
    {
      "id": "method",
      "question": "کدام روش auth را انتخاب می‌کنیم؟",
      "type": "multi-choice",          // choice | multi-choice | text | number
      "options": ["Clerk", "Auth.js", "کاستوم"],   // فقط برای choice / multi-choice
      "required": true,
      "note": "می‌توانی چند گزینه انتخاب کنی",       // اختیاری
      "answer": null,
      "answeredAt": null
    },
    {
      "id": "why",
      "question": "توضیح کوتاهی درباره‌ی دلیل انتخاب بنویس.",
      "type": "text",
      "required": false,
      "answer": null,
      "answeredAt": null,
      "explanation": null
    }
  ]
}
```

فایل را با indent دو فاصله و `\n` بنویس؛ `createdAt` به‌صورت ISO 8601 (UTC).

> ابزار Decision Helper برای **هر سوال** یک فیلد «توضیح» (اختیاری) نشان می‌دهد؛ کاربر می‌تواند دلیل انتخابش را بنویسد. در فایل `resolved-*.json` این توضیح در `questions[].explanation` ذخیره می‌شود — هنگام خواندن جواب‌ها حتماً آن را هم در نظر بگیر (معمولاً دلیلِ تصمیم همین‌جاست).

## قواعد پرسیدن خوب

- **تعداد کم:** حداکثر ۵ سوال؛ فقط چیزهایی که واقعاً مسیر را عوض می‌کنند.
- **عینی و مجزا:** گزینه‌ها هم‌پوشان نباشند و یک‌معنی‌بده باشند.
- **نوع درست:** «چند مورد را می‌توان انتخاب کرد» → `multi-choice` · «فقط یکی» → `choice` · «توضیح/نظر آزاد» → `text` · «مقدار عددی» → `number`.
- `required: true` را فقط وقتی بگذار که واقعاً بدون آن نمی‌توانی ادامه بدهی.
- اگر به «چرا» نیاز داری، یک سوال `text` کنار انتخاب اضافه کن.
- برای `choice`/`multi-choice`، کاربر فقط از بین `options` می‌تواند انتخاب کند؛ اگر احتمال پاسخِ خارج از گزینه‌ها هست، یک سوال `text` جدا بگذار یا گزینه را اضافه کن.
