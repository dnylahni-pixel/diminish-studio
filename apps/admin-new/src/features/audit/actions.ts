"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  SETTINGS_REGISTRY,
  settingsVersions,
  type SettingKey,
} from "@/db/schema";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { translate, type AuditKey } from "@/i18n/audit";
import { saveSetting } from "@/features/settings/actions";
import type { RestoreActionState } from "./types";

/** The closed set of valid keys, as a zod enum (never freeform). */
const settingKeySchema = z.enum(
  SETTINGS_REGISTRY.map((entry) => entry.key) as [
    SettingKey,
    ...SettingKey[],
  ],
);

function actionError(
  message: string,
  fieldErrors: RestoreActionState["fieldErrors"] = {},
): RestoreActionState {
  return { status: "error", message, fieldErrors };
}

/**
 * Restore a historical `settings_versions` value for a setting key.
 *
 * The historical row is never mutated — the version history is append-only.
 * Instead the old value is persisted as a NEW version by reusing the existing
 * `saveSetting` action (which validates the value, writes the next version row,
 * bumps `app_settings`, and appends the audit entry), with a change reason of
 * `restore of v{n}`.
 */
export async function restoreSettingVersion(
  key: string,
  versionNumber: number,
  locale: Locale = defaultLocale,
): Promise<RestoreActionState> {
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const t = (auditKey: AuditKey) => translate(activeLocale, auditKey);

  const keyResult = settingKeySchema.safeParse(key);
  if (!keyResult.success) {
    return actionError(t("restore.errors.invalidKey"), {
      key: keyResult.error.flatten().formErrors,
    });
  }
  const settingKey = keyResult.data;

  const versionResult = z.number().int().positive().safeParse(versionNumber);
  if (!versionResult.success) {
    return actionError(t("restore.errors.invalidVersion"));
  }
  const requestedVersion = versionResult.data;

  const rows = await db
    .select()
    .from(settingsVersions)
    .where(
      and(
        eq(settingsVersions.key, settingKey),
        eq(settingsVersions.versionNumber, requestedVersion),
      ),
    )
    .limit(1);
  const historical = rows[0];
  if (!historical) {
    return actionError(t("restore.errors.versionNotFound"));
  }

  const result = await saveSetting(
    settingKey,
    historical.value,
    `restore of v${requestedVersion}`,
    activeLocale,
  );
  if (result.status !== "success") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }

  // saveSetting already revalidates `/lab`; keeping it here makes the restore
  // action self-contained regardless of that implementation detail.
  revalidatePath("/lab");

  return {
    status: "success",
    message: t("restore.success")
      .replace("{key}", settingKey)
      .replace("{version}", String(requestedVersion)),
    fieldErrors: {},
  };
}
