export type Locale = "fa" | "en";

export type ShellKey =
  | "nav.behaviorGroup"
  | "nav.behavior"
  | "nav.workspace"
  | "nav.overview"
  | "nav.users"
  | "nav.monetization"
  | "nav.subscriptions"
  | "nav.plans"
  | "nav.features"
  | "nav.credits"
  | "nav.billing"
  | "nav.promotions"
  | "nav.integrations"
  | "nav.runpod"
  | "nav.intelligence"
  | "nav.reports"
  | "nav.alerts"
  | "nav.system"
  | "nav.admin"
  | "nav.settings"
  | "nav.lab"
  | "nav.labArea"
  | "nav.labBadge"
  | "sidebar.navigation"
  | "sidebar.close"
  | "sidebar.footer"
  | "header.collapse"
  | "header.expand"
  | "header.search"
  | "header.theme"
  | "header.notifications"
  | "header.account"
  | "header.language"
  | "menu.title"
  | "menu.profile"
  | "menu.settings"
  | "menu.signout";

const fa: Record<ShellKey, string> = {
  "nav.behaviorGroup": "کنترل رفتار",
  "nav.behavior": "اتاق کنترل",
  "nav.workspace": "فضای کار",
  "nav.overview": "نمای کلی",
  "nav.users": "کاربران",
  "nav.monetization": "درآمدزایی",
  "nav.subscriptions": "اشتراک‌ها",
  "nav.plans": "پلن‌ها و قیمت‌گذاری",
  "nav.features": "قابلیت‌ها",
  "nav.credits": "اعتبارها",
  "nav.billing": "صورت‌حساب",
  "nav.promotions": "تخفیف‌ها",
  "nav.integrations": "یکپارچه‌سازی‌ها",
  "nav.runpod": "ران‌پاد",
  "nav.intelligence": "هوشمندی",
  "nav.reports": "گزارش‌ها",
  "nav.alerts": "هشدارها",
  "nav.system": "سیستم",
  "nav.admin": "مدیریت و امنیت",
  "nav.settings": "تنظیمات",
  "nav.lab": "آزمایشگاه",
  "nav.labArea": "ناحیه‌ی بازبینی",
  "nav.labBadge": "پیش‌نویس",
  "sidebar.navigation": "ناوبری سایدبار",
  "sidebar.close": "بستن سایدبار",
  "sidebar.footer": "آزمایشگاه · پیش‌نویس",
  "header.collapse": "بستن سایدبار",
  "header.expand": "باز کردن سایدبار",
  "header.search": "جستجو",
  "header.theme": "تغییر تم",
  "header.notifications": "اعلان‌ها",
  "header.account": "حساب کاربری",
  "header.language": "تغییر زبان",
  "menu.title": "منو",
  "menu.profile": "پروفایل",
  "menu.settings": "تنظیمات",
  "menu.signout": "خروج",
};

const en: Record<ShellKey, string> = {
  "nav.behaviorGroup": "Behavior Control",
  "nav.behavior": "Control Room",
  "nav.workspace": "Workspace",
  "nav.overview": "Overview",
  "nav.users": "Users",
  "nav.monetization": "Monetization",
  "nav.subscriptions": "Subscriptions",
  "nav.plans": "Plans & Pricing",
  "nav.features": "Features",
  "nav.credits": "Credits",
  "nav.billing": "Billing",
  "nav.promotions": "Promotions",
  "nav.integrations": "Integrations",
  "nav.runpod": "RunPod",
  "nav.intelligence": "Intelligence",
  "nav.reports": "Reports",
  "nav.alerts": "Alerts",
  "nav.system": "System",
  "nav.admin": "Admin & Security",
  "nav.settings": "Settings",
  "nav.lab": "Review Lab",
  "nav.labArea": "Review area",
  "nav.labBadge": "Draft",
  "sidebar.navigation": "Sidebar navigation",
  "sidebar.close": "Close sidebar",
  "sidebar.footer": "Review Lab · Draft",
  "header.collapse": "Collapse sidebar",
  "header.expand": "Expand sidebar",
  "header.search": "Search",
  "header.theme": "Toggle theme",
  "header.notifications": "Notifications",
  "header.account": "Account menu",
  "header.language": "Change language",
  "menu.title": "Menu",
  "menu.profile": "Profile",
  "menu.settings": "Settings",
  "menu.signout": "Sign out",
};

export function translate(locale: Locale, key: ShellKey): string {
  return locale === "fa" ? fa[key] : en[key];
}
