import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usageAggregateUnit } from "../enums";
import { users } from "../app/index";
import { subscriptions } from "./subscriptions";
import { features } from "../catalog/features";

// ============================================================
// billing.usage_daily_aggregates — Pre-aggregated daily usage
// ============================================================
export const usageDailyAggregates = pgTable(
  "usage_daily_aggregates",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    dateBucket: timestamp("date_bucket", { withTimezone: true }).notNull(),
    totalQuantity: bigint("total_quantity", { mode: "number" }).notNull().default(0),
    totalCredits: bigint("total_credits", { mode: "number" }).notNull().default(0),
    totalMoney: bigint("total_money", { mode: "number" }).notNull().default(0),
    currency: text("currency"),
    unit: usageAggregateUnit("unit"),
    aggregationKey: text("aggregation_key"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_daily_aggregate")
      .on(table.userId, table.featureId, table.dateBucket, table.aggregationKey)
      .where(sql`${table.aggregationKey} IS NOT NULL`),
    check("chk_quantity_aggr", sql`${table.totalQuantity} >= 0`),
    check("chk_credits_aggr", sql`${table.totalCredits} >= 0`),
    check("chk_money_aggr", sql`${table.totalMoney} >= 0`),
  ],
);