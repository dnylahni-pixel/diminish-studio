// i18n for the feature catalog dashboard + create-drawer (fa / en).
// Follows the same pattern as shell.ts: typed key union + translate().

export type FeaturesKey =
  | "list.title"
  | "list.subtitle"
  | "list.add"
  | "list.colName"
  | "list.colCode"
  | "list.colKind"
  | "list.colStatus"
  | "list.colPlans"
  | "list.colDependencies"
  | "list.colLimits"
  | "list.colPricing"
  | "list.colUsage"
  | "list.colUpdated"
  | "list.colActions"
  | "list.searchPlaceholder"
  | "list.columns"
  | "list.selectedRows"
  | "list.pageOf"
  | "list.previous"
  | "list.next"
  | "list.noResults"
  | "list.usageCredits"
  | "list.viewDetails"
  | "list.edit"
  | "list.delete"
  | "list.deleteConfirmTitle"
  | "list.deleteConfirmBody"
  | "list.deleteConfirm"
  | "list.deleteSuccess"
  | "list.deleteError"
  | "list.loading"
  | "list.statusActive"
  | "list.statusInactive"
  | "form.title"
  | "form.description"
  | "form.editTitle"
  | "form.editDescription"
  | "kind.title"
  | "kind.description"
  | "kind.booleanLabel"
  | "kind.meteredLabel"
  | "kind.quotaLabel"
  | "kind.packageLabel"
  | "basic.nameLabel"
  | "basic.namePlaceholder"
  | "basic.codeLabel"
  | "basic.codeHelper"
  | "basic.descriptionLabel"
  | "basic.descriptionPlaceholder"
  | "unit.title"
  | "unit.label"
  | "unit.placeholder"
  | "unit.helper"
  | "policy.activeLabel"
  | "policy.activeHelper"
  | "access.defaultLabel"
  | "access.defaultHelper"
  | "deps.label"
  | "deps.placeholder"
  | "deps.empty"
  | "deps.helper"
  | "submit.create"
  | "submit.save"
  | "submit.cancel"
  | "dialog.confirmCreate"
  | "dialog.confirmCreateBody"
  | "dialog.confirmCancel"
  | "dialog.confirmCancelBody"
  | "dialog.confirm"
  | "dialog.back"
  | "success.title"
  | "success.body"
  | "safeguards.title"
  | "safeguards.body"
  | "errors.nameShort"
  | "errors.codeInvalid"
  | "errors.unitLong";

