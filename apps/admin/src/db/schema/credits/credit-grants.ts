import { pgTable, uuid, text, timestamp, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { creditGrantSource } from "../enums";
import { sql } from "drizzle-orm";
import { creditAccounts } from "./credit-accounts";
import { subscriptions } from "../billing/subscriptions";
import { coupons } from "../catalog/addons-coupons";

// ============================================================
// credits.credit_grants — Grants of credits from various sources
// ============================================================
export const creditGrants = pgTable(
  "credit_grants",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    creditAccountId: uuid("credit_account_id")
      .notNull()
      .references(() => creditAccounts.id),
    source: creditGrantSource("source").notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    couponId: uuid("coupon_id").references(() => coupons.id),
    amountGranted: bigint("amount_granted", { mode: "number" }).notNull(),
    amountRemaining: bigint("amount_remaining", { mode: "number" }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reference: text("reference"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_granted", sql`${table.amountGranted} >= 0`),
    check("chk_remaining", sql`${table.amountRemaining} >= 0`),
    check("chk_remaining_lte_granted", sql`${table.amountRemaining} <= ${table.amountGranted}`),
  ],
);