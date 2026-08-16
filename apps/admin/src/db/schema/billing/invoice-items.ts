import { pgTable, uuid, integer, text, timestamp, bigint, jsonb, check, uniqueIndex } from "drizzle-orm/pg-core";
import { invoiceItemType } from "../enums";
import { sql } from "drizzle-orm";
import { invoices } from "./invoices";
import { users } from "../app/index";
import { subscriptions } from "./subscriptions";
import { plans } from "../catalog/plans";
import { planVersions } from "../catalog/plans";
import { planPrices } from "../catalog/plans";
import { addons } from "../catalog/addons-coupons";
import { creditPackages } from "../credits/credit-packages";
import { usageEvents } from "../credits/usage-events";

// ============================================================
// billing.invoice_items — Line items of an invoice
// ============================================================
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    type: invoiceItemType("type").notNull(),
    description: text("description").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
    discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    planId: uuid("plan_id").references(() => plans.id),
    planVersionId: uuid("plan_version_id").references(() => planVersions.id),
    priceId: uuid("price_id").references(() => planPrices.id),
    addonId: uuid("addon_id").references(() => addons.id),
    usageEventId: uuid("usage_event_id").references(() => usageEvents.id),
    creditPackageId: uuid("credit_package_id").references(() => creditPackages.id),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_quantity", sql`${table.quantity} > 0`),
    check("chk_subtotal", sql`${table.subtotalAmount} >= 0`),
    check("chk_discount", sql`${table.discountAmount} >= 0`),
    check("chk_tax", sql`${table.taxAmount} >= 0`),
    check("chk_total", sql`${table.totalAmount} >= 0`),
    check("chk_total_formula", sql`${table.totalAmount} = ${table.subtotalAmount} - ${table.discountAmount} + ${table.taxAmount}`),
  ],
);