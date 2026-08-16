import { pgTable, uuid, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { subscriptionEventType } from "../enums";
import { subscriptions } from "./subscriptions";
import { users } from "../app/index";

// ============================================================
// billing.subscription_events — Audit trail of lifecycle changes
// ============================================================
export const subscriptionEvents = pgTable("subscription_events", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  eventType: subscriptionEventType("event_type").notNull(),
  eventTime: timestamp("event_time", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: integer("actor_user_id")
    .references(() => users.id),
  payload: jsonb("payload").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});