import type { SettingKey, SettingValue } from "@/db/schema";

/**
 * Action-state shape for the restore flow — mirrors `SettingsActionState` so
 * the client can render a localized message and per-field errors the same way
 * the Settings workspace does.
 */
export interface RestoreActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
}

/**
 * One leaf-level change for the before→after diff display. Produced by the
 * typed `diffJson` helper in `queries.ts` — a flat list of changed paths, each
 * with the old and new value pre-formatted for rendering (never a JSON blob).
 */
export interface DiffEntry {
  /** Dot-joined leaf path, e.g. `upload.rate_limit.max` or `$` for a scalar. */
  path: string;
  /** The value before the change, formatted for display. */
  before: string;
  /** The value after the change, formatted for display. */
  after: string;
}

/** A single `settings_versions` row enriched for display. */
export interface AuditVersionRow {
  key: SettingKey;
  versionNumber: number;
  value: SettingValue;
  changeReason: string | null;
  changedBy: string;
  /** ISO timestamp of the change. */
  changedAt: string;
  /** True when this row holds the same value as the current `app_settings`. */
  isCurrent: boolean;
  /** The value stored in the immediately preceding version of this key. */
  previousValue: SettingValue | null;
  previousVersionNumber: number | null;
  /** Precomputed leaf-level diff: previousValue → value. */
  diff: DiffEntry[];
}

/** A single `admin_audit_log` row carried by the workspace payload. */
export interface AuditLogRow {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityKey: string;
  versionRef: string | null;
  /** ISO timestamp of the audit entry. */
  createdAt: string;
}

/** The full payload the Audit & Versions workspace renders. */
export interface AuditListData {
  /** Version history, newest first. */
  versions: AuditVersionRow[];
  /** Most recent audit log entries (included for future/audit surfaces). */
  auditLog: AuditLogRow[];
  totals: {
    versionCount: number;
    auditEntryCount: number;
  };
}
