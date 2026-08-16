import type { BehaviorSectionData } from "./types";

/**
 * رفتارهایی که هنوز به کانفیگ runtime وصل نشده‌اند.
 *
 * این بخش‌ها فعلاً فقط پیش‌نمایش هستند؛ وقتی لایه کانفیگ/مصرف‌کننده‌شان ساخته شد،
 * از اینجا به رجیستری واقعی `app_settings` منتقل می‌شوند.
 */
export const BEHAVIOR_PENDING: BehaviorSectionData[] = [
  {
    key: "content",
    items: [
      { code: "home.hero", value: "سخت‌کد در home.tsx", layer: "FE", status: "hardcoded" },
      { code: "home.features", value: "سخت‌کد در home.tsx", layer: "FE", status: "hardcoded" },
      { code: "copy.library.empty_state", value: "«No songs found…»", layer: "FE", status: "hardcoded" },
      { code: "copy.library.error_state", value: "«Failed to load songs.»", layer: "FE", status: "hardcoded" },
      { code: "copy.storage.almost_full", value: "«Almost full»", layer: "FE", status: "hardcoded" },
    ],
  },
  {
    key: "integrations",
    items: [
      { code: "integrations.runpod", value: "فقط env", layer: "BE", status: "hardcoded" },
      { code: "integrations.b2", value: "فقط env", layer: "BE", status: "hardcoded" },
      { code: "integrations.clerk", value: "فقط env", layer: "BE", status: "hardcoded" },
    ],
  },
];
