import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Local audit log for the Runpod integration (SQLite).
 *
 * This table stores ONLY a redacted audit trail of actions performed through
 * this dashboard. It never stores the bootstrap Runpod API key, any secret
 * environment value, or raw vendor request/response bodies.
 *
 * This is additive — it does not alter, rename, or reinterpret any existing
 * host table.
 */
export const runpodAuditLog = sqliteTable("runpod_audit_log", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  actorId: text("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  status: text("status").notNull(), // "succeeded" | "failed"
  durationMs: integer("duration_ms").notNull(),
  vendorRequestId: text("vendor_request_id"),
  errorCategory: text("error_category"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at")
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export type RunpodAuditLogRow = typeof runpodAuditLog.$inferSelect;
export type RunpodAuditLogInsert = typeof runpodAuditLog.$inferInsert;
