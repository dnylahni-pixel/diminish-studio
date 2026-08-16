// =============================================================================
// Revenue Leakage & Billing Reconciliation Engine
// -----------------------------------------------------------------------------
// Capabilities: reconcileInvoiceAgainstItems, reconcileInvoiceAgainstTransactions,
//               detectOrphanTransactions, detectMeteredRevenueLeakage
// Tables used: invoices, invoice_items, transactions, feature_pricing_rules
// Problem solved: nothing in the schema enforces invoice.total == sum(items),
// or invoice.amountPaid == net(successful charges - successful refunds), or
// that every "paid" invoice actually has a successful transaction behind it.
// These are exactly the failure modes that hide real revenue loss.
// Known schema limitation (see docs/assumptions-and-limitations.md): invoice
// line items do not carry a `featureId`, so metered-revenue-leakage detection
// must be invoked with an explicit feature/quantity mapping rather than
// derived purely from `invoice_items`.
// =============================================================================

import { calculateMeteredFeatureCharge } from "./metered-pricing-calculator";
import type { IntelligenceDataset, InvoiceItemRow, InvoiceRow, UUID } from "@/shared/dataset-types";
import { ZERO } from "@/shared/money";
import type { ReasonedFinding } from "@/shared/reason-code";

export type BillingReconciliationReasonCode =
  | "HEADER_ITEM_TOTAL_MISMATCH"
  | "PAID_WITHOUT_SUCCESSFUL_TRANSACTION"
  | "SUCCESSFUL_TRANSACTION_WITHOUT_VALID_INVOICE"
  | "NET_PAID_TRANSACTION_MISMATCH"
  | "METERED_UNDERBILLING"
  | "METERED_OVERBILLING";

export interface InvoiceReconciliationFinding {
  invoiceId: UUID;
  invoiceNumber: string;
  findings: ReasonedFinding<BillingReconciliationReasonCode>[];
}

function sumInvoiceItems(items: InvoiceItemRow[]): bigint {
  return items.reduce((sum, item) => sum + item.amount, ZERO);
}

export function reconcileInvoiceHeaderAgainstItems(invoice: InvoiceRow, items: InvoiceItemRow[]): ReasonedFinding<BillingReconciliationReasonCode>[] {
  const findings: ReasonedFinding<BillingReconciliationReasonCode>[] = [];
  const itemsTotal = sumInvoiceItems(items);
  if (itemsTotal !== invoice.total) {
    findings.push({
      code: "HEADER_ITEM_TOTAL_MISMATCH",
      severity: "critical",
      messageFa: `مجموع ردیف‌های فاکتور (${itemsTotal.toString()}) با مبلغ کل سربرگ فاکتور (${invoice.total.toString()}) برابر نیست.`,
      weight: 3,
      evidence: { itemsTotal: itemsTotal.toString(), headerTotal: invoice.total.toString() },
    });
  }
  return findings;
}

export function reconcileInvoiceAgainstTransactions(
  invoice: InvoiceRow,
  relatedTransactions: IntelligenceDataset["transactions"],
): ReasonedFinding<BillingReconciliationReasonCode>[] {
  const findings: ReasonedFinding<BillingReconciliationReasonCode>[] = [];
  const succeededCharges = relatedTransactions.filter((t) => t.type === "charge" && t.status === "succeeded");
  const succeededRefunds = relatedTransactions.filter((t) => t.type === "refund" && t.status === "succeeded");

  if (invoice.status === "paid" && succeededCharges.length === 0) {
    findings.push({
      code: "PAID_WITHOUT_SUCCESSFUL_TRANSACTION",
      severity: "critical",
      messageFa: `فاکتور «پرداخت‌شده» است اما هیچ تراکنش charge موفقی برای آن ثبت نشده است.`,
      weight: 3,
    });
  }

  const netPaid = succeededCharges.reduce((sum, t) => sum + t.amount, ZERO) - succeededRefunds.reduce((sum, t) => sum + t.amount, ZERO);
  if (netPaid !== invoice.amountPaid) {
    findings.push({
      code: "NET_PAID_TRANSACTION_MISMATCH",
      severity: "warning",
      messageFa: `مبلغ پرداخت‌شده ثبت‌شده در فاکتور (${invoice.amountPaid.toString()}) با خالص تراکنش‌های موفق (شارژ منهای استرداد = ${netPaid.toString()}) هم‌خوانی ندارد. احتمالاً استرداد جزئی در سربرگ فاکتور منعکس نشده است.`,
      weight: 2,
      evidence: { invoiceAmountPaid: invoice.amountPaid.toString(), netPaidFromTransactions: netPaid.toString() },
    });
  }

  return findings;
}

