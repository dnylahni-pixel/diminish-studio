// i18n for the Audit & Versions workspace (fa / en).
// Follows the same pattern as shell.ts / features.ts / settings.ts: typed key
// union + translate(). The workspace lives inside the Review Lab (/lab) until
// the owner approves it, then it moves to its final route.

export type AuditKey =
  | "page.title"
  | "page.subtitle"
  | "summary.versions"
  | "summary.auditEntries"
  | "table.colExpand"
  | "table.colKey"
  | "table.colVersion"
  | "table.colChangedBy"
  | "table.colChangedAt"
  | "table.colReason"
  | "table.colActions"
  | "table.noVersions"
  | "table.currentBadge"
  | "table.noReason"
  | "table.pageOf"
  | "table.previous"
  | "table.next"
  | "diff.title"
  | "diff.before"
  | "diff.after"
  | "diff.empty"
  | "restore.title"
  | "restore.description"
  | "restore.confirm"
  | "restore.cancel"
  | "restore.success"
  | "restore.currentDisabled"
  | "restore.errors.invalidKey"
  | "restore.errors.invalidVersion"
  | "restore.errors.versionNotFound"
  | "restore.errors.failed"
  | "meta.justNow";

const fa: Record<AuditKey, string> = {
  "page.title": "بازبینی و نسخه‌ها",
  "page.subtitle":
    "تاریخچه‌ی تغییرات تنظیمات؛ diff هر نسخه به‌همراه بازیابی مقادیر قبلی به‌صورت یک نسخه‌ی جدید.",
  "summary.versions": "{count} نسخه",
  "summary.auditEntries": "{count} رویداد حسابرسی",
  "table.colExpand": "نمایش diff",
  "table.colKey": "کلید",
  "table.colVersion": "نسخه",
  "table.colChangedBy": "تغییر توسط",
  "table.colChangedAt": "زمان تغییر",
  "table.colReason": "دلیل تغییر",
  "table.colActions": "عملیات",
  "table.noVersions": "هنوز نسخه‌ای ثبت نشده است.",
  "table.currentBadge": "نسخه‌ی فعلی",
  "table.noReason": "بدون دلیل",
  "table.pageOf": "صفحه {page} از {pages}",
  "table.previous": "قبلی",
  "table.next": "بعدی",
  "diff.title": "تغییرات این نسخه",
  "diff.before": "قبل",
  "diff.after": "بعد",
  "diff.empty": "تفاوتی با نسخه‌ی قبلی ثبت نشده است.",
  "restore.title": "بازیابی این نسخه؟",
  "restore.description":
    "مقدار {key}@v{version} به‌صورت یک نسخه‌ی جدید ذخیره و به نسخه‌ی فعلی تبدیل می‌شود. ادامه می‌دهی؟",
  "restore.confirm": "بازیابی",
  "restore.cancel": "انصراف",
  "restore.success":
    "نسخه‌ی {version} بازیابی و به‌صورت نسخه‌ی جدید ذخیره شد.",
  "restore.currentDisabled": "این نسخه هم‌اکنون نسخه‌ی فعلی است",
  "restore.errors.invalidKey": "کلید تنظیم نامعتبر است",
  "restore.errors.invalidVersion": "شماره‌ی نسخه نامعتبر است",
  "restore.errors.versionNotFound": "نسخه‌ی درخواستی در تاریخچه یافت نشد",
  "restore.errors.failed": "بازیابی انجام نشد؛ دوباره تلاش کن.",
  "meta.justNow": "همین حالا",
};

const en: Record<AuditKey, string> = {
  "page.title": "Audit & Versions",
  "page.subtitle":
    "Change history for settings — the diff of each version, with one-click restore of old values as a new version.",
  "summary.versions": "{count} version(s)",
  "summary.auditEntries": "{count} audit events",
  "table.colExpand": "Toggle diff",
  "table.colKey": "Key",
  "table.colVersion": "Version",
  "table.colChangedBy": "Changed by",
  "table.colChangedAt": "Changed",
  "table.colReason": "Change reason",
  "table.colActions": "Actions",
  "table.noVersions": "No versions recorded yet.",
  "table.currentBadge": "Current version",
  "table.noReason": "No reason",
  "table.pageOf": "Page {page} of {pages}",
  "table.previous": "Previous",
  "table.next": "Next",
  "diff.title": "Changes in this version",
  "diff.before": "Before",
  "diff.after": "After",
  "diff.empty": "No difference from the previous version.",
  "restore.title": "Restore this version?",
  "restore.description":
    "The value of {key}@v{version} will be saved as a new version and become the current one. Continue?",
  "restore.confirm": "Restore",
  "restore.cancel": "Cancel",
  "restore.success":
    "Version {version} restored and saved as a new version.",
  "restore.currentDisabled": "This is already the current version",
  "restore.errors.invalidKey": "Invalid setting key",
  "restore.errors.invalidVersion": "Invalid version number",
  "restore.errors.versionNotFound": "The requested version was not found in the history",
  "restore.errors.failed": "Restore failed; please try again.",
  "meta.justNow": "just now",
};

export function translate(locale: "fa" | "en", key: AuditKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
