import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLog,
  appSettings,
  settingsVersions,
  type SettingKey,
  type SettingValue,
} from "@/db/schema";
import type {
  AuditListData,
  AuditLogRow,
  AuditVersionRow,
  DiffEntry,
} from "./types";

/**
 * Hard cap on how much history the workspace renders. `settings_versions` and
 * `admin_audit_log` are append-only and unbounded in theory; the lab screen is
 * a WIP, so we cap the read to keep the payload small.
 */
const MAX_ROWS = 500;

/** Format a value as a short, readable string for the diff display. */
export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value === "" ? '""' : value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Typed leaf-level diff between two setting values. Returns one entry per
 * changed leaf path (dot-joined like `upload.rate_limit.max`, or `$` for a
 * scalar), each carrying the formatted before/after strings — a small readable
 * diff, never a JSON blob wall.
 */
export function diffJson(
  before: unknown,
  after: unknown,
  path = "",
): DiffEntry[] {
  if (Object.is(before, after)) return [];

  const bothObjects =
    before !== null &&
    after !== null &&
    typeof before === "object" &&
    typeof after === "object" &&
    Array.isArray(before) === Array.isArray(after);

  if (!bothObjects) {
    return [
      {
        path: path || "$",
        before: formatDiffValue(before),
        after: formatDiffValue(after),
      },
    ];
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;
  const keys = new Set<string>([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj),
  ]);
  const entries: DiffEntry[] = [];
  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key;
    entries.push(...diffJson(beforeObj[key], afterObj[key], childPath));
  }
  return entries;
}

/**
 * Read-only server query for the Audit & Versions workspace.
 *
 * Returns every `settings_versions` row (newest first) with the current
 * `app_settings` value per key so the UI can mark the "current version", plus
 * the most recent `admin_audit_log` rows. Each version row carries its
 * precomputed leaf diff against the immediately preceding version of the same
 * key.
 *
 * No `"use server"` directive — like `settings/queries.ts`, this is a plain
 * server function invoked from server components.
 */
export async function getAuditListData(): Promise<AuditListData> {
  const [
    versionRows,
    auditRows,
    currentRows,
    [versionCountRow],
    [auditCountRow],
  ] = await Promise.all([
    db
      .select()
      .from(settingsVersions)
      .orderBy(desc(settingsVersions.changedAt), desc(settingsVersions.id))
      .limit(MAX_ROWS),
    db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
      .limit(MAX_ROWS),
    db.select().from(appSettings),
    db.select({ value: count() }).from(settingsVersions),
    db.select({ value: count() }).from(adminAuditLog),
  ]);

  const currentByKey = new Map(currentRows.map((row) => [row.key, row]));

  // Group versions by key in ascending version order so each row's "previous"
  // is the immediately preceding stored version of the same key.
  const rowsByKey = new Map<string, typeof versionRows>();
  for (const row of versionRows) {
    const list = rowsByKey.get(row.key) ?? [];
    list.push(row);
    rowsByKey.set(row.key, list);
  }
  for (const list of rowsByKey.values()) {
    list.sort((left, right) => left.versionNumber - right.versionNumber);
  }

  const previousValueByRef = new Map<string, SettingValue | null>();
  const previousVersionByRef = new Map<string, number | null>();
  for (const [key, list] of rowsByKey) {
    for (let index = 0; index < list.length; index += 1) {
      const ref = `${key}:${list[index].versionNumber}`;
      const previous = index > 0 ? list[index - 1] : null;
      previousValueByRef.set(ref, previous?.value ?? null);
      previousVersionByRef.set(ref, previous?.versionNumber ?? null);
    }
  }

  // `settings_versions.key` FK-references `app_settings.key`, which is seeded
  // only from the closed registry — so the text column is always a valid
  // SettingKey. Cast is safe by that invariant.
  const versions: AuditVersionRow[] = versionRows.map((row) => {
    const ref = `${row.key}:${row.versionNumber}`;
    const before = previousValueByRef.get(ref) ?? null;
    const after = row.value;
    const current = currentByKey.get(row.key);
    return {
      key: row.key as SettingKey,
      versionNumber: row.versionNumber,
      value: after,
      changeReason: row.changeReason,
      changedBy: row.changedBy,
      changedAt: row.changedAt.toISOString(),
      isCurrent: current?.versionNumber === row.versionNumber,
      previousValue: before,
      previousVersionNumber: previousVersionByRef.get(ref) ?? null,
      diff: diffJson(before, after),
    };
  });

  const auditLog: AuditLogRow[] = auditRows.map((row) => ({
    id: row.id,
    actor: row.actor,
    action: row.action,
    entityType: row.entityType,
    entityKey: row.entityKey,
    versionRef: row.versionRef,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    versions,
    auditLog,
    totals: {
      versionCount: versionCountRow?.value ?? 0,
      auditEntryCount: auditCountRow?.value ?? 0,
    },
  };
}
