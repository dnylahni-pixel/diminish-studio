// i18n برای صفحه «کنترل رفتار» (fa / en).

export type BehaviorKey =
  | "page.title"
  | "page.subtitle"
  | "page.badgeDraft"
  | "page.badgeNotConnected"
  | "page.badgeLive"
  | "banner.title"
  | "banner.body"
  | "flags.title"
  | "flags.description"
  | "flags.active"
  | "flags.inactive"
  | "flags.kindBoolean"
  | "flags.kindMetered"
  | "flags.kindQuota"
  | "flags.kindPackage"
  | "flags.accessAllow"
  | "flags.accessDeny"
  | "flags.empty"
  | "settings.title"
  | "settings.description"
  | "content.title"
  | "content.description"
  | "routes.title"
  | "routes.description"
  | "integrations.title"
  | "integrations.description"
  | "publish.title"
  | "publish.description"
  | "publish.draftVersion"
  | "publish.publishedVersion"
  | "publish.none"
  | "publish.button"
  | "publish.rollback"
  | "publish.notReady"
  | "table.colCode"
  | "table.colValue"
  | "table.colLayer"
  | "table.colStatus"
  | "table.colName"
  | "table.colKind"
  | "table.colDefaultAccess"
  | "table.colActions"
  | "lock.action.lock"
  | "lock.action.unlock"
  | "staged.pending"
  | "staged.apply"
  | "staged.applying"
  | "staged.discard"
  | "staged.applied"
  | "staged.failed"
  | "staged.invalid"
  | "status.hardcoded"
  | "status.scheduled"
  | "status.connected"
  | "layer.be"
  | "layer.fe"
  | "layer.db";

const fa: Record<BehaviorKey, string> = {
  "page.title": "کنترل رفتار",
  "page.subtitle": "تم، مسیرها، دکمه‌ها و رفتارهای اپ کاربر — همه از همین صفحه",
  "page.badgeDraft": "پیش‌نویس",
  "page.badgeNotConnected": "runtime متصل نیست",
  "page.badgeLive": "زنده",
  "banner.title": "اتصال runtime فعال است",
  "banner.body":
    "تغییرات همین‌جا در app_settings ذخیره می‌شوند؛ سرور تا ۳۰ ثانیه اعمال می‌کند و اپ کاربر بعد از بارگذاری مجدد آن را می‌بیند.",
  "flags.title": "قابلیت‌ها و سوییچ‌ها",
  "flags.description": "فهرست واقعی کاتالوگ قابلیت‌ها از دیتابیس",
  "flags.active": "فعال",
  "flags.inactive": "غیرفعال",
  "flags.kindBoolean": "روشن/خاموش",
  "flags.kindMetered": "مصرفی",
  "flags.kindQuota": "سهمیه",
  "flags.kindPackage": "بسته",
  "flags.accessAllow": "باز",
  "flags.accessDeny": "بسته",
  "flags.empty": "قابلیتی یافت نشد.",
  "settings.title": "تنظیم‌ها و حدها",
  "settings.description": "مقادیر عددی/فنی؛ امروز سخت‌کد، در صف اتصال به کانفیگ",
  "content.title": "محتوا و پیام‌های کاربر",
  "content.description": "متن‌هایی که کاربر می‌بیند؛ در صف اتصال به CMS سبک",
  "routes.title": "مسیرها و منو",
  "routes.description": "نمایش/مخفی‌سازی و ترتیب؛ در صف اتصال به route manifest",
  "integrations.title": "ورودی/خروجی‌ها (یکپارچه‌سازی)",
  "integrations.description": "سرویس‌های خارجی مثل RunPod، B2 و Clerk",
  "publish.title": "انتشار و همگام‌سازی",
  "publish.description": "پیش‌نویس ← انتشار ← بازگردانی؛ دکمه‌ها بعد از اتصال runtime فعال می‌شوند",
  "publish.draftVersion": "نسخه پیش‌نویس",
  "publish.publishedVersion": "نسخه منتشرشده",
  "publish.none": "ندارد",
  "publish.button": "انتشار تغییرات",
  "publish.rollback": "بازگردانی",
  "publish.notReady": "اتصال runtime هنوز ساخته نشده است",
  "table.colCode": "کد",
  "table.colValue": "مقدار فعلی",
  "table.colLayer": "لایه",
  "table.colStatus": "وضعیت",
  "table.colName": "نام",
  "table.colKind": "نوع",
  "table.colDefaultAccess": "دسترسی پیش‌فرض",
  "table.colActions": "عملیات",
  "lock.action.lock": "قفل کردن ردیف",
  "lock.action.unlock": "باز کردن قفل ردیف",
  "staged.pending": "در انتظار تأیید",
  "staged.apply": "اعمال تغییرات",
  "staged.applying": "در حال اعمال…",
  "staged.discard": "رد تغییرات",
  "staged.applied": "تغییرات اعمال شد.",
  "staged.failed": "اعمال تغییرات انجام نشد؛ دوباره تلاش کن.",
  "staged.invalid": "مقدار نامعتبر است:",
  "status.hardcoded": "سخت‌کد",
  "status.scheduled": "در صف اتصال",
  "status.connected": "متصل",
  "layer.be": "بک‌اند",
  "layer.fe": "فرانت",
  "layer.db": "داده",
};

