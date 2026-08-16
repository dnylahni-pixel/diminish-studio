import { pathToFileURL } from "node:url";

import { db, pool } from "./index";
import { appSettingsTable, settingsVersionsTable } from "./schema/app-settings";
import { SETTINGS_REGISTRY } from "./schema/settings-registry";

/**
 * Seed the settings "hub" with the registry defaults.
 *
 * Idempotent: existing keys/versions are left untouched (ON CONFLICT DO
 * NOTHING), so this can be re-run after every deploy without clobbering
 * admin-edited values. Each default also writes its initial row into the
 * append-only `settings_versions` history so the audit trail is complete
 * from the very first version.
 */
export async function seedSettings(): Promise<void> {
  const settingsRows = SETTINGS_REGISTRY.map((entry) => ({
    key: entry.key,
    value: entry.defaultValue,
    valueType: entry.valueType,
    versionNumber: 1,
    updatedBy: "seed",
  }));

  const versionRows = SETTINGS_REGISTRY.map((entry) => ({
    key: entry.key,
    value: entry.defaultValue,
    versionNumber: 1,
    changeReason: "seed: initial default",
    changedBy: "seed",
  }));

  await db.transaction(async (tx) => {
    await tx
      .insert(appSettingsTable)
      .values(settingsRows)
      .onConflictDoNothing();
    await tx
      .insert(settingsVersionsTable)
      .values(versionRows)
      .onConflictDoNothing({
        target: [
          settingsVersionsTable.key,
          settingsVersionsTable.versionNumber,
        ],
      });
  });

  console.log(
    `[seed] ensured ${SETTINGS_REGISTRY.length} settings (idempotent)`,
  );
}

// Run directly: `pnpm --filter @workspace/db seed`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSettings()
    .then(() => pool.end())
    .catch((err: unknown) => {
      console.error("[seed] failed:", err);
      process.exitCode = 1;
    });
}
