import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { SETTING_VALUE_TYPES, type SettingValue } from "./settings-registry";

/**
 * The settings "hub" — a small, typed registry of application behavior
 * knobs. Values are stored as jsonb but the allowed key set is a closed
 * union defined in `settings-registry.ts` (never freeform), and every row
 * carries a value_type that mirrors the registry's SettingValueType.
 */

const valueTypeValues = SETTING_VALUE_TYPES.map((t) => sql`${t}`);
const valueTypeIn = sql.join(valueTypeValues, sql`, `);

export const appSettingsTable = pgTable(
  "app_settings",
  {
    /** Stable, namespaced key — closed union defined in settings-registry.ts. */
    key: text("key").primaryKey(),
    value: jsonb("value").$type<SettingValue>().notNull(),
    /** Shape of `value`; must be one of the SettingValueType strings. */
    valueType: text("value_type").notNull(),
    /** Monotonic per-key revision; bumped on every update. */
    versionNumber: integer("version_number").notNull().default(1),
    /** Who last changed the setting ("seed", a clerk id, or an admin actor). */
    updatedBy: text("updated_by").notNull().default("system"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "app_settings_value_type_check",
      sql`${table.valueType} IN (${valueTypeIn})`,
    ),
  ],
);

/** Append-only history of every app_settings revision (one row per version). */
export const settingsVersionsTable = pgTable(
  "settings_versions",
  {
    id: serial("id").primaryKey(),
    key: text("key")
      .notNull()
      .references(() => appSettingsTable.key, { onDelete: "cascade" }),
    value: jsonb("value").$type<SettingValue>().notNull(),
    versionNumber: integer("version_number").notNull(),
    changeReason: text("change_reason"),
    changedBy: text("changed_by").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("settings_versions_key_version_unique").on(
      table.key,
      table.versionNumber,
    ),
  ],
);

/** General admin write-audit log (settings and any future admin entities). */
export const adminAuditLogTable = pgTable(
  "admin_audit_log",
  {
    id: serial("id").primaryKey(),
    /** Who performed the action (clerk id, service identity, or "system"). */
    actor: text("actor").notNull(),
    /** Machine-readable action, e.g. "settings.updated". */
    action: text("action").notNull(),
    /** Entity type this audit row refers to, e.g. "app_settings". */
    entityType: text("entity_type").notNull(),
    /** Entity primary key, e.g. a setting key. */
    entityKey: text("entity_key").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    /** Optional reference to the settings_versions row that captured the change. */
    versionRef: text("version_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_log_entity_idx").on(table.entityType, table.entityKey),
  ],
);

export const insertAppSettingSchema = createInsertSchema(appSettingsTable).omit(
  {
    updatedAt: true,
  },
);
export const insertSettingsVersionSchema = createInsertSchema(
  settingsVersionsTable,
).omit({ id: true, changedAt: true });
export const insertAdminAuditLogSchema = createInsertSchema(
  adminAuditLogTable,
).omit({ id: true, createdAt: true });

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettingsTable.$inferSelect;
export type InsertSettingsVersion = z.infer<typeof insertSettingsVersionSchema>;
export type SettingsVersion = typeof settingsVersionsTable.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLogTable.$inferSelect;
