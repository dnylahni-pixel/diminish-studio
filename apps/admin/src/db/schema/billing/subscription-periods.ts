import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { periodStatus } from "../enums";
import { subscriptions } from "./subscriptions";
import { planPrices } from "../catalog/plans";

// ============================================================
// billing.subscription_periods — Individual billing periods/cycles
// ============================================================
export const subscriptionPeriods = pgTable(
  "subscription_periods",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id),
    periodIndex: integer("period_index").notNull(),
    status: periodStatus("status").notNull().default("scheduled"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    priceId: uuid("price_id").references(() => planPrices.id),
    amountDue: bigint("amount_due", { mode: "number" }),
    amountPaid: bigint("amount_paid", { mode: "number" }),
    currency: text("currency"),
    invoicedAt: timestamp("invoiced_at", { withTimezone: true }),
    invoiceId: uuid("invoice_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uq_subscription_period").on(table.subscriptionId, table.periodIndex)],
);