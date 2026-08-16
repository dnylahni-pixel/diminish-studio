import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { paymentMethodType, paymentMethodStatus } from "../enums";
import { users } from "../app/index";

// ============================================================
// billing.payment_methods — Payment methods saved per user
// ============================================================
export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    provider: text("provider").notNull(),
    providerPaymentMethodId: text("provider_payment_method_id").notNull(),
    type: paymentMethodType("type").notNull(),
    brand: text("brand"),
    last4: text("last4"),
    expMonth: integer("exp_month"),
    expYear: integer("exp_year"),
    billingName: text("billing_name"),
    billingEmail: text("billing_email"),
    billingCountry: text("billing_country"),
    billingAddress: jsonb("billing_address"),
    isDefault: boolean("is_default").notNull().default(false),
    status: paymentMethodStatus("status").notNull().default("active"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_provider_payment_method").on(table.provider, table.providerPaymentMethodId),
    uniqueIndex("uq_user_default_payment")
      .on(table.userId)
      .where(sql`${table.isDefault} = true AND ${table.status} = 'active'`),
  ],
);