const fa: Record<FeaturesKey, string> = {
  "list.title": "قابلیت‌ها",
  "list.subtitle": "مدیریت قابلیت‌های کاتالوگ",
  "list.add": "افزودن قابلیت",
  "list.colName": "نام",
  "list.colCode": "کد",
  "list.colKind": "نوع",
  "list.colStatus": "وضعیت",
  "list.colPlans": "پلن‌ها",
  "list.colDependencies": "وابستگی‌ها",
  "list.colLimits": "سقف‌ها",
  "list.colPricing": "قیمت‌گذاری",
  "list.colUsage": "مصرف ۳۰ روز",
  "list.colUpdated": "آخرین تغییر",
  "list.colActions": "عملیات",
  "list.searchPlaceholder": "جستجوی نام، کد یا توضیح…",
  "list.columns": "ستون‌ها",
  "list.selectedRows": "{selected} از {total} ردیف انتخاب شده",
  "list.pageOf": "صفحه {page} از {pages}",
  "list.previous": "قبلی",
  "list.next": "بعدی",
  "list.noResults": "قابلیتی یافت نشد.",
  "list.usageCredits": "اعتبار",
  "list.viewDetails": "مشاهده جزئیات",
  "list.edit": "ویرایش",
  "list.delete": "حذف",
  "list.deleteConfirmTitle": "حذف قابلیت؟",
  "list.deleteConfirmBody":
    "قابلیت «{name}» آرشیو و غیرفعال می‌شود. طبق قوانین پروژه، داده‌های قابلیت حذف فیزیکی نمی‌شوند.",
  "list.deleteConfirm": "حذف و آرشیو",
  "list.deleteSuccess": "قابلیت آرشیو شد.",
  "list.deleteError": "حذف انجام نشد؛ دوباره تلاش کن.",
  "list.loading": "در حال بارگذاری…",
  "list.statusActive": "فعال",
  "list.statusInactive": "غیرفعال",
  "form.title": "ساخت قابلیت",
  "form.description":
    "یک قابلیت جدید به کاتالوگ اضافه کن؛ سقف و قیمت را بعداً در پلن‌ها تعیین می‌کنی.",
  "form.editTitle": "ویرایش قابلیت",
  "form.editDescription": "مشخصات قابلیت را تغییر بده و ذخیره کن.",
  "kind.title": "نوع قابلیت",
  "kind.description": "این قابلیت چطور به کاربر «داده» می‌شود؟",
  "kind.booleanLabel": "روشن/خاموش",
  "kind.meteredLabel": "مصرفی",
  "kind.quotaLabel": "سهمیه",
  "kind.packageLabel": "بسته",
  "basic.nameLabel": "نام",
  "basic.namePlaceholder": "مثلاً «تشخیص آکورد»",
  "basic.codeLabel": "کد",
  "basic.codeHelper": "به‌صورت خودکار از نام ساخته می‌شود؛ قابل ویرایش",
  "basic.descriptionLabel": "توضیح",
  "basic.descriptionPlaceholder": "این قابلیت چه کاری انجام می‌دهد؟",
  "unit.title": "واحد مصرف",
  "unit.label": "واحد",
  "unit.placeholder": "مثلاً «تشخیص»، «دقیقه»، «گیگابایت»",
  "unit.helper": "واحد اندازه‌گیری مصرف — فقط برای نوع مصرفی/سهمیه",
  "policy.activeLabel": "فعال",
  "policy.activeHelper": "قابلیت‌های غیرفعال در دسترس نیستند",
  "access.defaultLabel": "به‌صورت پیش‌فرض فعال باشد",
  "access.defaultHelper":
    "در پلن‌هایی که تصمیم نگرفته‌اند، این قابلیت به‌طور پیش‌فرض باز باشد (دسترسی allow)",
  "deps.label": "قابلیت‌های وابسته",
  "deps.placeholder": "جستجو و انتخاب…",
  "deps.empty": "قابلیتی یافت نشد",
  "deps.helper": "اگر این قابلیت به قابلیت دیگری نیاز دارد، آن را انتخاب کن",
  "submit.create": "ساخت قابلیت",
  "submit.save": "ذخیره تغییرات",
  "submit.cancel": "لغو",
  "dialog.confirmCreate": "ساخت قابلیت",
  "dialog.confirmCreateBody": "مطمئنی این قابلیت ساخته شود؟",
  "dialog.confirmCancel": "انصراف از ساخت",
  "dialog.confirmCancelBody": "تغییرات فعلی فرم از بین می‌رود. ادامه می‌دهی؟",
  "dialog.confirm": "تأیید",
  "dialog.back": "بازگشت",
  "success.title": "قابلیت ساخته شد",
  "success.body": "قابلیت در دیتابیس واقعی ساخته شد.",
  "safeguards.title": "نکته",
  "safeguards.body":
    "تغییر سیاست‌های هر قابلیت (سقف و قیمت) در سطح پلن انجام می‌شود، نه در خود قابلیت.",
  "errors.nameShort": "نام باید حداقل ۲ کاراکتر باشد",
  "errors.codeInvalid": "کد فقط حروف کوچک، عدد، خط تیره و زیرخط",
  "errors.unitLong": "واحد حداکثر ۸۰ کاراکتر",
};

