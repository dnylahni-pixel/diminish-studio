import { pgTable, uuid, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { subscriptionStatus } from "../enums";
import { users } from "../app/index";
import { plans } from "../catalog/plans";
import { planVersions } from "../catalog/plans";
import { planPrices } from "../catalog/plans";

// ============================================================
// billing.subscriptions — Main subscription record per user
// ============================================================
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  planVersionId: uuid("plan_version_id")
    .notNull()
    .references(() => planVersions.id),
  planPriceId: uuid("plan_price_id")
    .references(() => planPrices.id),
  status: subscriptionStatus("status").notNull().default("incomplete"),
  currency: text("currency"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  pauseStartsAt: timestamp("pause_starts_at", { withTimezone: true }),
  pauseEndsAt: timestamp("pause_ends_at", { withTimezone: true }),
  trialId: uuid("trial_id"),
  externalRef: text("external_ref"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});