// =============================================================================
// Demo Mode — Billing fixtures (invoices, items, transactions, payment methods)
// -----------------------------------------------------------------------------
// Three invoices reconcile perfectly (S1, S2, S3-header/items) so the
// reconciliation engine has a clean baseline; S4 is deliberately broken
// (header total != sum of items) and S3's usage line deliberately undercharges
// relative to the feature_pricing_rules engine (revenue leakage). An orphan
// transaction and a partial refund without a header adjustment are included
// so every documented anomaly in the brief has real fixture coverage.
// =============================================================================

import type {
  CouponRedemptionRow,
  InvoiceItemRow,
  InvoiceRow,
  PaymentMethodRow,
  TransactionRow,
} from "@/shared/dataset-types";
import { IDS, PERIOD_M0_START } from "./ids";

export const INVOICE_IDS = {
  s1Jan: "in000000-0000-4000-8000-000000000001",
  s2Jan: "in000000-0000-4000-8000-000000000002",
  s3Jan: "in000000-0000-4000-8000-000000000003",
  s4Jan: "in000000-0000-4000-8000-000000000004",
} as const;

export const INVOICES: InvoiceRow[] = [
  {
    id: INVOICE_IDS.s1Jan, subscriptionId: IDS.subscriptions.s1, userId: IDS.users.u1, invoiceNumber: "INV-2026-0001",
    status: "paid", currency: "USD",
    subtotal: BigInt(10900), taxTotal: BigInt(842), discountTotal: BigInt(990), total: BigInt(10752),
    amountPaid: BigInt(10752), amountDue: BigInt(0),
    issuedAt: PERIOD_M0_START, dueAt: new Date("2026-01-08T00:00:00Z"), paidAt: new Date("2026-01-02T00:00:00Z"), voidedAt: null,
  },
  {
    id: INVOICE_IDS.s2Jan, subscriptionId: IDS.subscriptions.s2, userId: IDS.users.u2, invoiceNumber: "INV-2026-0002",
    status: "paid", currency: "USD",
    subtotal: BigInt(2900), taxTotal: BigInt(247), discountTotal: BigInt(0), total: BigInt(3147),
    amountPaid: BigInt(3147), amountDue: BigInt(0),
    issuedAt: PERIOD_M0_START, dueAt: new Date("2026-01-08T00:00:00Z"), paidAt: new Date("2026-01-03T00:00:00Z"), voidedAt: null,
  },
  {
    id: INVOICE_IDS.s3Jan, subscriptionId: IDS.subscriptions.s3, userId: IDS.users.u3, invoiceNumber: "INV-2026-0003",
    status: "paid", currency: "IRR",
    subtotal: BigInt(69000000), taxTotal: BigInt(6210000), discountTotal: BigInt(0), total: BigInt(75210000),
    amountPaid: BigInt(75210000), amountDue: BigInt(0),
    issuedAt: PERIOD_M0_START, dueAt: new Date("2026-01-08T00:00:00Z"), paidAt: new Date("2026-01-04T00:00:00Z"), voidedAt: null,
  },
  {
    // Intentional mismatch: subtotal(9900) + taxTotal(842) = 10742, but `total`
    // is recorded as 10700 — a header/items reconciliation break.
    id: INVOICE_IDS.s4Jan, subscriptionId: IDS.subscriptions.s4, userId: IDS.users.u4, invoiceNumber: "INV-2026-0004",
    status: "open", currency: "USD",
    subtotal: BigInt(9900), taxTotal: BigInt(842), discountTotal: BigInt(0), total: BigInt(10700),
    amountPaid: BigInt(0), amountDue: BigInt(10700),
    issuedAt: PERIOD_M0_START, dueAt: new Date("2026-01-08T00:00:00Z"), paidAt: null, voidedAt: null,
  },
];

export const INVOICE_ITEMS: InvoiceItemRow[] = [
  { id: "ii000000-0000-4000-8000-000000000001", invoiceId: INVOICE_IDS.s1Jan, subscriptionPeriodId: null, description: "پلن حرفه‌ای", itemType: "plan", quantity: "1", unitAmount: BigInt(9900), amount: BigInt(9900), currency: "USD" },
  { id: "ii000000-0000-4000-8000-000000000002", invoiceId: INVOICE_IDS.s1Jan, subscriptionPeriodId: null, description: "افزونه صندلی اضافه (۲ عدد)", itemType: "addon", quantity: "2", unitAmount: BigInt(500), amount: BigInt(1000), currency: "USD" },
  { id: "ii000000-0000-4000-8000-000000000003", invoiceId: INVOICE_IDS.s1Jan, subscriptionPeriodId: null, description: "تخفیف WELCOME10", itemType: "discount", quantity: "1", unitAmount: BigInt(-990), amount: BigInt(-990), currency: "USD" },
  { id: "ii000000-0000-4000-8000-000000000004", invoiceId: INVOICE_IDS.s1Jan, subscriptionPeriodId: null, description: "مالیات US-CA", itemType: "tax", quantity: "1", unitAmount: BigInt(842), amount: BigInt(842), currency: "USD" },

  { id: "ii000000-0000-4000-8000-000000000010", invoiceId: INVOICE_IDS.s2Jan, subscriptionPeriodId: null, description: "پلن استارتر", itemType: "plan", quantity: "1", unitAmount: BigInt(2900), amount: BigInt(2900), currency: "USD" },
  { id: "ii000000-0000-4000-8000-000000000011", invoiceId: INVOICE_IDS.s2Jan, subscriptionPeriodId: null, description: "مالیات US-CA", itemType: "tax", quantity: "1", unitAmount: BigInt(247), amount: BigInt(247), currency: "USD" },

  { id: "ii000000-0000-4000-8000-000000000020", invoiceId: INVOICE_IDS.s3Jan, subscriptionPeriodId: null, description: "پلن سازمانی", itemType: "plan", quantity: "1", unitAmount: BigInt(49000000), amount: BigInt(49000000), currency: "IRR" },
  {
    // Intentionally under-billed relative to feature_pricing_rules volume tier
    // (see docs/formulas-and-kpis.md — expected charge is 45,000,000 IRR for
    // 1,500,000 metered calls at the 30 IRR/unit volume tier).
    id: "ii000000-0000-4000-8000-000000000021", invoiceId: INVOICE_IDS.s3Jan, subscriptionPeriodId: null, description: "مصرف اضافه API", itemType: "usage", quantity: "1500000", unitAmount: BigInt(13), amount: BigInt(20000000), currency: "IRR",
  },
  { id: "ii000000-0000-4000-8000-000000000022", invoiceId: INVOICE_IDS.s3Jan, subscriptionPeriodId: null, description: "مالیات ارزش افزوده", itemType: "tax", quantity: "1", unitAmount: BigInt(6210000), amount: BigInt(6210000), currency: "IRR" },

  { id: "ii000000-0000-4000-8000-000000000030", invoiceId: INVOICE_IDS.s4Jan, subscriptionPeriodId: null, description: "پلن حرفه‌ای", itemType: "plan", quantity: "1", unitAmount: BigInt(9900), amount: BigInt(9900), currency: "USD" },
  { id: "ii000000-0000-4000-8000-000000000031", invoiceId: INVOICE_IDS.s4Jan, subscriptionPeriodId: null, description: "مالیات US-CA", itemType: "tax", quantity: "1", unitAmount: BigInt(842), amount: BigInt(842), currency: "USD" },
];

