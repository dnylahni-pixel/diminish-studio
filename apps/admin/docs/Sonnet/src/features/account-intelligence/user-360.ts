// =============================================================================
// User 360 / Account Intelligence Read Model
// -----------------------------------------------------------------------------
// Capability: buildUserAccountIntelligenceProfile
// Tables used: users, subscriptions, plans, plan_versions, invoices,
//              transactions, credit_accounts, trials, subscription_events
//              (plus every table the composed engines below read)
// Problem solved: support/finance/product staff currently have to open five
// different screens to answer "who is this customer, what do they pay, are
// they healthy, and what should we do next". This module is the single
// cross-domain read model that composes the other engines (entitlement
// resolver, health score, credit reconciliation & runway) into one profile.
// Consumer: intelligence-lab "User 360" tab, decision-engine (next best
// action reads this profile as its primary input).
// =============================================================================

import type { IntelligenceDataset, UUID } from "@/shared/dataset-types";
import { resolveEffectiveSubscriptionEntitlements } from "@/features/entitlement-engine";
import { scoreSubscriptionHealth } from "@/features/subscription-intelligence/health-score";
import { reconcileCreditAccountBalance } from "@/features/credit-intelligence/ledger-reconciliation";
import { calculateCreditBurnRateAndRunway } from "@/features/credit-intelligence/burn-rate-runway";
import { ZERO } from "@/shared/money";

export interface UserAccountIntelligenceProfile {
  userId: UUID;
  email: string;
  fullName: string | null;
  acquisitionSource: string | null;
  accountAgeDays: number;
  subscriptions: {
    subscriptionId: UUID;
    planKey: string;
    status: string;
    currency: string;
    healthScore: number;
    riskLevel: string;
    grantedFeatureCount: number;
    totalFeatureCount: number;
  }[];
  lifetimeInvoicedTotal: { currency: string; amount: string }[];
  lifetimeSuccessfulPayments: { currency: string; amount: string }[];
  creditAccounts: {
    creditAccountId: UUID;
    currency: string;
    balance: string;
    isReconciled: boolean;
    runwayLabel: string;
  }[];
  paymentMethodOnFile: boolean;
}

export function buildUserAccountIntelligenceProfile(
  dataset: IntelligenceDataset,
  userId: UUID,
  now: Date,
): UserAccountIntelligenceProfile {
  const user = dataset.users.find((row) => row.id === userId);
  if (!user) throw new Error(`Unknown user: ${userId}`);

  const planById = new Map(dataset.plans.map((plan) => [plan.id, plan]));
  const planVersionById = new Map(dataset.planVersions.map((pv) => [pv.id, pv]));

  const userSubscriptions = dataset.subscriptions.filter((s) => s.userId === userId);
  const subscriptions = userSubscriptions.map((subscription) => {
    const planVersion = planVersionById.get(subscription.planVersionId);
    const plan = planVersion ? planById.get(planVersion.planId) : undefined;
    const health = scoreSubscriptionHealth(dataset, subscription.id, now);
    const entitlementResult = resolveEffectiveSubscriptionEntitlements(dataset, subscription.id);
    const grantedFeatureCount = entitlementResult.payload.entitlements.filter((e) => e.granted).length;
    return {
      subscriptionId: subscription.id,
      planKey: plan?.key ?? "unknown",
      status: subscription.status,
      currency: subscription.currency,
      healthScore: health.payload.score,
      riskLevel: health.payload.riskLevel,
      grantedFeatureCount,
      totalFeatureCount: entitlementResult.payload.entitlements.length,
    };
  });

  const invoicesByCurrency = new Map<string, bigint>();
  for (const invoice of dataset.invoices.filter((inv) => inv.userId === userId)) {
    invoicesByCurrency.set(invoice.currency, (invoicesByCurrency.get(invoice.currency) ?? ZERO) + invoice.total);
  }

  const paymentsByCurrency = new Map<string, bigint>();
  for (const transaction of dataset.transactions.filter((t) => t.userId === userId && t.type === "charge" && t.status === "succeeded")) {
    paymentsByCurrency.set(transaction.currency, (paymentsByCurrency.get(transaction.currency) ?? ZERO) + transaction.amount);
  }

  const creditAccounts = dataset.creditAccounts
    .filter((account) => account.userId === userId)
    .map((account) => {
      const reconciliation = reconcileCreditAccountBalance(dataset, account.id);
      const burnRate = calculateCreditBurnRateAndRunway(dataset, account.id, now);
      return {
        creditAccountId: account.id,
        currency: account.currency,
        balance: account.balance.toString(),
        isReconciled: reconciliation.isFullyReconciled,
        runwayLabel: burnRate.runwayLabel,
      };
    });

  const accountAgeDays = Math.max(0, Math.round((now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)));

  return {
    userId,
    email: user.email,
    fullName: user.fullName,
    acquisitionSource: user.acquisitionSource,
    accountAgeDays,
    subscriptions,
    lifetimeInvoicedTotal: Array.from(invoicesByCurrency.entries()).map(([currency, amount]) => ({ currency, amount: amount.toString() })),
    lifetimeSuccessfulPayments: Array.from(paymentsByCurrency.entries()).map(([currency, amount]) => ({ currency, amount: amount.toString() })),
    creditAccounts,
    paymentMethodOnFile: dataset.paymentMethods.some((pm) => pm.userId === userId && pm.status === "active"),
  };
}
