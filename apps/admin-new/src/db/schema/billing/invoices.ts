import { pgTable, uuid, integer, text, timestamp, bigint, boolean, jsonb, check } from "drizzle-orm/pg-core";
import { invoiceStatus } from "../enums";
import { sql } from "drizzle-orm";
import { users } from "../app/index";
import { subscriptions } from "./subscriptions";
import { paymentMethods } from "./payment-methods";

// ============================================================
// billing.invoices — Formal invoice/accounting document
// ============================================================
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    billingPeriodId: uuid("billing_period_id"),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    transactionId: uuid("transaction_id"),
    status: invoiceStatus("status").notNull().default("draft"),
    currency: text("currency").notNull(),
    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
    discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    amountPaid: bigint("amount_paid", { mode: "number" }).notNull().default(0),
    amountDue: bigint("amount_due", { mode: "number" }).notNull().default(0),
    taxCountry: text("tax_country"),
    taxRegion: text("tax_region"),
    taxId: text("tax_id"),
    customerSnapshot: jsonb("customer_snapshot"),
    taxSnapshot: jsonb("tax_snapshot"),
    discountSnapshot: jsonb("discount_snapshot"),
    provider: text("provider"),
    providerInvoiceId: text("provider_invoice_id"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("chk_subtotal", sql`${table.subtotalAmount} >= 0`),
    check("chk_discount", sql`${table.discountAmount} >= 0`),
    check("chk_tax", sql`${table.taxAmount} >= 0`),
    check("chk_total", sql`${table.totalAmount} >= 0`),
    check("chk_amount_paid", sql`${table.amountPaid} >= 0`),
    check("chk_amount_due", sql`${table.amountDue} >= 0`),
    check("chk_total_formula", sql`${table.totalAmount} = ${table.subtotalAmount} - ${table.discountAmount} + ${table.taxAmount}`),
    check("chk_amount_due_formula", sql`${table.amountDue} = ${table.totalAmount} - ${table.amountPaid}`),
  ],
);