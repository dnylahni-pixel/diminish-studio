// i18n for the Plans workspace inside the Review Lab (fa / en).
// Follows the same pattern as features.ts / settings.ts: typed key union +
// translate(). All user-facing copy must go through these keys.

export type PlansKey =
  | "page.title"
  | "page.subtitle"
  | "summary.totalPlans"
  | "summary.activePlans"
  | "summary.publishedVersions"
  | "summary.activeSubscribers"
  | "values.all"
  | "status.draft"
  | "status.active"
  | "status.archived"
  | "versionStatus.draft"
  | "versionStatus.published"
  | "versionStatus.retired"
  | "values.public"
  | "values.private"
  | "values.inherit"
  | "values.allow"
  | "values.deny"
  | "values.unlimited"
  | "values.custom"
  | "values.block"
  | "values.allowOverage"
  | "values.free"
  | "values.recurring"
  | "values.oneTime"
  | "interval.day"
  | "interval.week"
  | "interval.month"
  | "interval.year"
  | "kind.boolean"
  | "kind.metered"
  | "kind.quota"
  | "kind.package"
  | "period.none"
  | "period.day"
  | "period.week"
  | "period.month"
  | "metric.unit"
  | "metric.minute"
  | "metric.megabyte"
  | "metric.request"
  | "metric.seat"
  | "plan.none"
  | "plan.noMatches"
  | "plan.noVersions"
  | "plan.noFeatures"
  | "plan.searchPlaceholder"
  | "plan.create"
  | "plan.edit"
  | "plan.archive"
  | "plan.credit"
  | "plan.windows"
  | "plan.addons"
  | "planForm.title"
  | "planForm.description"
  | "planForm.editTitle"
  | "planForm.editDescription"
  | "planForm.nameLabel"
  | "planForm.namePlaceholder"
  | "planForm.codeLabel"
  | "planForm.codeHelper"
  | "planForm.codeReadonlyHelper"
  | "planForm.descriptionLabel"
  | "planForm.descriptionPlaceholder"
  | "planForm.publicLabel"
  | "planForm.publicHelper"
  | "planForm.section.general"
  | "planForm.section.version"
  | "planForm.section.pricing"
  | "planForm.section.credit"
  | "planForm.section.upload"
  | "planForm.section.features"
  | "planForm.section.addons"
  | "planForm.sortOrderLabel"
  | "planForm.sortOrderHelper"
  | "planForm.tooltip.sortOrder"
  | "planForm.tooltip.billingInterval"
  | "planForm.versionTitleLabel"
  | "planForm.versionTitlePlaceholder"
  | "planForm.changeNotesLabel"
  | "planForm.changeNotesPlaceholder"
  | "planForm.effectiveFromLabel"
  | "planForm.effectiveFromHelper"
  | "planForm.priceTypeLabel"
  | "planForm.amountLabel"
  | "planForm.amountHelper"
  | "planForm.currencyLabel"
  | "planForm.currencyHelper"
  | "planForm.billingIntervalLabel"
  | "planForm.billingIntervalHelper"
  | "planForm.billingIntervalCountLabel"
  | "planForm.billingIntervalCountHelper"
  | "planForm.trialDaysLabel"
  | "planForm.trialDaysHelper"
  | "planForm.creditWindowsHelper"
  | "planForm.creditWindowPeriodLabel"
  | "planForm.creditWindowCountLabel"
  | "planForm.creditWindowAmountLabel"
  | "planForm.creditWindowAdd"
  | "planForm.creditWindowRemove"
  | "planForm.period.total"
  | "planForm.period.hour"
  | "planForm.period.day"
  | "planForm.period.week"
  | "planForm.period.month"
  | "planForm.period.year"
  | "planForm.uploadExtensionsLabel"
  | "planForm.uploadExtensionsPlaceholder"
  | "planForm.uploadExtensionsHelper"
  | "planForm.rolloverLabel"
  | "planForm.rolloverHelper"
  | "planForm.rolloverCapLabel"
  | "planForm.rolloverCapHelper"
  | "planForm.negativeBalanceLabel"
  | "planForm.negativeBalanceHelper"
  | "planForm.maxNegativeBalanceLabel"
  | "planForm.maxNegativeBalanceHelper"
  | "planForm.featuresHelper"
  | "planForm.addonsHelper"
  | "planForm.selectAllFeatures"
  | "planForm.noAddons"
  | "planForm.statusLabel"
  | "planForm.statusHelper"
  | "planForm.create"
  | "planForm.save"
  | "planForm.cancel"
  | "planForm.archiveConfirmTitle"
  | "planForm.archiveConfirmBody"
  | "planForm.archiveConfirm"
  | "version.title"
  | "version.effectiveFrom"
  | "version.effectiveTo"
  | "version.changeNotes"
  | "version.noChangeNotes"
  | "version.noTitle"
  | "table.feature"
  | "table.kind"
  | "table.access"
  | "table.limit"
  | "table.period"
  | "table.behavior"
  | "table.overage"
  | "table.pricing"
  | "table.actions"
  | "table.searchPlaceholder"
  | "table.noResults"
  | "table.columns"
  | "table.selectedRows"
  | "table.pageOf"
  | "table.previous"
  | "table.next"
  | "dialog.title"
  | "dialog.description"
  | "dialog.version"
  | "dialog.versionNote"
  | "dialog.accessSection"
  | "dialog.limitSection"
  | "dialog.pricingSection"
  | "field.limitToggle.label"
  | "field.limitToggle.helper"
  | "field.pricingToggle.label"
  | "field.pricingToggle.helper"
  | "field.access.label"
  | "field.access.helper"
  | "field.limitMode.label"
  | "field.limitMode.helper"
  | "field.limitValue.label"
  | "field.limitValue.helper"
  | "field.period.label"
  | "field.period.helper"
  | "field.behavior.label"
  | "field.behavior.helper"
  | "field.overage.label"
  | "field.overage.helper"
  | "field.pricingMode.label"
  | "field.pricingMode.helper"
  | "field.metric.label"
  | "field.metric.helper"
  | "field.pricingModel.label"
  | "field.pricingModel.helper"
  | "field.currency.label"
  | "field.currency.helper"
  | "field.unitPrice.label"
  | "field.unitPrice.helper"
  | "field.creditCost.label"
  | "field.creditCost.helper"
  | "field.minimumCharge.label"
  | "field.minimumCharge.helper"
  | "actions.edit"
  | "actions.clone"
  | "actions.cloning"
  | "actions.cloned"
  | "actions.cloneSuffix"
  | "actions.save"
  | "actions.saving"
  | "actions.saved"
  | "actions.cancel"
  | "actions.createDraft"
  | "actions.creatingDraft"
  | "actions.createdDraft"
  | "actions.publish"
  | "actions.publishing"
  | "actions.published"
  | "actions.publishConfirmTitle"
  | "actions.publishConfirmBody"
  | "actions.planCreated"
  | "actions.planUpdated"
  | "actions.planArchived"
  | "actions.failed"
  | "errors.limitWhole"
  | "errors.overageWhole"
  | "errors.currency"
  | "errors.priceWhole"
  | "errors.reviewFields"
  | "errors.notFound"
  | "errors.versionNotFound"
  | "errors.notDraft"
  | "errors.nameShort"
  | "errors.codeInvalid"
  | "errors.codeInUse"
  | "errors.amountInvalid"
  | "errors.amountTooLarge"
  | "errors.creditWindowsRequired"
  | "errors.dateInvalid"
  | "errors.activeRequiresDate"
  | "errors.rolloverCapLow"
  | "errors.negativeLimit"
  | "errors.sourceRequired"
  | "errors.sourceUnavailable"
  | "errors.noVersionToClone"
  | "errors.planNotFound"
  | "errors.commitFailed";

