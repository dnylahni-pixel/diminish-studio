import { pgTable, uuid, text, timestamp, integer, bigint, jsonb } from "drizzle-orm/pg-core";
import { creditAccountStatus } from "../enums";
import { users } from "../app/index";

// ============================================================
// credits.credit_accounts — Credit wallet/account per user
// ============================================================
export const creditAccounts = pgTable("credit_accounts", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  status: creditAccountStatus("status").notNull().default("active"),
  currencyContext: text("currency_context"),
  balance: bigint("balance", { mode: "number" }).notNull().default(0),
  reservedBalance: bigint("reserved_balance", { mode: "number" }).notNull().default(0),
  lifetimeGranted: bigint("lifetime_granted", { mode: "number" }).notNull().default(0),
  lifetimeUsed: bigint("lifetime_used", { mode: "number" }).notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});