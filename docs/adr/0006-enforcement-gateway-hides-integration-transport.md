# اتصال production از طریق API اختصاصی انجام می‌شود

User Application فقط با درگاه اعمال قوانین کار می‌کند و Adapter تولیدی این درگاه از یک API اختصاصی میان دو سیستم استفاده می‌کند. دسترسی مستقیم runtime به دیتابیس مشترک ممنوع است تا credential و schema مدیریتی در User Application منتشر نشود و authorization، validation، rate limiting و audit در یک Interface کنترل‌شده متمرکز بمانند.
