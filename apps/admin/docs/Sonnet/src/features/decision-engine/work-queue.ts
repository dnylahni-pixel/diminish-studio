// =============================================================================
// Prioritized Operations Work Queue
// -----------------------------------------------------------------------------
// Capability: rankOperationsWorkQueue
// Tables used: (via composed engines) subscriptions, invoices, transactions,
//              credit_accounts, credit_ledger
// Problem solved: billing/support/finance teams need one ranked list of
// "what to work on today" spanning churn risk, broken reconciliations, and
// stuck operational state — instead of separately checking five dashboards.
// Priority formula: priorityScore = severityWeight(critical=8, warning=3) +
// domainBaseWeight, sorted descending. This is a transparent weighted sum,
// not a black-box ranking model.
// =============================================================================

import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { scoreSubscriptionHealth } from "@/features/subscription-intelligence/health-score";
import { reconcileAllInvoices } from "@/features/revenue-intelligence/billing-reconciliation";
import { reconcileAllCreditAccounts } from "@/features/credit-intelligence/ledger-reconciliation";

export type WorkQueueCategory = "billing_risk" | "churn_risk" | "credit_integrity" | "billing_integrity";

export interface WorkQueueItem {
  category: WorkQueueCategory;
  entityId: UUID;
  entityLabel: string;
  priorityScore: number;
  summaryFa: string;
}

const DOMAIN_BASE_WEIGHT: Record<WorkQueueCategory, number> = {
  billing_risk: 20,
  churn_risk: 15,
  credit_integrity: 18,
  billing_integrity: 22,
};

export function rankOperationsWorkQueue(dataset: IntelligenceDataset, now: Date, limit = 20): WorkQueueItem[] {
  const items: WorkQueueItem[] = [];

  for (const subscription of dataset.subscriptions) {
    if (subscription.status === "canceled" || subscription.status === "expired") continue;
    const health = scoreSubscriptionHealth(dataset, subscription.id, now);
    if (health.payload.riskLevel === "high" || health.payload.riskLevel === "critical") {
      const category: WorkQueueCategory = subscription.status === "past_due" ? "billing_risk" : "churn_risk";
      items.push({
        category,
        entityId: subscription.id,
        entityLabel: `اشتراک ${subscription.id.slice(-8)}`,
        priorityScore: DOMAIN_BASE_WEIGHT[category] + (100 - health.payload.score),
        summaryFa: health.reasons.map((r) => r.messageFa).join(" "),
      });
    }
  }

  for (const invoiceReport of reconcileAllInvoices(dataset)) {
    const criticalFindings = invoiceReport.findings.filter((f) => f.severity === "critical");
    if (criticalFindings.length > 0) {
      items.push({
        category: "billing_integrity",
        entityId: invoiceReport.invoiceId,
        entityLabel: `فاکتور ${invoiceReport.invoiceNumber}`,
        priorityScore: DOMAIN_BASE_WEIGHT.billing_integrity + criticalFindings.length * 10,
        summaryFa: criticalFindings.map((f) => f.messageFa).join(" "),
      });
    }
  }

  for (const creditReport of reconcileAllCreditAccounts(dataset)) {
    const criticalFindings = creditReport.findings.filter((f) => f.severity === "critical");
    if (criticalFindings.length > 0) {
      items.push({
        category: "credit_integrity",
        entityId: creditReport.creditAccountId,
        entityLabel: `کیف‌پول اعتباری ${creditReport.creditAccountId.slice(-8)}`,
        priorityScore: DOMAIN_BASE_WEIGHT.credit_integrity + criticalFindings.length * 10,
        summaryFa: criticalFindings.map((f) => f.messageFa).join(" "),
      });
    }
  }

  return items.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, limit);
}
