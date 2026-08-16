import { pgTable, uuid, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { trialStatus } from "../enums";
import { users } from "../app/index";
import { plans } from "../catalog/plans";
import { planVersions } from "../catalog/plans";
import { subscriptions } from "./subscriptions";

// ============================================================
// billing.trials — Trial lifecycle records
// ============================================================
export const trials = pgTable("trials", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  planVersionId: uuid("plan_version_id").references(() => planVersions.id),
  status: trialStatus("status").notNull().default("scheduled"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  convertedSubscriptionId: uuid("converted_subscription_id").references(() => subscriptions.id),
  source: text("source"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});