import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { scheduleAction } from "../enums";
import { subscriptions } from "./subscriptions";
import { plans } from "../catalog/plans";
import { planVersions } from "../catalog/plans";
import { planPrices } from "../catalog/plans";

// ============================================================
// billing.subscription_schedules — Future changes queued for a subscription
// ============================================================
export const subscriptionSchedules = pgTable("subscription_schedules", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  action: scheduleAction("action").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  targetPlanId: uuid("target_plan_id").references(() => plans.id),
  targetPlanVersionId: uuid("target_plan_version_id").references(() => planVersions.id),
  targetPriceId: uuid("target_price_id").references(() => planPrices.id),
  config: jsonb("config").default({}),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});