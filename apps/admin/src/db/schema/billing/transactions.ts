import { pgTable, uuid, integer, text, timestamp, bigint, jsonb } from "drizzle-orm/pg-core";
import { transactionType, transactionStatus } from "../enums";
import { subscriptions } from "./subscriptions";
import { users } from "../app/index";

// ============================================================
// billing.transactions — Financial transaction log
// ============================================================
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: transactionType("type").notNull(),
  status: transactionStatus("status").notNull().default("pending"),
  currency: text("currency").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  invoiceId: uuid("invoice_id"),
  paymentMethodId: uuid("payment_method_id"),
  externalRef: text("external_ref"),
  description: text("description"),
  payload: jsonb("payload").default({}),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});