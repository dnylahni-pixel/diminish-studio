# API Runtime Semantics

> وضعیت: تصمیم تثبیت‌شده پیش از همگام‌سازی OpenAPI
>
> تاریخ: `2026-07-29`

## Songs

- `GET /api/songs` فقط catalog منتشرشده را برمی‌گرداند.
- `GET /api/songs/:id` برای song منتشرشده عمومی است.
- song منتشرنشده فقط برای مالک احراز هویت‌شده قابل مشاهده است.
- برای جلوگیری از افشای وجود resource، دسترسی غیرمالک به song خصوصی پاسخ `404` می‌گیرد.

## Song Details

- `GET /api/song-details/:id` aggregate موردنیاز Player را برمی‌گرداند.
- شامل metadata، analysis timeline، stems و URL امضاشده کوتاه‌عمر master track است.
- song منتشرشده عمومی و song منتشرنشده فقط برای مالک قابل خواندن است.
- URL امضاشده در دیتابیس ذخیره نمی‌شود.

## Analyze

- `POST /api/songs/:id/analyze` فقط برای کاربر احراز هویت‌شده و مالک song مجاز است.
- نبود RunPod باید قبل از تغییر state یا تماس خارجی با `503` پاسخ داده شود.
- operation وضعیت analysis را `processing` و سپس `completed` یا `error` می‌کند.
- usage/entitlement enforcement در فاز امنیت تکمیل می‌شود.

## Upload

- `POST /api/uploads/presign` فقط URL قرنطینه می‌سازد و row دیتابیس ایجاد نمی‌کند.
- `POST /api/uploads/confirm` وجود، size و magic bytes را بررسی می‌کند؛ سپس song مالک‌شده را ایجاد و object را به مسیر دائمی منتقل می‌کند.
- `DELETE /api/uploads/:uploadToken/:ext` فقط object قرنطینه همان کاربر را cancel می‌کند.
- quota قبل از presign و دوباره هنگام confirm کنترل می‌شود.

## Library

- Library فعلی collection جداگانه نیست؛ فهرست uploadهای مالک‌شده کاربر است.
- `DELETE /api/library/:songId` حذف دائمی upload مالک‌شده، analysis، stems و objectهای storage است.
- این operation storage quota را آزاد می‌کند و detach ساده نیست.
- جدول قدیمی `library` در runtime فعلی منبع این صفحه نیست.

## Legacy

- `/api/songs/process*` runtime واقعی ندارد و حذف شده است؛ Analyze مسیر پردازش فعال است.
- `/api/users/register` و `/api/users/login` حذف شده‌اند؛ signup/signin فقط از Clerk انجام می‌شود.

## Error Contract

خطاهای HTTP باید envelope زیر را حفظ کنند:

```json
{
  "error": "Human-readable message",
  "code": "STABLE_MACHINE_CODE",
  "details": {}
}
```

`details` اختیاری است. پاسخ نباید stack، secret، provider credential یا متن خام حساس provider را برگرداند.
