// i18n for the Settings workspace (fa / en).
// Follows the same pattern as shell.ts / features.ts: typed key union +
// translate(). The `setting.<key>.label|description` keys are derived from the
// closed SettingKey union so they can never drift from the registry.

import type { SettingKey } from "@/db/schema";

export type SettingsKey =
  | "page.title"
  | "page.subtitle"
  | "moved.title"
  | "moved.body"
  | "groups.analyze"
  | "groups.upload"
  | "groups.storage"
  | "groups.songs"
  | "groups.learning"
  | "groups.auth"
  | "groups.player"
  | "groups.ui"
  | "groups.routes"
  | "groups.branding"
  | `setting.${SettingKey}.label`
  | `setting.${SettingKey}.description`
  | "actions.save"
  | "actions.saving"
  | "actions.saved"
  | "actions.failed"
  | "actions.changeReasonPlaceholder"
  | "actions.changeReasonHelper"
  | "meta.version"
  | "meta.lastChanged"
  | "meta.by"
  | "meta.never"
  | "meta.default"
  | "meta.usesDefault"
  | "meta.justNow"
  | "field.arrayPlaceholder"
  | "field.arrayEmpty"
  | "valueType.boolean"
  | "valueType.number"
  | "valueType.string"
  | "valueType.stringArray"
  | "valueType.numberArray"
  | "valueType.object"
  | "errors.invalidKey"
  | "errors.invalidValue"
  | "errors.invalidNumber"
  | "errors.invalidBoolean"
  | "errors.invalidString"
  | "errors.stringTooLong"
  | "errors.invalidStringArray"
  | "errors.invalidNumberArray"
  | "errors.tooManyItems"
  | "errors.rateLimitMax"
  | "errors.rateLimitWindowMs"
  | "errors.thresholdWarn"
  | "errors.thresholdCritical"
  | "errors.thresholdOrder"
  | "errors.invalidRateLimit"
  | "errors.invalidThresholds";

