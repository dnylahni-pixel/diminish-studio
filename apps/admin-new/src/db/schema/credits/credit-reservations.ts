import { pgTable, uuid, timestamp, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { reservationStatus } from "../enums";
import { sql } from "drizzle-orm";
import { creditAccounts } from "./credit-accounts";

// ============================================================
// credits.credit_reservations — Holds credits before final capture
// Note: usage_event_id FK omitted to avoid circular dependency
// with usage_events. It's stored as a plain uuid in usage_events.
// ============================================================
export const creditReservations = pgTable(
  "credit_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    creditAccountId: uuid("credit_account_id")
      .notNull()
      .references(() => creditAccounts.id),
    usageEventId: uuid("usage_event_id"),
    reservedAmount: bigint("reserved_amount", { mode: "number" }).notNull(),
    capturedAmount: bigint("captured_amount", { mode: "number" }).notNull().default(0),
    releasedAmount: bigint("released_amount", { mode: "number" }).notNull().default(0),
    status: reservationStatus("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_reserved", sql`${table.reservedAmount} >= 0`),
    check("chk_captured", sql`${table.capturedAmount} >= 0`),
    check("chk_released", sql`${table.releasedAmount} >= 0`),
    check("chk_cap_rel", sql`${table.capturedAmount} + ${table.releasedAmount} <= ${table.reservedAmount}`),
  ],
);