// =============================================================================
// Data Quality & Integrity Scorecard
// -----------------------------------------------------------------------------
// Capability: computeDataQualityScorecard
// Tables used: virtually all 38 — this module is a thin orchestrator that
// calls the dedicated detectors already implemented in each domain module
// (single source of truth per rule, no duplicated logic) and rolls them up
// into one prioritized scorecard with severities and remediation hints.
// Consumer: intelligence-lab "Integrity" tab, decision-engine work queue.
// =============================================================================

import type { IntelligenceDataset } from "@/shared/dataset-types";
import { detectFeatureDependencyCycles } from "@/features/catalog-intelligence/dependency-cycle-detector";
import { validatePlanVersionPublishReadiness } from "@/features/catalog-intelligence/plan-version-governance";
import { reconcileAllInvoices, detectOrphanTransactions } from "@/features/revenue-intelligence/billing-reconciliation";
import { reconcileAllCreditAccounts } from "@/features/credit-intelligence/ledger-reconciliation";
import { overlaps } from "@/shared/date";
import type { ReasonedFinding } from "@/shared/reason-code";

export type DataQualityCategory = "catalog" | "billing" | "credits" | "operations";

export interface DataQualityIssue {
  category: DataQualityCategory;
  ruleName: string;
  severity: "info" | "warning" | "critical";
  messageFa: string;
  remediationFa: string;
  evidence?: Record<string, unknown>;
}

export interface DataQualityScorecard {
  overallScore: number; // 0-100, higher is healthier
  issueCountBySeverity: Record<"info" | "warning" | "critical", number>;
  issues: DataQualityIssue[];
}

function findingsToIssues(category: DataQualityCategory, ruleName: string, remediationFa: string, findings: ReasonedFinding[]): DataQualityIssue[] {
  return findings.map((finding) => ({
    category,
    ruleName,
    severity: finding.severity,
    messageFa: finding.messageFa,
    remediationFa,
    evidence: finding.evidence,
  }));
}

export function computeDataQualityScorecard(dataset: IntelligenceDataset): DataQualityScorecard {
  const issues: DataQualityIssue[] = [];

  const dependencyGraph = detectFeatureDependencyCycles(dataset.features, dataset.featureDependencies);
  for (const cycle of dependencyGraph.cycles) {
    issues.push({
      category: "catalog", ruleName: "feature_dependency_cycle", severity: "critical",
      messageFa: `چرخه وابستگی بین featureها شناسایی شد: ${cycle.cycleFeatureKeys.join(" -> ")}.`,
      remediationFa: "یکی از یال‌های چرخه را در feature_dependencies حذف یا جهت آن را اصلاح کنید.",
      evidence: { cycle: cycle.cycle },
    });
  }
  for (const missing of dependencyGraph.missingDependencies) {
    issues.push({
      category: "catalog", ruleName: "feature_dependency_missing_target", severity: "critical",
      messageFa: `feature «${missing.featureKey}» به یک feature حذف‌شده/ناموجود وابسته است.`,
      remediationFa: "رکورد feature_dependencies یتیم را حذف کنید یا feature هدف را بازیابی کنید.",
      evidence: { featureId: missing.featureId, missingDependsOnFeatureId: missing.missingDependsOnFeatureId },
    });
  }

  for (const plan of dataset.plans) {
    const readiness = validatePlanVersionPublishReadiness(dataset, plan.id);
    issues.push(...findingsToIssues("catalog", "plan_version_publish_readiness", "بازه اثرگذاری یا وضعیت publish نسخه‌های پلن را اصلاح کنید.", readiness.blockers));
    issues.push(...findingsToIssues("catalog", "plan_version_publish_readiness", "این هشدار مانع انتشار نیست اما باید بررسی شود.", readiness.warnings));
  }

  for (const report of reconcileAllInvoices(dataset)) {
    issues.push(...findingsToIssues("billing", "invoice_reconciliation", "ردیف‌های فاکتور یا تراکنش‌های مرتبط را بازبینی و اصلاح کنید.", report.findings));
  }
  issues.push(...findingsToIssues("billing", "orphan_transaction", "invoiceId تراکنش را به فاکتور معتبر متصل کنید یا رکورد را آرشیو کنید.", detectOrphanTransactions(dataset)));

  const now = new Date();
  for (const paymentMethod of dataset.paymentMethods) {
    if (paymentMethod.status === "active" && paymentMethod.expMonth && paymentMethod.expYear) {
      const expiry = new Date(Date.UTC(paymentMethod.expYear, paymentMethod.expMonth, 0));
      if (expiry.getTime() < now.getTime()) {
        issues.push({
          category: "billing", ruleName: "expired_payment_method_marked_active", severity: "warning",
          messageFa: `روش پرداخت ${paymentMethod.id} از نظر تاریخ منقضی شده اما همچنان status=active دارد.`,
          remediationFa: "وضعیت را به expired به‌روزرسانی کنید تا در تلاش‌های شارژ استفاده نشود.",
          evidence: { paymentMethodId: paymentMethod.id },
        });
      }
    }
  }

  for (const coupon of dataset.coupons) {
    if (coupon.status === "active" && coupon.redeemBy && coupon.redeemBy.getTime() < now.getTime()) {
      issues.push({
        category: "billing", ruleName: "stale_coupon_status", severity: "warning",
        messageFa: `کوپن ${coupon.code} از redeemBy عبور کرده اما همچنان status=active دارد.`,
        remediationFa: "وضعیت کوپن را به expired تغییر دهید تا در محاسبات تخفیف استفاده نشود.",
        evidence: { couponId: coupon.id },
      });
    }
  }

  for (const account of dataset.creditAccounts) {
    const report = reconcileAllCreditAccounts(dataset).find((r) => r.creditAccountId === account.id);
    if (report) {
      issues.push(...findingsToIssues("credits", "credit_ledger_reconciliation", "دفترکل اعتبار و کش موجودی را مطابق formulas-and-kpis.md بازسازی کنید.", report.findings));
    }
  }

  const subscriptionIds = new Set(dataset.subscriptionPeriods.map((p) => p.subscriptionId));
  for (const subscriptionId of subscriptionIds) {
    const periods = dataset.subscriptionPeriods.filter((p) => p.subscriptionId === subscriptionId).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
    for (let i = 0; i < periods.length - 1; i += 1) {
      if (overlaps(periods[i].periodStart, periods[i].periodEnd, periods[i + 1].periodStart, periods[i + 1].periodEnd)) {
        issues.push({
          category: "operations", ruleName: "overlapping_subscription_periods", severity: "critical",
          messageFa: `دو دوره صورتحساب برای اشتراک ${subscriptionId} با هم همپوشانی دارند.`,
          remediationFa: "تاریخ شروع/پایان یکی از دوره‌ها را اصلاح کنید تا از صورتحساب مضاعف جلوگیری شود.",
          evidence: { subscriptionId, periodIds: [periods[i].id, periods[i + 1].id] },
        });
      }
    }
  }

  const severityWeight: Record<DataQualityIssue["severity"], number> = { info: 1, warning: 3, critical: 8 };
  const totalPenalty = issues.reduce((sum, issue) => sum + severityWeight[issue.severity], 0);
  const overallScore = Math.max(0, Math.round(100 - totalPenalty));

  const issueCountBySeverity = { info: 0, warning: 0, critical: 0 };
  for (const issue of issues) issueCountBySeverity[issue.severity] += 1;

  return { overallScore, issueCountBySeverity, issues };
}