export function detectOrphanTransactions(dataset: IntelligenceDataset): ReasonedFinding<BillingReconciliationReasonCode>[] {
  const invoiceIds = new Set(dataset.invoices.map((invoice) => invoice.id));
  return dataset.transactions
    .filter((transaction) => transaction.invoiceId !== null && !invoiceIds.has(transaction.invoiceId))
    .map((transaction) => ({
      code: "SUCCESSFUL_TRANSACTION_WITHOUT_VALID_INVOICE" as const,
      severity: "critical" as const,
      messageFa: `تراکنش ${transaction.id} به فاکتوری اشاره می‌کند که در سیستم وجود ندارد (invoiceId یتیم).`,
      weight: 2,
      evidence: { transactionId: transaction.id, invoiceId: transaction.invoiceId },
    }));
}

export function reconcileAllInvoices(dataset: IntelligenceDataset): InvoiceReconciliationFinding[] {
  return dataset.invoices.map((invoice) => {
    const items = dataset.invoiceItems.filter((item) => item.invoiceId === invoice.id);
    const transactions = dataset.transactions.filter((t) => t.invoiceId === invoice.id);
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      findings: [
        ...reconcileInvoiceHeaderAgainstItems(invoice, items),
        ...reconcileInvoiceAgainstTransactions(invoice, transactions),
      ],
    };
  });
}

export interface MeteredRevenueLeakageInput {
  invoiceId: UUID;
  invoicedAmount: bigint;
  featurePricingRuleId: UUID;
  meteredQuantity: number;
}

export interface MeteredRevenueLeakageFinding {
  invoiceId: UUID;
  expectedCharge: string;
  invoicedAmount: string;
  leakageAmount: string;
  leakagePercent: number | null;
  finding: ReasonedFinding<BillingReconciliationReasonCode> | null;
}

/**
 * Compares what a metered line item *should* cost (per the applicable
 * feature_pricing_rules tier definition) against what was actually invoiced.
 * Callers must supply the feature/quantity mapping explicitly because
 * invoice_items has no featureId column (documented schema gap).
 */
export function detectMeteredRevenueLeakage(
  dataset: IntelligenceDataset,
  input: MeteredRevenueLeakageInput,
): MeteredRevenueLeakageFinding {
  const rule = dataset.featurePricingRules.find((r) => r.id === input.featurePricingRuleId);
  if (!rule) {
    return { invoiceId: input.invoiceId, expectedCharge: "0", invoicedAmount: input.invoicedAmount.toString(), leakageAmount: "0", leakagePercent: null, finding: null };
  }
  const { totalCharge } = calculateMeteredFeatureCharge(rule, input.meteredQuantity);
  const leakage = totalCharge - input.invoicedAmount;
  const leakagePercent = totalCharge === ZERO ? null : Number((leakage * BigInt(10000)) / totalCharge) / 100;

  let finding: ReasonedFinding<BillingReconciliationReasonCode> | null = null;
  if (leakage > ZERO) {
    finding = {
      code: "METERED_UNDERBILLING",
      severity: "critical",
      messageFa: `مصرف اندازه‌گیری‌شده باید ${totalCharge.toString()} واحد محاسبه می‌شد اما فقط ${input.invoicedAmount.toString()} واحد صورتحساب شده است (کسری درآمد ${leakage.toString()} واحد).`,
      weight: 3,
      evidence: { expectedCharge: totalCharge.toString(), invoicedAmount: input.invoicedAmount.toString() },
    };
  } else if (leakage < ZERO) {
    finding = {
      code: "METERED_OVERBILLING",
      severity: "warning",
      messageFa: `مبلغ صورتحساب‌شده (${input.invoicedAmount.toString()}) بیشتر از مقدار محاسبه‌شده طبق قوانین قیمت‌گذاری (${totalCharge.toString()}) است.`,
      weight: 2,
      evidence: { expectedCharge: totalCharge.toString(), invoicedAmount: input.invoicedAmount.toString() },
    };
  }

  return {
    invoiceId: input.invoiceId,
    expectedCharge: totalCharge.toString(),
    invoicedAmount: input.invoicedAmount.toString(),
    leakageAmount: leakage.toString(),
    leakagePercent,
    finding,
  };
}
