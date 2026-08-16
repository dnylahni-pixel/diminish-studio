import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { subscriptions } from "./subscriptions";
import { addons } from "../catalog/addons-coupons";
import { addonPrices } from "../catalog/addons-coupons";

// ============================================================
// billing.subscription_addons — Addons attached to active subscriptions
// ============================================================
export const subscriptionAddons = pgTable("subscription_addons", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  addonId: uuid("addon_id")
    .notNull()
    .references(() => addons.id),
  addonPriceId: uuid("addon_price_id").references(() => addonPrices.id),
  quantity: integer("quantity").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});