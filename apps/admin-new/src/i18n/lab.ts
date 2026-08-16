// i18n for the Review Lab landing page (fa / en).
// Follows the same pattern as shell.ts / features.ts: typed key union + translate().
// The Lab is an UNVERIFIED / DRAFT area: new hub screens live here until the
// owner approves them, then they move to their final routes.

export type LabKey =
  | "page.title"
  | "page.badge"
  | "page.subtitle"
  | "page.noteTitle"
  | "page.noteBody"
  | "tabs.settings"
  | "tabs.plans"
  | "tabs.audit"
  | "placeholder.label"
  | "placeholder.body"
  | "settings.title"
  | "settings.description"
  | "audit.title"
  | "audit.description";

const fa: Record<LabKey, string> = {
  "page.title": "آزمایشگاه",
  "page.badge": "ناحیه‌ی تاییدنشده / تحت بازبینی",
  "page.subtitle":
    "صفحه‌های جدید مدیریتی ابتدا در همین ناحیه ساخته می‌شوند و تا تأیید مالک محصول پیش‌نویس می‌مانند؛ پس از تأیید به مسیر نهایی خود منتقل می‌شوند.",
  "page.noteTitle": "قوانین این ناحیه",
  "page.noteBody":
    "هیچ چیزی اینجا تأییدشده نیست. کد فقط بر پایه‌ی قرارداد بک‌اند ساخته می‌شود و باید با CONVENTIONS.md هم‌خوان باشد.",
  "tabs.settings": "تنظیمات",
  "tabs.plans": "پلن‌ها",
  "tabs.audit": "بازبینی و نسخه‌ها",
  "placeholder.label": "در حال ساخت",
  "placeholder.body":
    "این فضای کاری هنوز ساخته نشده است؛ در تکرارهای بعدی توسط agent اختصاصی پر می‌شود و پس از تأیید مالک به مسیر نهایی منتقل می‌گردد.",
  "settings.title": "فضای کاری تنظیمات",
  "settings.description":
    "تنظیمات عمومی محصول، پلتفرم و کنترل‌پلن — ظاهر، زبان، اسرار و پیکربندی‌های سطح سیستم.",
  "audit.title": "فضای کاری بازبینی و نسخه‌ها",
  "audit.description":
    "تاریخچه‌ی تغییرات، نسخه‌های کاتالوگ، امضای انتشار و گزارش‌های حسابرسی.",
};

const en: Record<LabKey, string> = {
  "page.title": "Review Lab",
  "page.badge": "Unverified / under review",
  "page.subtitle":
    "Newly-built admin screens live here first and stay in this draft area until the product owner approves them; after approval they move to their final routes.",
  "page.noteTitle": "Area rules",
  "page.noteBody":
    "Nothing here is approved yet. Code is built only from the backend contract and must follow CONVENTIONS.md.",
  "tabs.settings": "Settings",
  "tabs.plans": "Plans",
  "tabs.audit": "Audit & Versions",
  "placeholder.label": "Under construction",
  "placeholder.body":
    "This workspace has not been built yet — the assigned agent fills it in a later iteration, and it moves to its final route after owner approval.",
  "settings.title": "Settings workspace",
  "settings.description":
    "Product, platform and control-plane settings — appearance, locale, secrets and system-level configuration.",
  "audit.title": "Audit & versions workspace",
  "audit.description":
    "Change history, catalog versions, release signatures and audit reports.",
};

export function translate(locale: "fa" | "en", key: LabKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
