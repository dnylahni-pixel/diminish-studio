import { pgTable, integer, text, timestamp, bigint } from "drizzle-orm/pg-core";

// ============================================================
// app.users — Matches existing public.users table from the legacy app
// We only define columns that already exist and are needed for FK references.
// New columns are added via ALTER TABLE migrations.
// ============================================================
export * from "./settings";
export * from "./settings-registry";

export const users = pgTable("users", {
  id: integer("id").primaryKey().notNull(),
  clerkId: text("clerk_id"),
  username: text("username").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  preferredInstrument: text("preferred_instrument"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).notNull().default(0),
  storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" }).notNull().default(209715200),
});