const en: Record<BehaviorKey, string> = {
  "page.title": "Behavior Control",
  "page.subtitle": "Theme, routes, buttons and user-app behavior — all from this page",
  "page.badgeDraft": "Draft",
  "page.badgeNotConnected": "Runtime not connected",
  "page.badgeLive": "Live",
  "banner.title": "Runtime connection is live",
  "banner.body":
    "Changes are saved to app_settings right away; the server applies them within 30s and the user app picks them up on the next load.",
  "flags.title": "Features & switches",
  "flags.description": "Live feature catalog from the database",
  "flags.active": "Active",
  "flags.inactive": "Inactive",
  "flags.kindBoolean": "Boolean",
  "flags.kindMetered": "Metered",
  "flags.kindQuota": "Quota",
  "flags.kindPackage": "Package",
  "flags.accessAllow": "Open",
  "flags.accessDeny": "Closed",
  "flags.empty": "No features found.",
  "settings.title": "Settings & limits",
  "settings.description": "Numeric/technical values; hardcoded today, queued for config",
  "content.title": "User content & messages",
  "content.description": "Copy users see; queued for a lightweight CMS",
  "routes.title": "Routes & menu",
  "routes.description": "Show/hide and ordering; queued for a route manifest",
  "integrations.title": "Inputs/outputs (integrations)",
  "integrations.description": "External services such as RunPod, B2 and Clerk",
  "publish.title": "Publish & sync",
  "publish.description": "Draft → publish → rollback; buttons activate once runtime is wired",
  "publish.draftVersion": "Draft version",
  "publish.publishedVersion": "Published version",
  "publish.none": "None",
  "publish.button": "Publish changes",
  "publish.rollback": "Rollback",
  "publish.notReady": "Runtime connection is not built yet",
  "table.colCode": "Code",
  "table.colValue": "Current value",
  "table.colLayer": "Layer",
  "table.colStatus": "Status",
  "table.colName": "Name",
  "table.colKind": "Type",
  "table.colDefaultAccess": "Default access",
  "table.colActions": "Actions",
  "lock.action.lock": "Lock row",
  "lock.action.unlock": "Unlock row",
  "staged.pending": "Pending review",
  "staged.apply": "Apply changes",
  "staged.applying": "Applying…",
  "staged.discard": "Discard",
  "staged.applied": "Changes applied.",
  "staged.failed": "Could not apply changes; try again.",
  "staged.invalid": "Invalid value:",
  "status.hardcoded": "Hardcoded",
  "status.scheduled": "Queued",
  "status.connected": "Connected",
  "layer.be": "Backend",
  "layer.fe": "Frontend",
  "layer.db": "Data",
};

export function translate(locale: "fa" | "en", key: BehaviorKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
