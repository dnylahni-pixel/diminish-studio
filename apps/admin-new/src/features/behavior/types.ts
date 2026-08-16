import type { SettingsListData } from "@/features/settings/types";

export type BehaviorLayer = "BE" | "FE" | "DB";
export type BehaviorStatus = "hardcoded" | "scheduled" | "connected";

export interface BehaviorItem {
  code: string;
  value: string;
  layer: BehaviorLayer;
  status: BehaviorStatus;
}

export interface BehaviorSectionData {
  key: "content" | "integrations";
  items: BehaviorItem[];
}

export interface BehaviorControlData {
  /** تنظیمات واقعی و قابل ویرایش از رجیستری app_settings. */
  settings: SettingsListData;
  /** بخش‌هایی که هنوز به کانفیگ runtime وصل نشده‌اند (فقط پیش‌نمایش). */
  pending: BehaviorSectionData[];
}