const en: Record<FeaturesKey, string> = {
  "list.title": "Features",
  "list.subtitle": "Manage the feature catalog",
  "list.add": "Add feature",
  "list.colName": "Name",
  "list.colCode": "Code",
  "list.colKind": "Type",
  "list.colStatus": "Status",
  "list.colPlans": "Plans",
  "list.colDependencies": "Dependencies",
  "list.colLimits": "Limits",
  "list.colPricing": "Pricing",
  "list.colUsage": "Usage 30d",
  "list.colUpdated": "Updated",
  "list.colActions": "Actions",
  "list.searchPlaceholder": "Search name, code or description…",
  "list.columns": "Columns",
  "list.selectedRows": "{selected} of {total} row(s) selected",
  "list.pageOf": "Page {page} of {pages}",
  "list.previous": "Previous",
  "list.next": "Next",
  "list.noResults": "No features found.",
  "list.usageCredits": "credits",
  "list.viewDetails": "View details",
  "list.edit": "Edit",
  "list.delete": "Delete",
  "list.deleteConfirmTitle": "Delete feature?",
  "list.deleteConfirmBody":
    "“{name}” will be archived and deactivated. Per project rules, feature data is never hard-deleted.",
  "list.deleteConfirm": "Delete & archive",
  "list.deleteSuccess": "Feature archived.",
  "list.deleteError": "Delete failed; please try again.",
  "list.loading": "Loading…",
  "list.statusActive": "Active",
  "list.statusInactive": "Inactive",
  "form.title": "Create feature",
  "form.description":
    "Add a new capability to the catalog — plans will set its limits and pricing later.",
  "form.editTitle": "Edit feature",
  "form.editDescription": "Change the feature details and save.",
  "kind.title": "Feature type",
  "kind.description": "How is this capability delivered to the user?",
  "kind.booleanLabel": "Boolean",
  "kind.meteredLabel": "Metered",
  "kind.quotaLabel": "Quota",
  "kind.packageLabel": "Package",
  "basic.nameLabel": "Name",
  "basic.namePlaceholder": "e.g. “Chord detection”",
  "basic.codeLabel": "Code",
  "basic.codeHelper": "auto-generated from the name; editable",
  "basic.descriptionLabel": "Description",
  "basic.descriptionPlaceholder": "What does this capability do?",
  "unit.title": "Usage unit",
  "unit.label": "Unit",
  "unit.placeholder": "e.g. “detection”, “minute”, “gigabyte”",
  "unit.helper": "The unit used to measure usage — only for metered/quota",
  "policy.activeLabel": "Active",
  "policy.activeHelper": "Inactive features are not available",
  "access.defaultLabel": "Active by default",
  "access.defaultHelper":
    "In plans that don't decide, this feature is open by default (access allow)",
  "deps.label": "Dependent features",
  "deps.placeholder": "Search and select…",
  "deps.empty": "No features found",
  "deps.helper": "Select a feature this one depends on, if any",
  "submit.create": "Create feature",
  "submit.save": "Save changes",
  "submit.cancel": "Cancel",
  "dialog.confirmCreate": "Create feature",
  "dialog.confirmCreateBody": "Are you sure you want to create this feature?",
  "dialog.confirmCancel": "Discard changes",
  "dialog.confirmCancelBody": "Current form changes will be lost. Continue?",
  "dialog.confirm": "Confirm",
  "dialog.back": "Back",
  "success.title": "Feature created",
  "success.body": "Feature created in the real database.",
  "safeguards.title": "Note",
  "safeguards.body":
    "Each feature’s policies (limit and price) are set at the plan level, not on the feature itself.",
  "errors.nameShort": "Name must be at least 2 characters",
  "errors.codeInvalid": "Code allows lowercase letters, numbers, dashes and underscores",
  "errors.unitLong": "Unit must be at most 80 characters",
};

export function translate(locale: "fa" | "en", key: FeaturesKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