export const TRANSACTIONS: TransactionRow[] = [
  { id: "tx000000-0000-4000-8000-000000000001", subscriptionId: IDS.subscriptions.s1, userId: IDS.users.u1, invoiceId: INVOICE_IDS.s1Jan, type: "charge", status: "succeeded", amount: BigInt(10752), currency: "USD", idempotencyKey: "charge-inv-2026-0001", failureReason: null, occurredAt: new Date("2026-01-02T00:00:00Z") },
  {
    // Partial refund with no corresponding change to invoice.amountPaid —
    // reconciliation engine should flag invoice/transaction net mismatch.
    id: "tx000000-0000-4000-8000-000000000002", subscriptionId: IDS.subscriptions.s1, userId: IDS.users.u1, invoiceId: INVOICE_IDS.s1Jan, type: "refund", status: "succeeded", amount: BigInt(500), currency: "USD", idempotencyKey: "refund-inv-2026-0001-1", failureReason: null, occurredAt: new Date("2026-01-10T00:00:00Z"),
  },
  { id: "tx000000-0000-4000-8000-000000000003", subscriptionId: IDS.subscriptions.s2, userId: IDS.users.u2, invoiceId: INVOICE_IDS.s2Jan, type: "charge", status: "succeeded", amount: BigInt(3147), currency: "USD", idempotencyKey: "charge-inv-2026-0002", failureReason: null, occurredAt: new Date("2026-01-03T00:00:00Z") },
  { id: "tx000000-0000-4000-8000-000000000004", subscriptionId: IDS.subscriptions.s3, userId: IDS.users.u3, invoiceId: INVOICE_IDS.s3Jan, type: "charge", status: "succeeded", amount: BigInt(75210000), currency: "IRR", idempotencyKey: "charge-inv-2026-0003", failureReason: null, occurredAt: new Date("2026-01-04T00:00:00Z") },
  { id: "tx000000-0000-4000-8000-000000000005", subscriptionId: IDS.subscriptions.s4, userId: IDS.users.u4, invoiceId: INVOICE_IDS.s4Jan, type: "charge", status: "failed", amount: BigInt(10700), currency: "USD", idempotencyKey: "charge-inv-2026-0004-attempt-1", failureReason: "card_expired", occurredAt: new Date("2026-01-05T00:00:00Z") },
  {
    // Orphan: points at an invoice id that does not exist in INVOICES.
    id: "tx000000-0000-4000-8000-000000000006", subscriptionId: IDS.subscriptions.s6, userId: IDS.users.u6, invoiceId: "in000000-0000-4000-8000-000000009999", type: "charge", status: "succeeded", amount: BigInt(7900), currency: "USD", idempotencyKey: "charge-orphan-1", failureReason: null, occurredAt: new Date("2025-12-01T00:00:00Z"),
  },
];

export const PAYMENT_METHODS: PaymentMethodRow[] = [
  { id: "pm000000-0000-4000-8000-000000000001", userId: IDS.users.u1, type: "card", expMonth: 2, expYear: 2026, isDefault: true, status: "active" },
  {
    // Data-quality signal: still marked "active" though exp date already passed.
    id: "pm000000-0000-4000-8000-000000000002", userId: IDS.users.u4, type: "card", expMonth: 11, expYear: 2025, isDefault: true, status: "active",
  },
  { id: "pm000000-0000-4000-8000-000000000003", userId: IDS.users.u3, type: "bank_transfer", expMonth: null, expYear: null, isDefault: true, status: "active" },
  { id: "pm000000-0000-4000-8000-000000000004", userId: IDS.users.u2, type: "card", expMonth: 5, expYear: 2028, isDefault: true, status: "active" },
];

export const COUPON_REDEMPTIONS: CouponRedemptionRow[] = [
  { id: "cd000000-0000-4000-8000-000000000001", couponId: IDS.coupons.welcome10, subscriptionId: IDS.subscriptions.s1, userId: IDS.users.u1, redeemedAt: new Date("2025-12-01T00:00:00Z"), amountDiscounted: BigInt(990), currency: "USD" },
];
