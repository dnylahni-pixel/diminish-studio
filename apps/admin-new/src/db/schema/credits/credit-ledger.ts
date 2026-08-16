import { pgTable, uuid, text, timestamp, bigint, jsonb } from "drizzle-orm/pg-core";
import { ledgerEntryType } from "../enums";
import { creditAccounts } from "./credit-accounts";

// ============================================================
// credits.credit_ledger — Immutable accounting ledger for all credit movements
// FK references to credit_grants, credit_reservations, usage_events,
// subscriptions, and transactions are omitted to avoid circular deps.
// They are stored as plain uuid columns.
// ============================================================
export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  creditAccountId: uuid("credit_account_id")
    .notNull()
    .references(() => creditAccounts.id),
  entryType: ledgerEntryType("entry_type").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceAfter: bigint("balance_after", { mode: "number" }),
  grantId: uuid("grant_id"),
  reservationId: uuid("reservation_id"),
  usageEventId: uuid("usage_event_id"),
  subscriptionId: uuid("subscription_id"),
  transactionId: uuid("transaction_id"),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});