const fa: Record<SettingsKey, string> = {
  "page.title": "تنظیمات",
  "page.subtitle":
    "تنظیمات عمومی محصول، پلتفرم و کنترل‌پلن — کلیدهای بسته‌ی رجیستری با مقادیر فعلی و نسخه‌بندی.",
  "moved.title": "سقف‌های مصرفی به تب پلن منتقل شدند",
  "moved.body":
    "حداکثر حجم فایل، مدت صدا، پسوندهای قابل آپلود و سهمیه‌ی ذخیره‌سازی دیگر تنظیم سراسری نیستند؛ آن‌ها را در تب پلن‌ها به‌ازای هر نسخه‌ی پلن مدیریت کن.",
  "groups.analyze": "تحلیل",
  "groups.upload": "آپلود",
  "groups.storage": "ذخیره‌سازی",
  "groups.songs": "آهنگ‌ها",
  "groups.learning": "یادگیری",
  "groups.auth": "احراز هویت",
  "groups.player": "پلیر",
  "groups.ui": "رابط کاربری",
  "groups.routes": "مسیرها و منو",
  "groups.branding": "برندینگ",

  "setting.analyze.enabled.label": "تحلیل RunPod (کلید قطع/وصل)",
  "setting.analyze.enabled.description":
    "کلید قطع/وصل سراسری تحلیل RunPod؛ امروزه از config بک‌اند گرفته می‌شود و false به معنای غیرفعال بودن تحلیل است.",
  "setting.analyze.timeout_ms.label": "مهلت تحلیل RunPod",
  "setting.analyze.timeout_ms.description":
    "مهلت تایم‌اوت درخواست تحلیل RunPod به میلی‌ثانیه (۵ دقیقه).",
  "setting.analyze.version.label": "نسخه‌ی تحلیل",
  "setting.analyze.version.description":
    "تگ نسخه‌ی تحلیل که روی تحلیل‌های تکمیل‌شده (analysisVersion) ثبت می‌شود.",
  "setting.analyze.signed_url_expiry_s.label": "انقضای URL امضاشده (ثانیه)",
  "setting.analyze.signed_url_expiry_s.description":
    "مهلت انقضای URL امضاشده برای واکشی فایل صوتی منبع توسط RunPod (۱ ساعت).",

  "setting.upload.max_file_size_bytes.label": "حداکثر حجم فایل (بایت)",
  "setting.upload.max_file_size_bytes.description":
    "حداکثر حجم فایل آپلودی به بایت (۱۰۰ مگابایت).",
  "setting.upload.max_duration_s.label": "حداکثر مدت صدا (ثانیه)",
  "setting.upload.max_duration_s.description":
    "حداکثر مدت صدای مجاز به ثانیه (۱۰ دقیقه).",
  "setting.upload.allowed_mime_types.label": "انواع MIME مجاز",
  "setting.upload.allowed_mime_types.description":
    "انواع MIME مجاز برای آپلود فایل صوتی (۵ نوع).",
  "setting.upload.presign_expiry_s.label": "انقضای پیش‌امضای آپلود (ثانیه)",
  "setting.upload.presign_expiry_s.description":
    "مهلت انقضای URL پیش‌امضاشده به ثانیه (۱۵ دقیقه).",
  "setting.upload.rate_limit.label": "محدودیت نرخ آپلود",
  "setting.upload.rate_limit.description":
    "محدودیت نرخ آپلود هر پروسس: حداکثر درخواست در یک پنجره‌ی غلتان (windowMs).",

  "setting.storage.quota_default_bytes.label": "سهمیه‌ی پیش‌فرض ذخیره‌سازی (بایت)",
  "setting.storage.quota_default_bytes.description":
    "سهمیه‌ی پیش‌فرض ذخیره‌سازی هر کاربر به بایت (۱ گیگابایت)؛ پیش‌فرض users.storage_quota_bytes نیز همین است.",

  "setting.songs.featured_count.label": "تعداد آهنگ‌های ویژه",
  "setting.songs.featured_count.description":
    "تعداد آهنگ‌های ویژه‌ی برگشتی از GET /songs/featured.",

  "setting.learning.mastery_min_attempts.label": "حداقل تلاش برای تسلط",
  "setting.learning.mastery_min_attempts.description":
    "حداقل تعداد تلاش پیش از واجد شرایط شدن یک آکورد برای تسلط.",
  "setting.learning.mastery_success_rate.label": "نرخ موفقیت تسلط",
  "setting.learning.mastery_success_rate.description":
    "نرخ موفقیت لازم (۰..۱) برای تسلط بر آکورد؛ ۰٫۸ یعنی ۸۰٪.",
  "setting.learning.demo_enabled.label": "حالت دمو",
  "setting.learning.demo_enabled.description":
    "حالت دمو: مسیرهای learning/chords بدون Clerk برای کاربر دمو پاسخ می‌دهند (DEMO_USER_ID = 1).",

  "setting.auth.retry_after_seconds.label": "مهلت تلاش مجدد ورود (ثانیه)",
  "setting.auth.retry_after_seconds.description":
    "پنجره‌ی retry-after احراز هویت Clerk به ثانیه (در users.ts و library.ts تکرار شده).",

  "setting.player.master_url_expiry_s.label": "انقضای URL نسخه‌ی اصلی (ثانیه)",
  "setting.player.master_url_expiry_s.description":
    "مهلت انقضای URL امضاشده‌ی ترک اصلی به ثانیه (۱۵ دقیقه).",
  "setting.player.chord_levels.label": "سطوح آکورد پلیر",
  "setting.player.chord_levels.description":
    "سطوح پیچیدگی آکورد موجود در پلیر.",
  "setting.player.speed_min.label": "حداقل سرعت پخش",
  "setting.player.speed_min.description": "حداقل ضریب سرعت پخش.",
  "setting.player.speed_max.label": "حداکثر سرعت پخش",
  "setting.player.speed_max.description": "حداکثر ضریب سرعت پخش.",
  "setting.player.semitones_min.label": "حداقل تغییر گام (نیم‌پرده)",
  "setting.player.semitones_min.description":
    "حداقل محدوده‌ی تغییر گام به نیم‌پرده.",
  "setting.player.semitones_max.label": "حداکثر تغییر گام (نیم‌پرده)",
  "setting.player.semitones_max.description":
    "حداکثر محدوده‌ی تغییر گام به نیم‌پرده.",

  "setting.ui.storage_warning_thresholds.label": "آستانه‌های هشدار ذخیره‌سازی",
  "setting.ui.storage_warning_thresholds.description":
    "درصدهای مصرف سهمیه (۰..۱۰۰) که نوار سهمیه را کهربایی (warn) و قرمز (critical) می‌کند.",
  "setting.ui.post_login_redirect.label": "مسیر پس از ورود",
  "setting.ui.post_login_redirect.description":
    "مسیر انتقال پس از ورود/ثبت‌نام موفق.",
  "setting.ui.url_import_enabled.label": "فعال‌سازی ایمپورت با URL",
  "setting.ui.url_import_enabled.description":
    "فرم «ایمپورت با URL» را در صفحه‌ی پردازش فعال می‌کند (فعلاً غیرفعال — «به‌زودی»).",
  "setting.ui.theme.label": "تم اپ کاربر",
  "setting.ui.theme.description":
    "«classic» ظاهر فعلی است؛ «new» تم جدید را در اپ کاربر فعال می‌کند.",
  "setting.ui.home_cta_redirect.label": "هدایت دکمه‌ی اصلی صفحه‌ی اول",
  "setting.ui.home_cta_redirect.description":
    "دکمه‌ی اصلی «شروع کن» کاربر را به این مسیر هدایت می‌کند.",

  "setting.branding.app_name.label": "نام برند اپ",
  "setting.branding.app_name.description":
    "نام برند برنامه که در سایدبار/هدر نمایش داده می‌شود.",
  "setting.branding.app_version.label": "نسخه‌ی اپ",
  "setting.branding.app_version.description":
    "نسخه‌ی برنامه که در فوتر نمایش داده می‌شود.",

  "setting.routes.music_hub_visible.label": "نمایش Music Hub",
  "setting.routes.music_hub_visible.description":
    "نمایش/مخفی‌کردن ماژول Music Hub در منوی کاربر.",
  "setting.routes.library_visible.label": "نمایش Library",
  "setting.routes.library_visible.description":
    "نمایش/مخفی‌کردن ماژول Library در منوی کاربر.",
  "setting.routes.learn_visible.label": "نمایش Learn",
  "setting.routes.learn_visible.description":
    "نمایش/مخفی‌کردن ماژول Learn در منوی کاربر.",
  "setting.routes.process_visible.label": "نمایش Process",
  "setting.routes.process_visible.description":
    "نمایش/مخفی‌کردن ماژول Process (آپلود) در منوی کاربر.",
  "setting.routes.profile_visible.label": "نمایش Profile",
  "setting.routes.profile_visible.description":
    "نمایش/مخفی‌کردن ماژول Profile در منوی کاربر.",

  "actions.save": "ذخیره",
  "actions.saving": "در حال ذخیره…",
  "actions.saved": "تنظیم ذخیره شد.",
  "actions.failed": "ذخیره انجام نشد؛ دوباره تلاش کن.",
  "actions.changeReasonPlaceholder": "دلیل تغییر (اختیاری)…",
  "actions.changeReasonHelper":
    "این دلیل در نسخه‌ها و لاگ حسابرسی ثبت می‌شود",
  "meta.version": "نسخه",
  "meta.lastChanged": "آخرین تغییر",
  "meta.by": "توسط",
  "meta.never": "هنوز ذخیره نشده",
  "meta.default": "پیش‌فرض",
  "meta.usesDefault": "مقدار پیش‌فرض رجیستری اعمال می‌شود",
  "meta.justNow": "همین حالا",
  "field.arrayPlaceholder": "جستجو و انتخاب…",
  "field.arrayEmpty": "موردی یافت نشد",
  "valueType.boolean": "بولی",
  "valueType.number": "عدد",
  "valueType.string": "رشته",
  "valueType.stringArray": "فهرست رشته",
  "valueType.numberArray": "فهرست عدد",
  "valueType.object": "شیء",

  "errors.invalidKey": "کلید تنظیم نامعتبر است",
  "errors.invalidValue": "مقدار تنظیم نامعتبر است",
  "errors.invalidNumber": "یک عدد معتبر وارد کن",
  "errors.invalidBoolean": "مقدار باید درست/نادرست باشد",
  "errors.invalidString": "یک رشته وارد کن",
  "errors.stringTooLong": "رشته خیلی طولانی است (حداکثر ۴۰۰۰ کاراکتر)",
  "errors.invalidStringArray": "فهرست رشته‌ها نامعتبر است",
  "errors.invalidNumberArray": "فهرست اعداد نامعتبر است",
  "errors.tooManyItems": "حداکثر ۱۰۰ مورد مجاز است",
  "errors.rateLimitMax": "max باید عدد صحیح بزرگتر از صفر باشد",
  "errors.rateLimitWindowMs": "windowMs باید عدد صحیح بزرگتر از صفر باشد",
  "errors.thresholdWarn": "warn باید بین ۰ و ۱۰۰ باشد",
  "errors.thresholdCritical": "critical باید بین ۰ و ۱۰۰ باشد",
  "errors.thresholdOrder": "warn باید کمتر یا مساوی critical باشد",
  "errors.invalidRateLimit": "مقدار محدودیت نرخ نامعتبر است",
  "errors.invalidThresholds": "مقدار آستانه‌ها نامعتبر است",
};

