import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, check } from "drizzle-orm/pg-core";
import { redemptionStatus } from "../enums";
import { sql } from "drizzle-orm";
import { coupons } from "../catalog/addons-coupons";
import { users } from "../app/index";
import { subscriptions } from "./subscriptions";
import { invoices } from "./invoices";
import { transactions } from "./transactions";

// ============================================================
// billing.coupon_redemptions — Audit trail of coupon usage
// ============================================================
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    transactionId: uuid("transaction_id").references(() => transactions.id),
    status: redemptionStatus("status").notNull().default("applied"),
    discountType: text("discount_type").notNull(),
    discountAmount: bigint("discount_amount", { mode: "number" }),
    discountPercentBps: integer("discount_percent_bps"),
    creditAmount: bigint("credit_amount", { mode: "number" }),
    currency: text("currency"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    couponSnapshot: jsonb("coupon_snapshot").default({}),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "chk_discount_or_credit",
      sql`${table.discountAmount} IS NOT NULL OR ${table.discountPercentBps} IS NOT NULL OR ${table.creditAmount} IS NOT NULL`,
    ),
    check("chk_percent_bps", sql`${table.discountPercentBps} IS NULL OR (${table.discountPercentBps} >= 0 AND ${table.discountPercentBps} <= 10000)`),
  ],
);