const fa: Record<PlansKey, string> = {
  "page.title": "پلن‌ها و سقف‌ها",
  "page.subtitle":
    "سقف‌های مصرفی (حجم فایل، مدت صدا، فضای ذخیره‌سازی و…) به‌ازای هر قابلیت و هر نسخه‌ی پلن تعریف می‌شوند؛ کاربر از طریق اشتراک به یک پلن اصلی وصل می‌شود.",
  "summary.totalPlans": "کل پلن‌ها",
  "summary.activePlans": "پلن فعال",
  "summary.publishedVersions": "نسخه منتشرشده",
  "summary.activeSubscribers": "مشترک فعال",
  "values.all": "همه",
  "status.draft": "پیش‌نویس",
  "status.active": "فعال",
  "status.archived": "بایگانی",
  "versionStatus.draft": "پیش‌نویس",
  "versionStatus.published": "منتشرشده",
  "versionStatus.retired": "بازنشسته",
  "values.public": "عمومی",
  "values.private": "خصوصی",
  "values.inherit": "ارث‌بری",
  "values.allow": "مجاز",
  "values.deny": "رد",
  "values.unlimited": "نامحدود",
  "values.custom": "سفارشی",
  "values.block": "بستن",
  "values.allowOverage": "مصرف مازاد",
  "values.free": "رایگان",
  "values.recurring": "دوره‌ای",
  "values.oneTime": "یک‌باره",
  "interval.day": "روز",
  "interval.week": "هفته",
  "interval.month": "ماه",
  "interval.year": "سال",
  "kind.boolean": "بولی",
  "kind.metered": "مصرفی",
  "kind.quota": "سهمیه",
  "kind.package": "بسته",
  "period.none": "—",
  "period.day": "روزانه",
  "period.week": "هفتگی",
  "period.month": "ماهانه",
  "metric.unit": "واحد",
  "metric.minute": "دقیقه",
  "metric.megabyte": "مگابایت",
  "metric.request": "درخواست",
  "metric.seat": "نشست",
  "plan.none": "هنوز پلنی ساخته نشده است.",
  "plan.noMatches": "پلنی با این معیارها پیدا نشد.",
  "plan.noVersions": "این پلن هنوز نسخه‌ای ندارد.",
  "plan.noFeatures": "هنوز قابلیتی تعریف نشده است؛ ابتدا در فضای قابلیت‌ها ساخته شود.",
  "plan.searchPlaceholder": "جستجوی پلن‌ها…",
  "plan.create": "ساخت پلن",
  "plan.edit": "ویرایش پلن",
  "plan.archive": "بایگانی پلن",
  "plan.credit": "گرنت اعتبار",
  "plan.windows": "بازه",
  "plan.addons": "اَدون‌ها",
  "planForm.title": "ساخت پلن",
  "planForm.description":
    "پلن را با قیمت پایه، سیاست اعتبار، قابلیت‌ها و اَدون‌ها بساز؛ نسخه‌ی اول (v1) به‌صورت پیش‌نویس ساخته می‌شود.",
  "planForm.editTitle": "ویرایش پلن",
  "planForm.editDescription":
    "نام، توضیح، وضعیت عمومی و وضعیت پلن را ویرایش کن؛ کد پس از ساخت ثابت است.",
  "planForm.nameLabel": "نام پلن",
  "planForm.namePlaceholder": "مثلاً حرفه‌ای",
  "planForm.codeLabel": "کد",
  "planForm.codeHelper": "حروف کوچک لاتین، عدد، خط تیره یا زیرخط.",
  "planForm.codeReadonlyHelper": "کد بعد از ساخت قابل تغییر نیست.",
  "planForm.descriptionLabel": "توضیح",
  "planForm.descriptionPlaceholder": "توضیح کوتاه درباره‌ی این پلن…",
  "planForm.publicLabel": "پلن عمومی",
  "planForm.publicHelper": "پلن‌های عمومی در فهرست انتخاب کاربران نمایش داده می‌شوند.",
  "planForm.section.general": "اطلاعات عمومی",
  "planForm.section.version": "نسخه‌ی اول",
  "planForm.section.pricing": "قیمت پایه",
  "planForm.section.credit": "سیاست اعتبار",
  "planForm.section.upload": "آپلود",
  "planForm.section.features": "قابلیت‌ها",
  "planForm.section.addons": "اَدون‌ها",
  "planForm.sortOrderLabel": "ترتیب نمایش",
  "planForm.sortOrderHelper": "عدد کوچک‌تر زودتر نمایش داده می‌شود.",
  "planForm.tooltip.sortOrder":
    "ترتیب نمایش پلن‌ها در صفحه‌ی انتخاب کاربر: عدد کوچک‌تر یعنی پلن بالاتر و زودتر نمایش داده می‌شود.",
  "planForm.tooltip.billingInterval":
    "دوره‌ی پرداخت: کاربر هر چند وقت یک‌بار برای این پلن پرداخت می‌کند؛ مثلاً هر ۱ ماه یا هر ۳ ماه.",
  "planForm.versionTitleLabel": "عنوان نسخه",
  "planForm.versionTitlePlaceholder": "مثلاً نسخه‌ی پایه",
  "planForm.changeNotesLabel": "یادداشت تغییرات",
  "planForm.changeNotesPlaceholder": "تغییرات این نسخه…",
  "planForm.effectiveFromLabel": "شروع اثر",
  "planForm.effectiveFromHelper": "اگر پلن فعال باشد، باید ست شود.",
  "planForm.priceTypeLabel": "نوع قیمت",
  "planForm.amountLabel": "مبلغ",
  "planForm.amountHelper": "مبلغ اصلی (مثلاً ۱۹.۹۹) در ارز انتخاب‌شده.",
  "planForm.currencyLabel": "ارز",
  "planForm.currencyHelper": "کد سه‌حرفی ISO مثل USD.",
  "planForm.billingIntervalLabel": "بازه‌ی صورتحساب",
  "planForm.billingIntervalHelper": "بازه‌ی تکرار پرداخت.",
  "planForm.billingIntervalCountLabel": "تعداد بازه",
  "planForm.billingIntervalCountHelper": "مثلاً هر ۱ ماه یا هر ۳ ماه.",
  "planForm.trialDaysLabel": "روزهای آزمایشی",
  "planForm.trialDaysHelper": "صفر یعنی بدون دوره‌ی آزمایشی.",
  "planForm.creditWindowsHelper":
    "یک اعتبار کلی برای کل پلن تعریف کن و در صورت نیاز بازه‌های کوچک‌تر (مثلاً هفتگی یا ۵ ساعته) هم به آن اضافه کن.",
  "planForm.creditWindowPeriodLabel": "بازه",
  "planForm.creditWindowCountLabel": "تعداد بازه",
  "planForm.creditWindowAmountLabel": "مقدار اعتبار",
  "planForm.creditWindowAdd": "افزودن بازه",
  "planForm.creditWindowRemove": "حذف بازه",
  "planForm.period.total": "کل پلن",
  "planForm.period.hour": "ساعت",
  "planForm.period.day": "روز",
  "planForm.period.week": "هفته",
  "planForm.period.month": "ماه",
  "planForm.period.year": "سال",
  "planForm.uploadExtensionsLabel": "پسوندهای قابل آپلود",
  "planForm.uploadExtensionsPlaceholder": "mp3, wav, flac, m4a, ogg",
  "planForm.uploadExtensionsHelper":
    "پسوندها را با کاما جدا کن؛ این مجاز بودن آپلود مختص همین پلن است.",
  "planForm.rolloverLabel": "انتقال اعتبار باقی‌مانده",
  "planForm.rolloverHelper": "اعتبار مصرف‌نشده به دوره‌ی بعد منتقل شود.",
  "planForm.rolloverCapLabel": "سقف انتقال",
  "planForm.rolloverCapHelper":
    "حداکثر اعتبار قابل انتقال؛ نباید از گرنت ماهانه کمتر باشد.",
  "planForm.negativeBalanceLabel": "اجازه‌ی مانده‌ی منفی",
  "planForm.negativeBalanceHelper": "کاربر بتواند بیشتر از اعتبارش مصرف کند.",
  "planForm.maxNegativeBalanceLabel": "حداکثر مانده‌ی منفی",
  "planForm.maxNegativeBalanceHelper": "بیشترین مقدار منفی مجاز.",
  "planForm.featuresHelper":
    "قابلیت‌های این پلن؛ سقف و قیمت هر کدام بعداً در جدول نسخه تنظیم می‌شود.",
  "planForm.addonsHelper": "اَدون‌هایی که این پلن از آن‌ها پشتیبانی می‌کند.",
  "planForm.selectAllFeatures": "انتخاب همه",
  "planForm.noAddons": "هنوز اَدونی تعریف نشده است.",
  "planForm.statusLabel": "وضعیت پلن",
  "planForm.statusHelper": "پلن‌های فعال در دسترس کاربران هستند.",
  "planForm.create": "ساخت پلن",
  "planForm.save": "ذخیره",
  "planForm.cancel": "لغو",
  "planForm.archiveConfirmTitle": "بایگانی پلن؟",
  "planForm.archiveConfirmBody":
    "پلن «{name}» بایگانی می‌شود؛ داده‌ها حذف فیزیکی نمی‌شوند و می‌توانی بعداً وضعیتش را تغییر دهی.",
  "planForm.archiveConfirm": "بایگانی",
  "version.title": "عنوان نسخه",
  "version.effectiveFrom": "شروع اثر",
  "version.effectiveTo": "پایان اثر",
  "version.changeNotes": "یادداشت تغییرات",
  "version.noChangeNotes": "یادداشتی ثبت نشده است.",
  "version.noTitle": "بدون عنوان",
  "table.feature": "قابلیت",
  "table.kind": "نوع",
  "table.access": "دسترسی",
  "table.limit": "سقف",
  "table.period": "دوره",
  "table.behavior": "رفتار",
  "table.overage": "قیمت مازاد",
  "table.pricing": "قیمت‌گذاری",
  "table.actions": "عملیات",
  "table.searchPlaceholder": "جستجوی قابلیت‌ها…",
  "table.noResults": "موردی پیدا نشد.",
  "table.columns": "ستون‌ها",
  "table.selectedRows": "{selected} از {total} ردیف انتخاب شده است.",
  "table.pageOf": "صفحه {page} از {pages}",
  "table.previous": "قبلی",
  "table.next": "بعدی",
  "dialog.title": "ویرایش سقف قابلیت",
  "dialog.description":
    "سیاست این قابلیت را تنظیم کن؛ ذخیره به‌صورت یک نسخه‌ی پیش‌نویس جدید (v+1) اعمال می‌شود.",
  "dialog.version": "نسخه",
  "dialog.versionNote":
    "هر ویرایش، یک نسخه‌ی پیش‌نویس جدید (v+1) می‌سازد؛ نسخه‌ی قبلی تغییری نمی‌کند.",
  "dialog.accessSection": "دسترسی",
  "dialog.limitSection": "سقف مصرف",
  "dialog.pricingSection": "قیمت‌گذاری",
  "field.limitToggle.label": "سقف سفارشی",
  "field.limitToggle.helper": "خاموش یعنی نامحدود؛ روشن یعنی سقف ثبت می‌شود.",
  "field.pricingToggle.label": "قیمت‌گذاری سفارشی",
  "field.pricingToggle.helper": "خاموش یعنی رایگان؛ روشن یعنی قاعده‌ی قیمتی ثبت می‌شود.",
  "field.access.label": "دسترسی",
  "field.access.helper":
    "«ارث‌بری» یعنی تصمیم از وضعیت/پیش‌فرض خود قابلیت گرفته شود.",
  "field.limitMode.label": "سقف",
  "field.limitMode.helper": "«نامحدود» یعنی برای این نسخه محدودیتی ثبت نمی‌شود.",
  "field.limitValue.label": "مقدار سقف",
  "field.limitValue.helper": "عدد صحیح غیرمنفی؛ واحد آن از قابلیت می‌آید.",
  "field.period.label": "دوره",
  "field.period.helper": "بازه‌ی اعمال سقف (بدون دوره یعنی مادام‌العمر).",
  "field.behavior.label": "رفتار پس از سقف",
  "field.behavior.helper": "بستن یا اجازه‌ی مصرف مازاد با قیمت جداگانه.",
  "field.overage.label": "قیمت مازاد",
  "field.overage.helper": "قیمت هر واحد مصرف اضافه (اختیاری).",
  "field.pricingMode.label": "قیمت‌گذاری",
  "field.pricingMode.helper": "«رایگان» یعنی برای این نسخه قاعده‌ی قیمتی ثبت نمی‌شود.",
  "field.metric.label": "متریک",
  "field.metric.helper": "واحد اندازه‌گیری مصرف برای محاسبه‌ی هزینه.",
  "field.pricingModel.label": "مدل قیمت",
  "field.pricingModel.helper": "مدل تعیین قیمت (تخت/پلکانی/حجمی).",
  "field.currency.label": "ارز",
  "field.currency.helper": "کد سه‌حرفی ISO مثل USD.",
  "field.unitPrice.label": "قیمت واحد",
  "field.unitPrice.helper": "قیمت هر واحد مصرف به کوچک‌ترین واحد ارز.",
  "field.creditCost.label": "هزینه اعتباری",
  "field.creditCost.helper": "اعتبار مصرفی به‌ازای هر واحد.",
  "field.minimumCharge.label": "حداقل مبلغ",
  "field.minimumCharge.helper": "حداقل هزینه‌ی هر اجرا (اختیاری).",
  "actions.edit": "ویرایش",
  "actions.clone": "کلون",
  "actions.cloning": "در حال کلون…",
  "actions.cloned": "پلن جدید از این پلن ساخته شد.",
  "actions.cloneSuffix": "(کپی)",
  "actions.save": "ذخیره",
  "actions.saving": "در حال ذخیره…",
  "actions.saved": "سیاست قابلیت روی نسخه‌ی پلن ذخیره شد.",
  "actions.cancel": "لغو",
  "actions.createDraft": "ایجاد نسخه‌ی جدید از این نسخه",
  "actions.creatingDraft": "در حال ساخت نسخه…",
  "actions.createdDraft": "نسخه‌ی پیش‌نویس جدید ساخته شد.",
  "actions.publish": "انتشار",
  "actions.publishing": "در حال انتشار…",
  "actions.published": "نسخه منتشر شد؛ نسخه‌های منتشرشده‌ی قبلی بازنشسته شدند.",
  "actions.publishConfirmTitle": "انتشار نسخه؟",
  "actions.publishConfirmBody":
    "نسخه‌ی پیش‌نویس v{version} منتشر می‌شود و نسخه‌های منتشرشده‌ی قبلی این پلن بازنشسته می‌شوند.",
  "actions.planCreated": "پلن ساخته شد و نسخه‌ی پیش‌نویس اول (v1) ایجاد شد.",
  "actions.planUpdated": "اطلاعات پلن به‌روزرسانی شد.",
  "actions.planArchived": "پلن بایگانی شد.",
  "actions.failed": "ذخیره انجام نشد؛ دوباره تلاش کن.",
  "errors.limitWhole": "سقف باید عدد صحیح غیرمنفی باشد.",
  "errors.overageWhole": "قیمت مازاد باید عدد صحیح غیرمنفی باشد.",
  "errors.currency": "کد ارز باید سه حرف لاتین باشد.",
  "errors.priceWhole": "قیمت باید عدد صحیح غیرمنفی باشد.",
  "errors.reviewFields": "مقادیر فرم را بررسی کن.",
  "errors.notFound": "پلن یا قابلیت پیدا نشد.",
  "errors.versionNotFound": "پلن یا نسخه پیدا نشد.",
  "errors.notDraft": "فقط نسخه‌های پیش‌نویس قابل انتشار هستند.",
  "errors.nameShort": "نام پلن باید حداقل ۲ کاراکتر باشد.",
  "errors.codeInvalid": "کد باید با حروف کوچک لاتین، عدد، خط تیره یا زیرخط نوشته شود.",
  "errors.codeInUse": "این کد قبلاً استفاده شده است.",
  "errors.amountInvalid": "مبلغ باید عدد با حداکثر ۲ رقم اعشار باشد.",
  "errors.amountTooLarge": "مبلغ خیلی بزرگ است.",
  "errors.creditWindowsRequired": "حداقل یک بازه‌ی اعتبار تعریف کن.",
  "errors.dateInvalid": "تاریخ معتبر نیست.",
  "errors.activeRequiresDate": "پلن فعال باید تاریخ شروع اثر داشته باشد.",
  "errors.rolloverCapLow": "سقف انتقال نباید از مجموع اعتبار بازه‌ها کمتر باشد.",
  "errors.negativeLimit": "حداکثر مانده‌ی منفی باید بزرگ‌تر از صفر باشد.",
  "errors.sourceRequired": "پلن مبدأ را انتخاب کن.",
  "errors.sourceUnavailable": "پلن مبدأ پیدا نشد یا قابل کلون نیست.",
  "errors.noVersionToClone": "پلن مبدأ نسخه‌ای برای کلون ندارد.",
  "errors.planNotFound": "پلن پیدا نشد.",
  "errors.commitFailed": "ذخیره در پایگاه داده انجام نشد؛ دوباره تلاش کن.",
};