const en: Record<SettingsKey, string> = {
  "page.title": "Settings",
  "page.subtitle":
    "Product, platform and control-plane settings — the closed registry keys with their current values and versioning.",
  "moved.title": "Entitlement limits moved to the Plans tab",
  "moved.body":
    "Max file size, audio duration, allowed upload extensions and storage quota are no longer global settings — manage them per plan version in the Plans tab.",
  "groups.analyze": "Analyze",
  "groups.upload": "Upload",
  "groups.storage": "Storage",
  "groups.songs": "Songs",
  "groups.learning": "Learning",
  "groups.auth": "Auth",
  "groups.player": "Player",
  "groups.ui": "UI",
  "groups.routes": "Routes & Menu",
  "groups.branding": "Branding",

  "setting.analyze.enabled.label": "RunPod analysis (kill-switch)",
  "setting.analyze.enabled.description":
    "Global kill-switch for RunPod analysis. Derived from the backend config; `false` means analysis is disabled.",
  "setting.analyze.timeout_ms.label": "RunPod analysis timeout",
  "setting.analyze.timeout_ms.description":
    "RunPod analysis request timeout in milliseconds (5 minutes).",
  "setting.analyze.version.label": "Analysis version",
  "setting.analyze.version.description":
    "Analysis version tag stamped on completed analyses (analysisVersion).",
  "setting.analyze.signed_url_expiry_s.label": "Signed URL expiry (s)",
  "setting.analyze.signed_url_expiry_s.description":
    "Presigned URL expiry (seconds) for RunPod to fetch the source audio (1 hour).",

  "setting.upload.max_file_size_bytes.label": "Max upload file size (bytes)",
  "setting.upload.max_file_size_bytes.description":
    "Maximum upload file size in bytes (100 MB).",
  "setting.upload.max_duration_s.label": "Max audio duration (s)",
  "setting.upload.max_duration_s.description":
    "Maximum audio duration in seconds (10 minutes).",
  "setting.upload.allowed_mime_types.label": "Allowed MIME types",
  "setting.upload.allowed_mime_types.description":
    "Allowed audio MIME types for uploads (5 types).",
  "setting.upload.presign_expiry_s.label": "Upload presign expiry (s)",
  "setting.upload.presign_expiry_s.description":
    "Presign URL expiry in seconds (15 minutes).",
  "setting.upload.rate_limit.label": "Upload rate limit",
  "setting.upload.rate_limit.description":
    "Per-process upload rate limit: max requests in a rolling window (windowMs).",

  "setting.storage.quota_default_bytes.label": "Default storage quota (bytes)",
  "setting.storage.quota_default_bytes.description":
    "Default per-user storage quota in bytes (1 GB); also the default for users.storage_quota_bytes.",

  "setting.songs.featured_count.label": "Featured songs count",
  "setting.songs.featured_count.description":
    "Number of featured songs returned by GET /songs/featured.",

  "setting.learning.mastery_min_attempts.label": "Minimum attempts for mastery",
  "setting.learning.mastery_min_attempts.description":
    "Minimum attempts before a chord is eligible for mastery.",
  "setting.learning.mastery_success_rate.label": "Mastery success rate",
  "setting.learning.mastery_success_rate.description":
    "Required success rate (0..1) to master a chord; 0.8 = 80%.",
  "setting.learning.demo_enabled.label": "Demo mode",
  "setting.learning.demo_enabled.description":
    "Demo mode: learning/chords routes answer for a demo user without Clerk auth (DEMO_USER_ID = 1).",

  "setting.auth.retry_after_seconds.label": "Auth retry-after (s)",
  "setting.auth.retry_after_seconds.description":
    "Clerk auth retry-after window in seconds (repeated in users.ts and library.ts).",

  "setting.player.master_url_expiry_s.label": "Master URL expiry (s)",
  "setting.player.master_url_expiry_s.description":
    "Master track signed URL expiry in seconds (15 minutes).",
  "setting.player.chord_levels.label": "Player chord levels",
  "setting.player.chord_levels.description":
    "Available chord complexity levels offered by the player.",
  "setting.player.speed_min.label": "Min playback speed",
  "setting.player.speed_min.description": "Minimum playback speed multiplier.",
  "setting.player.speed_max.label": "Max playback speed",
  "setting.player.speed_max.description": "Maximum playback speed multiplier.",
  "setting.player.semitones_min.label": "Min pitch shift (semitones)",
  "setting.player.semitones_min.description":
    "Minimum pitch-shift range in semitones.",
  "setting.player.semitones_max.label": "Max pitch shift (semitones)",
  "setting.player.semitones_max.description":
    "Maximum pitch-shift range in semitones.",

  "setting.ui.storage_warning_thresholds.label": "Storage warning thresholds",
  "setting.ui.storage_warning_thresholds.description":
    "Storage quota usage percentages (0..100) that turn the quota bar amber (warn) and red (critical).",
  "setting.ui.post_login_redirect.label": "Post-login redirect",
  "setting.ui.post_login_redirect.description":
    "Redirect target after a successful login/registration.",
  "setting.ui.url_import_enabled.label": "Enable import-by-URL",
  "setting.ui.url_import_enabled.description":
    "Enables the 'import by URL' form on the Process page (currently disabled — 'coming soon').",
  "setting.ui.theme.label": "User-app theme",
  "setting.ui.theme.description":
    "'classic' keeps the current look; 'new' activates the new theme in the user app.",
  "setting.ui.home_cta_redirect.label": "Home primary CTA target",
  "setting.ui.home_cta_redirect.description":
    "Where the main 'Start creating' button redirects the user.",

  "setting.branding.app_name.label": "App brand name",
  "setting.branding.app_name.description":
    "Application brand name shown in the sidebar/header.",
  "setting.branding.app_version.label": "App version",
  "setting.branding.app_version.description":
    "Application version shown in the footer.",

  "setting.routes.music_hub_visible.label": "Show Music Hub",
  "setting.routes.music_hub_visible.description":
    "Show/hide the Music Hub module in the user navigation.",
  "setting.routes.library_visible.label": "Show Library",
  "setting.routes.library_visible.description":
    "Show/hide the Library module in the user navigation.",
  "setting.routes.learn_visible.label": "Show Learn",
  "setting.routes.learn_visible.description":
    "Show/hide the Learn module in the user navigation.",
  "setting.routes.process_visible.label": "Show Process",
  "setting.routes.process_visible.description":
    "Show/hide the Process (upload) module in the user navigation.",
  "setting.routes.profile_visible.label": "Show Profile",
  "setting.routes.profile_visible.description":
    "Show/hide the Profile module in the user navigation.",

  "actions.save": "Save",
  "actions.saving": "Saving…",
  "actions.saved": "Setting saved.",
  "actions.failed": "Save failed; please try again.",
  "actions.changeReasonPlaceholder": "Change reason (optional)…",
  "actions.changeReasonHelper":
    "This reason is recorded in versions and the audit log",
  "meta.version": "Version",
  "meta.lastChanged": "Last changed",
  "meta.by": "by",
  "meta.never": "Never saved",
  "meta.default": "default",
  "meta.usesDefault": "The registry default applies",
  "meta.justNow": "just now",
  "field.arrayPlaceholder": "Search and select…",
  "field.arrayEmpty": "No options found",
  "valueType.boolean": "Boolean",
  "valueType.number": "Number",
  "valueType.string": "String",
  "valueType.stringArray": "String list",
  "valueType.numberArray": "Number list",
  "valueType.object": "Object",

  "errors.invalidKey": "Invalid setting key",
  "errors.invalidValue": "Invalid setting value",
  "errors.invalidNumber": "Enter a valid number",
  "errors.invalidBoolean": "Value must be true or false",
  "errors.invalidString": "Enter a string",
  "errors.stringTooLong": "String is too long (max 4000 characters)",
  "errors.invalidStringArray": "Invalid list of strings",
  "errors.invalidNumberArray": "Invalid list of numbers",
  "errors.tooManyItems": "At most 100 items are allowed",
  "errors.rateLimitMax": "max must be a positive integer",
  "errors.rateLimitWindowMs": "windowMs must be a positive integer",
  "errors.thresholdWarn": "warn must be between 0 and 100",
  "errors.thresholdCritical": "critical must be between 0 and 100",
  "errors.thresholdOrder": "warn must be less than or equal to critical",
  "errors.invalidRateLimit": "Invalid rate-limit value",
  "errors.invalidThresholds": "Invalid thresholds value",
};

export function translate(locale: "fa" | "en", key: SettingsKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
