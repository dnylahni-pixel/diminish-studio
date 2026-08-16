import type {
  SettingKey,
  SettingValue,
  SettingsGroup,
  SettingValueType,
} from "@/db/schema";

/**
 * Action-state shape for the settings workspace — mirrors `FeatureActionState`
 * so the client can render per-field errors and a localized message.
 */
export interface SettingsActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
}

/** A single setting row: current DB value joined with its registry entry. */
export interface SettingListItem {
  key: SettingKey;
  group: SettingsGroup;
  valueType: SettingValueType;
  /** The registry default (the typed "reset" value). */
  defaultValue: SettingValue;
  /**
   * The current stored value, or `null` when the key has never been written
   * (not seeded yet). The UI renders `value ?? defaultValue` as a draft.
   */
  value: SettingValue | null;
  /** Backend-contract description from the registry (English). */
  description: string;
  /** Monotonic per-key revision; `null` until the key has been written. */
  versionNumber: number | null;
  updatedBy: string | null;
  /** ISO timestamp of the last write; `null` until the key has been written. */
  updatedAt: string | null;
}

/** A registry group with its settings, in registry order. */
export interface SettingsGroupData {
  group: SettingsGroup;
  items: SettingListItem[];
}

/** The full payload the Settings workspace renders. */
export interface SettingsListData {
  groups: SettingsGroupData[];
  /** How many registry keys were moved to the Plans workspace (entitlements). */
  movedCount: number;
}

/** Serializable input for `saveSetting` (server action). */
export interface SaveSettingInput {
  key: SettingKey;
  value: SettingValue;
  changeReason: string;
}
