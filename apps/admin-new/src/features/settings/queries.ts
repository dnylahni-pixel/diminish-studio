import { db } from "@/db";
import { appSettings, SETTINGS_REGISTRY } from "@/db/schema";
import type {
  SettingListItem,
  SettingsGroupData,
  SettingsListData,
} from "./types";

/**
 * Entitlement-like keys that must NOT be managed as global settings.
 * They live in the catalog: feature + plan_limits + subscription. The
 * registry itself stays intact (it mirrors packages/db); these rows are
 * simply hidden from the Settings workspace and surfaced in the Plans tab.
 */
const SETTINGS_MOVED_TO_PLAN = new Set([
  "upload.max_file_size_bytes",
  "upload.max_duration_s",
  "upload.allowed_mime_types",
  "storage.quota_default_bytes",
]);

/**
 * Read-only server query for the Settings workspace.
 *
 * Returns every registry key joined with its current `app_settings` row
 * (value / version / updated_by / updated_at), grouped in registry order.
 * Keys that have never been written (not seeded) are still returned with
 * `value: null` so the UI can fall back to the registry default.
 *
 * No `"use server"` directive — like `features/queries.ts`, this is a plain
 * server function invoked from server components.
 */
export async function getSettingsListData(): Promise<SettingsListData> {
  const rows = await db.select().from(appSettings);
  const rowByKey = new Map(rows.map((row) => [row.key, row]));
  const itemsByGroup = new Map<string, SettingListItem[]>();
  let movedCount = 0;

  for (const entry of SETTINGS_REGISTRY) {
    if (SETTINGS_MOVED_TO_PLAN.has(entry.key)) {
      movedCount += 1;
      continue;
    }
    const row = rowByKey.get(entry.key);
    const groupItems = itemsByGroup.get(entry.group) ?? [];
    groupItems.push({
      key: entry.key,
      group: entry.group,
      valueType: entry.valueType,
      defaultValue: entry.defaultValue,
      value: row?.value ?? null,
      description: entry.description,
      versionNumber: row?.versionNumber ?? null,
      updatedBy: row?.updatedBy ?? null,
      updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    });
    itemsByGroup.set(entry.group, groupItems);
  }

  const groups: SettingsGroupData[] = [...itemsByGroup.entries()].map(
    ([group, items]) => ({ group: group as SettingsGroupData["group"], items }),
  );

  return { groups, movedCount };
}
