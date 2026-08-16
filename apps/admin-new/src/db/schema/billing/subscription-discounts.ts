import { pgTable, uuid, text, timestamp, integer, bigint, boolean, jsonb } from "drizzle-orm/pg-core";
import { discountSourceType } from "../enums";
import { subscriptions } from "./subscriptions";
import { coupons } from "../catalog/addons-coupons";

// ============================================================
// billing.subscription_discounts — Discounts/coupons applied to subscriptions
// ============================================================
export const subscriptionDiscounts = pgTable("subscription_discounts", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  sourceType: discountSourceType("source_type").notNull(),
  couponId: uuid("coupon_id").references(() => coupons.id),
  name: text("name"),
  amountOff: bigint("amount_off", { mode: "number" }),
  percentageOff: integer("percentage_off"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});