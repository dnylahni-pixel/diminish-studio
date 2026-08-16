import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { usageStatus } from "../enums";
import { sql } from "drizzle-orm";
import { users } from "../app/index";
import { features } from "../catalog/features";

// ============================================================
// credits.usage_events — Metered consumption records
// Note: reservation_id FK is omitted to avoid circular dependency
// with credit_reservations. It's stored as a plain uuid column.
// ============================================================
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id"),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unitName: text("unit_name"),
    status: usageStatus("status").notNull().default("pending"),
    usageStartedAt: timestamp("usage_started_at", { withTimezone: true }),
    usageEndedAt: timestamp("usage_ended_at", { withTimezone: true }),
    creditCost: bigint("credit_cost", { mode: "number" }),
    moneyCost: bigint("money_cost", { mode: "number" }),
    currency: text("currency"),
    reservationId: uuid("reservation_id"),
    idempotencyKey: text("idempotency_key"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    check("chk_quantity", sql`${table.quantity} >= 0`),
    check("chk_credit_cost", sql`${table.creditCost} IS NULL OR ${table.creditCost} >= 0`),
    check("chk_money_cost", sql`${table.moneyCost} IS NULL OR ${table.moneyCost} >= 0`),
  ],
);