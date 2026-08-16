import { getSettingsListData } from "@/features/settings/queries";
import { BEHAVIOR_PENDING } from "./catalog";
import type { BehaviorControlData } from "./types";

export async function getBehaviorControlData(): Promise<BehaviorControlData> {
  const settings = await getSettingsListData();
  return { settings, pending: BEHAVIOR_PENDING };
}
