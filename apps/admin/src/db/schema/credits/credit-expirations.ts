import { pgTable, uuid, timestamp, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { creditGrants } from "./credit-grants";

// ============================================================
// credits.credit_expirations — Tracks credit expiration executions
// ============================================================
export const creditExpirations = pgTable(
  "credit_expirations",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    creditGrantId: uuid("credit_grant_id")
      .notNull()
      .references(() => creditGrants.id),
    expiredAmount: bigint("expired_amount", { mode: "number" }).notNull(),
    expiredAt: timestamp("expired_at", { withTimezone: true }).notNull().defaultNow(),
    ledgerEntryId: uuid("ledger_entry_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("chk_expired_amount", sql`${table.expiredAmount} >= 0`)],
);