"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, sqlClient } from "@/db";
import {
  appSettings,
  getSettingsEntry,
  SETTINGS_REGISTRY,
  type SettingKey,
  type SettingValue,
} from "@/db/schema";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { translate, type SettingsKey } from "@/i18n/settings";
import type { SettingsActionState } from "./types";

/**
 * admin-new has no auth wiring yet — the legacy identity-adapter grants every
 * actor the `owner` role. Until Clerk is attached to the admin app, audit rows
 * and `app_settings.updated_by` are stamped with this constant.
 */
const SETTINGS_ACTOR = "owner";

/** The closed set of valid keys, as a zod enum (never freeform). */
const settingKeySchema = z.enum(
  SETTINGS_REGISTRY.map((entry) => entry.key) as [
    SettingKey,
    ...SettingKey[],
  ],
);

type SettingsT = (key: SettingsKey) => string;

/**
 * Build a per-entry value schema from the registry. Number/object fields are
 * validated strictly; the two known object shapes get typed sub-schemas
 * instead of a freeform JSON blob.
 */
function buildValueSchema(key: SettingKey, t: SettingsT): z.ZodType<SettingValue> {
  const entry = getSettingsEntry(key);
  switch (entry.valueType) {
    case "boolean":
      return z.boolean({ message: t("errors.invalidBoolean") });
    case "number":
      return z
        .number({ message: t("errors.invalidNumber") })
        .finite(t("errors.invalidNumber"));
    case "string":
      return z
        .string({ message: t("errors.invalidString") })
        .max(4000, t("errors.stringTooLong"));
    case "string[]":
      return z
        .array(
          z.string().min(1).max(300),
          { message: t("errors.invalidStringArray") },
        )
        .max(100, t("errors.tooManyItems"));
    case "number[]":
      return z
        .array(
          z.number().finite(),
          { message: t("errors.invalidNumberArray") },
        )
        .max(100, t("errors.tooManyItems"));
    case "object":
      switch (key) {
        case "upload.rate_limit":
          return z.object({
            max: z
              .number({ message: t("errors.rateLimitMax") })
              .int(t("errors.rateLimitMax"))
              .positive(t("errors.rateLimitMax")),
            windowMs: z
              .number({ message: t("errors.rateLimitWindowMs") })
              .int(t("errors.rateLimitWindowMs"))
              .positive(t("errors.rateLimitWindowMs")),
          });
        case "ui.storage_warning_thresholds":
          return z
            .object({
              warn: z
                .number({ message: t("errors.thresholdWarn") })
                .min(0, t("errors.thresholdWarn"))
                .max(100, t("errors.thresholdWarn")),
              critical: z
                .number({ message: t("errors.thresholdCritical") })
                .min(0, t("errors.thresholdCritical"))
                .max(100, t("errors.thresholdCritical")),
            })
            .superRefine((value, context) => {
              if (value.warn > value.critical) {
                context.addIssue({
                  code: "custom",
                  path: ["warn"],
                  message: t("errors.thresholdOrder"),
                });
              }
            });
        default:
          return z.record(z.string(), z.unknown());
      }
  }
}

function actionError(message: string, fieldErrors: SettingsActionState["fieldErrors"] = {}): SettingsActionState {
  return { status: "error", message, fieldErrors };
}

/**
 * Persist a single setting value. Validates the key against the closed registry
 * and the value against the entry's valueType, then writes — in ONE transaction:
 *   1. a new row in `settings_versions` (next version for the key),
 *   2. the `app_settings` row (version bumped to the same next version),
 *   3. an `admin_audit_log` row carrying before/after for the change.
 */
export async function saveSetting(
  key: string,
  value: SettingValue,
  changeReason: string,
  locale: Locale = "fa",
): Promise<SettingsActionState> {
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const t: SettingsT = (settingsKey) => translate(activeLocale, settingsKey);

  const keyResult = settingKeySchema.safeParse(key);
  if (!keyResult.success) {
    return actionError(t("errors.invalidKey"), {
      key: keyResult.error.flatten().formErrors,
    });
  }
  const settingKey = keyResult.data;

  const valueSchema = buildValueSchema(settingKey, t);
  const valueResult = valueSchema.safeParse(value);
  if (!valueResult.success) {
    const flattened = valueResult.error.flatten() as {
      formErrors: string[];
      fieldErrors: Record<string, string[] | undefined>;
    };
    const fieldErrors: SettingsActionState["fieldErrors"] = {
      ...flattened.fieldErrors,
      ...(flattened.formErrors.length > 0
        ? { value: flattened.formErrors }
        : {}),
    };
    return actionError(t("errors.invalidValue"), fieldErrors);
  }
  const after: SettingValue = valueResult.data as SettingValue;

  const entry = getSettingsEntry(settingKey);
  const existingRows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, settingKey))
    .limit(1);
  const existing = existingRows[0];

  const before = existing?.value ?? null;
  const nextVersion = (existing?.versionNumber ?? 0) + 1;
  const trimmedReason = (changeReason ?? "").trim();
  const reason = trimmedReason ? trimmedReason : null;
  const versionRef = `${settingKey}@v${nextVersion}`;

  // Order matters: `settings_versions.key` has an FK to `app_settings.key`, so
  // the app_settings upsert must run first — a never-seeded key would otherwise
  // fail the FK check when the version row is inserted.
  const queries = [
    sqlClient`
      INSERT INTO app_settings (
        key, value, value_type, version_number, updated_by, updated_at
      ) VALUES (
        ${settingKey},
        ${JSON.stringify(after)}::jsonb,
        ${entry.valueType},
        ${nextVersion},
        ${SETTINGS_ACTOR},
        NOW()
      )
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        value_type = EXCLUDED.value_type,
        version_number = EXCLUDED.version_number,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `,
    sqlClient`
      INSERT INTO settings_versions (
        key, value, version_number, change_reason, changed_by
      ) VALUES (
        ${settingKey},
        ${JSON.stringify(after)}::jsonb,
        ${nextVersion},
        ${reason},
        ${SETTINGS_ACTOR}
      )
    `,
    sqlClient`
      INSERT INTO admin_audit_log (
        actor, action, entity_type, entity_key, before, after, version_ref
      ) VALUES (
        ${SETTINGS_ACTOR},
        'settings.updated',
        'app_settings',
        ${settingKey},
        ${before === null ? null : JSON.stringify(before)}::jsonb,
        ${JSON.stringify(after)}::jsonb,
        ${versionRef}
      )
    `,
  ];

  try {
    await sqlClient.transaction(queries);
  } catch (error) {
    return actionError(t("actions.failed"));
  }

  revalidatePath("/lab");
  revalidatePath("/behavior");
  return { status: "success", message: t("actions.saved"), fieldErrors: {} };
}