const en: Record<PlansKey, string> = {
  "page.title": "Plans & limits",
  "page.subtitle":
    "Entitlement limits (file size, audio duration, storage quota, …) are defined per feature and per plan version; a user is connected to one primary plan through a subscription.",
  "summary.totalPlans": "Total plans",
  "summary.activePlans": "Active plans",
  "summary.publishedVersions": "Published versions",
  "summary.activeSubscribers": "Active subscribers",
  "values.all": "All",
  "status.draft": "Draft",
  "status.active": "Active",
  "status.archived": "Archived",
  "versionStatus.draft": "Draft",
  "versionStatus.published": "Published",
  "versionStatus.retired": "Retired",
  "values.public": "Public",
  "values.private": "Private",
  "values.inherit": "Inherit",
  "values.allow": "Allowed",
  "values.deny": "Denied",
  "values.unlimited": "Unlimited",
  "values.custom": "Custom",
  "values.block": "Block",
  "values.allowOverage": "Allow overage",
  "values.free": "Free",
  "values.recurring": "Recurring",
  "values.oneTime": "One-time",
  "interval.day": "day",
  "interval.week": "week",
  "interval.month": "month",
  "interval.year": "year",
  "kind.boolean": "Boolean",
  "kind.metered": "Metered",
  "kind.quota": "Quota",
  "kind.package": "Package",
  "period.none": "—",
  "period.day": "Daily",
  "period.week": "Weekly",
  "period.month": "Monthly",
  "metric.unit": "Unit",
  "metric.minute": "Minute",
  "metric.megabyte": "Megabyte",
  "metric.request": "Request",
  "metric.seat": "Seat",
  "plan.none": "No plans have been created yet.",
  "plan.noMatches": "No plans match these filters.",
  "plan.noVersions": "This plan has no versions yet.",
  "plan.noFeatures": "No features defined yet — create them in the Features workspace first.",
  "plan.searchPlaceholder": "Search plans…",
  "plan.create": "Create plan",
  "plan.edit": "Edit plan",
  "plan.archive": "Archive plan",
  "plan.credit": "Credit grant",
  "plan.windows": "windows",
  "plan.addons": "Add-ons",
  "planForm.title": "Create plan",
  "planForm.description":
    "Create a plan with base pricing, credit policy, features and add-ons; the first version (v1) is created as a draft.",
  "planForm.editTitle": "Edit plan",
  "planForm.editDescription":
    "Edit name, description, visibility and status; the code is stable after creation.",
  "planForm.nameLabel": "Plan name",
  "planForm.namePlaceholder": "e.g. Professional",
  "planForm.codeLabel": "Code",
  "planForm.codeHelper": "Lowercase latin letters, digits, dashes or underscores.",
  "planForm.codeReadonlyHelper": "The code cannot be changed after creation.",
  "planForm.descriptionLabel": "Description",
  "planForm.descriptionPlaceholder": "Short description of this plan…",
  "planForm.publicLabel": "Public plan",
  "planForm.publicHelper": "Public plans appear in the user-facing plan picker.",
  "planForm.section.general": "General",
  "planForm.section.version": "First version",
  "planForm.section.pricing": "Base pricing",
  "planForm.section.credit": "Credit policy",
  "planForm.section.upload": "Upload",
  "planForm.section.features": "Features",
  "planForm.section.addons": "Add-ons",
  "planForm.sortOrderLabel": "Sort order",
  "planForm.sortOrderHelper": "Smaller numbers appear first.",
  "planForm.tooltip.sortOrder":
    "Plan ordering in the user-facing picker: smaller numbers appear earlier.",
  "planForm.tooltip.billingInterval":
    "Payment period: how often the user pays for this plan, e.g. every 1 month or every 3 months.",
  "planForm.versionTitleLabel": "Version title",
  "planForm.versionTitlePlaceholder": "e.g. Core release",
  "planForm.changeNotesLabel": "Change notes",
  "planForm.changeNotesPlaceholder": "What changed in this version…",
  "planForm.effectiveFromLabel": "Effective from",
  "planForm.effectiveFromHelper": "Required when the plan is active.",
  "planForm.priceTypeLabel": "Price type",
  "planForm.amountLabel": "Amount",
  "planForm.amountHelper": "Major amount (e.g. 19.99) in the selected currency.",
  "planForm.currencyLabel": "Currency",
  "planForm.currencyHelper": "ISO 3-letter code such as USD.",
  "planForm.billingIntervalLabel": "Billing interval",
  "planForm.billingIntervalHelper": "How often the plan renews.",
  "planForm.billingIntervalCountLabel": "Interval count",
  "planForm.billingIntervalCountHelper": "e.g. every 1 month or every 3 months.",
  "planForm.trialDaysLabel": "Trial days",
  "planForm.trialDaysHelper": "Zero means no trial.",
  "planForm.creditWindowsHelper":
    "Define an overall credit amount for the whole plan and add smaller windows on top (e.g. weekly or 5-hour).",
  "planForm.creditWindowPeriodLabel": "Period",
  "planForm.creditWindowCountLabel": "Period count",
  "planForm.creditWindowAmountLabel": "Credit amount",
  "planForm.creditWindowAdd": "Add window",
  "planForm.creditWindowRemove": "Remove window",
  "planForm.period.total": "Whole plan",
  "planForm.period.hour": "hour",
  "planForm.period.day": "day",
  "planForm.period.week": "week",
  "planForm.period.month": "month",
  "planForm.period.year": "year",
  "planForm.uploadExtensionsLabel": "Allowed upload extensions",
  "planForm.uploadExtensionsPlaceholder": "mp3, wav, flac, m4a, ogg",
  "planForm.uploadExtensionsHelper":
    "Comma-separated extensions; this allowlist belongs to this plan only.",
  "planForm.rolloverLabel": "Rollover unused credits",
  "planForm.rolloverHelper": "Carry unused credits into the next period.",
  "planForm.rolloverCapLabel": "Rollover cap",
  "planForm.rolloverCapHelper":
    "Maximum credits carried over; must be at least the monthly grant.",
  "planForm.negativeBalanceLabel": "Allow negative balance",
  "planForm.negativeBalanceHelper": "Let users consume beyond their balance.",
  "planForm.maxNegativeBalanceLabel": "Max negative balance",
  "planForm.maxNegativeBalanceHelper": "Largest allowed negative balance.",
  "planForm.featuresHelper":
    "Features included in this plan; per-feature limits and pricing are configured later in the version table.",
  "planForm.addonsHelper": "Add-ons available with this plan.",
  "planForm.selectAllFeatures": "Select all",
  "planForm.noAddons": "No add-ons defined yet.",
  "planForm.statusLabel": "Plan status",
  "planForm.statusHelper": "Active plans are available to users.",
  "planForm.create": "Create plan",
  "planForm.save": "Save",
  "planForm.cancel": "Cancel",
  "planForm.archiveConfirmTitle": "Archive plan?",
  "planForm.archiveConfirmBody":
    "Plan “{name}” will be archived; data is never deleted and you can change its status later.",
  "planForm.archiveConfirm": "Archive",
  "version.title": "Version title",
  "version.effectiveFrom": "Effective from",
  "version.effectiveTo": "Effective to",
  "version.changeNotes": "Change notes",
  "version.noChangeNotes": "No change notes recorded.",
  "version.noTitle": "Untitled",
  "table.feature": "Feature",
  "table.kind": "Kind",
  "table.access": "Access",
  "table.limit": "Limit",
  "table.period": "Period",
  "table.behavior": "Behavior",
  "table.overage": "Overage price",
  "table.pricing": "Pricing",
  "table.actions": "Actions",
  "table.searchPlaceholder": "Search features…",
  "table.noResults": "No results found.",
  "table.columns": "Columns",
  "table.selectedRows": "{selected} of {total} row(s) selected.",
  "table.pageOf": "Page {page} of {pages}",
  "table.previous": "Previous",
  "table.next": "Next",
  "dialog.title": "Edit feature limit",
  "dialog.description":
    "Configure this feature's policy; saving applies it to a new draft version (v+1).",
  "dialog.version": "Version",
  "dialog.versionNote":
    "Every edit creates a new draft version (v+1); the previous version stays unchanged.",
  "dialog.accessSection": "Access",
  "dialog.limitSection": "Usage limit",
  "dialog.pricingSection": "Pricing",
  "field.limitToggle.label": "Custom limit",
  "field.limitToggle.helper": "Off means unlimited; on records a limit.",
  "field.pricingToggle.label": "Custom pricing",
  "field.pricingToggle.helper": "Off means free; on records a pricing rule.",
  "field.access.label": "Access",
  "field.access.helper":
    "“Inherit” defers to the feature's own status/default.",
  "field.limitMode.label": "Limit",
  "field.limitMode.helper": "“Unlimited” records no limit for this version.",
  "field.limitValue.label": "Limit value",
  "field.limitValue.helper": "Non-negative integer; the unit comes from the feature.",
  "field.period.label": "Period",
  "field.period.helper": "Window the limit applies to (no period = lifetime).",
  "field.behavior.label": "Overage behavior",
  "field.behavior.helper": "Block, or allow overage at a separate price.",
  "field.overage.label": "Overage price",
  "field.overage.helper": "Price per extra unit of consumption (optional).",
  "field.pricingMode.label": "Pricing",
  "field.pricingMode.helper": "“Free” records no pricing rule for this version.",
  "field.metric.label": "Metric",
  "field.metric.helper": "Usage measurement unit for cost calculation.",
  "field.pricingModel.label": "Pricing model",
  "field.pricingModel.helper": "Flat, tiered, or volume pricing.",
  "field.currency.label": "Currency",
  "field.currency.helper": "ISO 3-letter code such as USD.",
  "field.unitPrice.label": "Unit price",
  "field.unitPrice.helper": "Price per usage unit in minor units.",
  "field.creditCost.label": "Credit cost",
  "field.creditCost.helper": "Credits consumed per unit.",
  "field.minimumCharge.label": "Minimum charge",
  "field.minimumCharge.helper": "Minimum cost per execution (optional).",
  "actions.edit": "Edit",
  "actions.clone": "Clone",
  "actions.cloning": "Cloning…",
  "actions.cloned": "A new plan was created from this plan.",
  "actions.cloneSuffix": "(copy)",
  "actions.save": "Save",
  "actions.saving": "Saving…",
  "actions.saved": "Feature policy saved on the plan version.",
  "actions.cancel": "Cancel",
  "actions.createDraft": "Create new version from this version",
  "actions.creatingDraft": "Creating version…",
  "actions.createdDraft": "New draft version created.",
  "actions.publish": "Publish",
  "actions.publishing": "Publishing…",
  "actions.published": "Version published; previous published versions retired.",
  "actions.publishConfirmTitle": "Publish version?",
  "actions.publishConfirmBody":
    "Draft version v{version} will be published and previously published versions of this plan will be retired.",
  "actions.planCreated": "Plan created with its first draft version (v1).",
  "actions.planUpdated": "Plan details updated.",
  "actions.planArchived": "Plan archived.",
  "actions.failed": "Save failed; please try again.",
  "errors.limitWhole": "Limit must be a non-negative whole number.",
  "errors.overageWhole": "Overage price must be a non-negative whole number.",
  "errors.currency": "Currency must be a 3-letter ISO code.",
  "errors.priceWhole": "Price must be a non-negative whole number.",
  "errors.reviewFields": "Review the form fields.",
  "errors.notFound": "Plan version or feature not found.",
  "errors.versionNotFound": "Plan or version not found.",
  "errors.notDraft": "Only draft versions can be published.",
  "errors.nameShort": "Plan name must be at least 2 characters.",
  "errors.codeInvalid": "Code must use lowercase latin letters, digits, dashes or underscores.",
  "errors.codeInUse": "This code is already in use.",
  "errors.amountInvalid": "Amount must be a number with up to 2 decimal places.",
  "errors.amountTooLarge": "Amount is too large.",
  "errors.creditWindowsRequired": "Define at least one credit window.",
  "errors.dateInvalid": "Enter a valid date.",
  "errors.activeRequiresDate": "An active plan requires an effective date.",
  "errors.rolloverCapLow": "Rollover cap cannot be less than the total credit across windows.",
  "errors.negativeLimit": "Max negative balance must be greater than zero.",
  "errors.sourceRequired": "Select a source plan.",
  "errors.sourceUnavailable": "Source plan not found or not clonable.",
  "errors.noVersionToClone": "Source plan has no version to clone.",
  "errors.planNotFound": "Plan not found.",
  "errors.commitFailed": "Database write failed; please try again.",
};

export function translate(locale: "fa" | "en", key: PlansKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
