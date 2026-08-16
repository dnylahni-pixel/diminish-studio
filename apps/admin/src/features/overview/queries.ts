import { and, asc, count, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  creditAccounts,
  invoices,
  planPrices,
  plans,
  subscriptions,
  transactions,
  trials,
  usageDailyAggregates,
  users,
} from "@/db/schema";
import type { TFunction } from "@/i18n/translate";
import type {
  AttentionItem,
  OverviewDashboardData,
  OverviewFilterParams,
  PlanPerformanceItem,
  SubscriptionHealthDistribution,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function formatDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value: string | undefined, endOfDay: boolean) {
  if (!value || !DATE_PATTERN.test(value)) return null;

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOverviewFilters(params: OverviewFilterParams) {
  const defaultTo = new Date();
  const defaultFrom = new Date(defaultTo);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  let from = parseDateParam(params.from, false) ?? defaultFrom;
  let to = parseDateParam(params.to, true) ?? defaultTo;

  if (from > to) {
    from = defaultFrom;
    to = defaultTo;
  }

  const requestedCurrency = params.currency?.toUpperCase();
  const currency =
    requestedCurrency && CURRENCY_PATTERN.test(requestedCurrency) ? requestedCurrency : "USD";

  return {
    from,
    to,
    serialized: {
      from: formatDateParam(from),
      to: formatDateParam(to),
      currency,
    },
  };
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getOverviewDashboardData(
  rawParams: OverviewFilterParams,
  t: TFunction,
): Promise<OverviewDashboardData> {
  const { from, to, serialized: filters } = parseOverviewFilters(rawParams);
  const { currency } = filters;
  const now = new Date();
  const trialWarningDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const revenueDate = sql<string>`to_char(date_trunc('day', ${transactions.createdAt}), 'YYYY-MM-DD')`;
  const creditDate = sql<string>`to_char(date_trunc('day', ${usageDailyAggregates.dateBucket}), 'YYYY-MM-DD')`;

  const [
    totalUsersResult,
    newUsersResult,
    subscriptionHealthRows,
    overdueInvoicesResult,
    creditsResult,
    revenueResult,
    mrrResult,
    trialResult,
    revenueTrendRows,
    creditTrendRows,
    pastDueRows,
    overdueInvoiceRows,
    trialEndingRows,
    planPerformanceRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(and(gte(users.createdAt, from), lte(users.createdAt, to))),
    db
      .select({ status: subscriptions.status, value: count() })
      .from(subscriptions)
      .groupBy(subscriptions.status),
    db
      .select({ value: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "open"),
          eq(invoices.currency, currency),
          lte(invoices.dueAt, now),
        ),
      ),
    db
      .select({
        balance: sum(creditAccounts.balance),
        reserved: sum(creditAccounts.reservedBalance),
        granted: sum(creditAccounts.lifetimeGranted),
        used: sum(creditAccounts.lifetimeUsed),
      })
      .from(creditAccounts),
    db
      .select({
        value: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${transactions.type} = 'charge' AND ${transactions.status} = 'succeeded'
              THEN ${transactions.amount}
            WHEN ${transactions.type} = 'refund' AND ${transactions.status} = 'succeeded'
              THEN -${transactions.amount}
            ELSE 0
          END
        ), 0)::text`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.currency, currency),
          gte(transactions.createdAt, from),
          lte(transactions.createdAt, to),
        ),
      ),
    db
      .select({
        value: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${planPrices.billingInterval} = 'year'
              THEN ${planPrices.amount} / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
            WHEN ${planPrices.billingInterval} = 'month'
              THEN ${planPrices.amount} / COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1)
            WHEN ${planPrices.billingInterval} = 'week'
              THEN (${planPrices.amount} * 52.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
            WHEN ${planPrices.billingInterval} = 'day'
              THEN (${planPrices.amount} * 365.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
            ELSE 0
          END
        ), 0)::text`,
      })
      .from(subscriptions)
      .innerJoin(planPrices, eq(subscriptions.planPriceId, planPrices.id))
      .where(
        and(
          eq(subscriptions.status, "active"),
          eq(planPrices.priceType, "recurring"),
          eq(planPrices.currency, currency),
        ),
      ),
    db
      .select({
        eligible: count(),
        converted: sql<string>`COALESCE(SUM(CASE WHEN ${trials.status} = 'converted' THEN 1 ELSE 0 END), 0)::text`,
      })
      .from(trials)
      .where(
        and(
          inArray(trials.status, ["converted", "expired"]),
          gte(trials.endsAt, from),
          lte(trials.endsAt, to),
        ),
      ),
    db
      .select({
        date: revenueDate,
        amount: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${transactions.type} = 'charge' AND ${transactions.status} = 'succeeded'
              THEN ${transactions.amount}
            WHEN ${transactions.type} = 'refund' AND ${transactions.status} = 'succeeded'
              THEN -${transactions.amount}
            ELSE 0
          END
        ), 0)::text`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.currency, currency),
          gte(transactions.createdAt, from),
          lte(transactions.createdAt, to),
        ),
      )
      .groupBy(revenueDate)
      .orderBy(revenueDate),
    db
      .select({
        date: creditDate,
        credits: sum(usageDailyAggregates.totalCredits),
      })
      .from(usageDailyAggregates)
      .where(
        and(
          gte(usageDailyAggregates.dateBucket, from),
          lte(usageDailyAggregates.dateBucket, to),
        ),
      )
      .groupBy(creditDate)
      .orderBy(creditDate),
    db
      .select({
        id: subscriptions.id,
        email: users.email,
        planName: plans.name,
        date: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "past_due"))
      .orderBy(asc(subscriptions.currentPeriodEnd))
      .limit(5),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        email: users.email,
        amount: invoices.amountDue,
        currency: invoices.currency,
        date: invoices.dueAt,
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(
        and(
          eq(invoices.status, "open"),
          eq(invoices.currency, currency),
          lte(invoices.dueAt, now),
        ),
      )
      .orderBy(asc(invoices.dueAt))
      .limit(5),
    db
      .select({
        id: trials.id,
        email: users.email,
        planName: plans.name,
        date: trials.endsAt,
      })
      .from(trials)
      .innerJoin(users, eq(trials.userId, users.id))
      .innerJoin(plans, eq(trials.planId, plans.id))
      .where(
        and(
          eq(trials.status, "active"),
          gte(trials.endsAt, now),
          lte(trials.endsAt, trialWarningDate),
        ),
      )
      .orderBy(asc(trials.endsAt))
      .limit(5),
    db
      .select({
        id: plans.id,
        name: plans.name,
        subscribers: sql<string>`COUNT(DISTINCT ${subscriptions.id})::text`,
        mrr: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${planPrices.currency} = ${currency} AND ${planPrices.priceType} = 'recurring' THEN
              CASE
                WHEN ${planPrices.billingInterval} = 'year'
                  THEN ${planPrices.amount} / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
                WHEN ${planPrices.billingInterval} = 'month'
                  THEN ${planPrices.amount} / COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1)
                WHEN ${planPrices.billingInterval} = 'week'
                  THEN (${planPrices.amount} * 52.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
                WHEN ${planPrices.billingInterval} = 'day'
                  THEN (${planPrices.amount} * 365.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
                ELSE 0
              END
            ELSE 0
          END
        ), 0)::text`,
      })
      .from(plans)
      .leftJoin(
        subscriptions,
        and(eq(subscriptions.planId, plans.id), eq(subscriptions.status, "active")),
      )
      .leftJoin(planPrices, eq(subscriptions.planPriceId, planPrices.id))
      .groupBy(plans.id, plans.name),
  ]);

  const subscriptionHealth: SubscriptionHealthDistribution = {
    active: 0,
    trialing: 0,
    pastDue: 0,
    paused: 0,
    canceled: 0,
    incomplete: 0,
    expired: 0,
  };

  for (const row of subscriptionHealthRows) {
    const value = toNumber(row.value);

    if (row.status === "past_due") subscriptionHealth.pastDue = value;
    else if (row.status in subscriptionHealth) {
      subscriptionHealth[row.status as keyof SubscriptionHealthDistribution] = value;
    }
  }

  const creditBalance = toNumber(creditsResult[0]?.balance);
  const creditReserved = toNumber(creditsResult[0]?.reserved);
  const creditGranted = toNumber(creditsResult[0]?.granted);
  const creditUsed = toNumber(creditsResult[0]?.used);
  const eligibleTrials = toNumber(trialResult[0]?.eligible);
  const convertedTrials = toNumber(trialResult[0]?.converted);

  const attentionRequired: AttentionItem[] = [
    ...pastDueRows.map((row) => ({
      id: row.id,
      type: "past_due_subscription" as const,
      title: t("overview.attention.item.pastDueSubscription", { plan: row.planName }),
      subtitle: t("overview.attention.item.pastDueSubscriber", { email: row.email }),
      severity: "danger" as const,
      date: (row.date ?? now).toISOString(),
    })),
    ...overdueInvoiceRows.map((row) => ({
      id: row.id,
      type: "overdue_invoice" as const,
      title: row.invoiceNumber,
      subtitle: t("overview.attention.item.overdueInvoice", { email: row.email }),
      severity: "warning" as const,
      date: (row.date ?? now).toISOString(),
      amount: toNumber(row.amount),
      currency: row.currency,
    })),
    ...trialEndingRows.map((row) => ({
      id: row.id,
      type: "trial_ending_soon" as const,
      title: t("overview.attention.item.trialEndingSoon", { plan: row.planName }),
      subtitle: t("overview.attention.item.trialEndingSubscriber", { email: row.email }),
      severity: "info" as const,
      date: row.date.toISOString(),
    })),
  ].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const mappedPlanPerformance = planPerformanceRows.map((row) => ({
    id: row.id,
    name: row.name,
    activeSubscribers: toNumber(row.subscribers),
    mrr: toNumber(row.mrr),
  }));
  const totalPlanMrr = mappedPlanPerformance.reduce((total, plan) => total + plan.mrr, 0);
  const planPerformance: PlanPerformanceItem[] = mappedPlanPerformance
    .map((plan) => ({
      ...plan,
      share: totalPlanMrr > 0 ? (plan.mrr / totalPlanMrr) * 100 : 0,
    }))
    .sort((left, right) => right.mrr - left.mrr);

  return {
    filters,
    kpis: {
      totalRevenue: toNumber(revenueResult[0]?.value),
      mrr: toNumber(mrrResult[0]?.value),
      activeSubscriptionsCount: subscriptionHealth.active,
      availableCredits: creditBalance - creditReserved,
      totalUsersCount: toNumber(totalUsersResult[0]?.value),
      newUsersCount: toNumber(newUsersResult[0]?.value),
      atRiskCount: subscriptionHealth.pastDue + toNumber(overdueInvoicesResult[0]?.value),
      creditUtilizationRate: creditGranted > 0 ? creditUsed / creditGranted : 0,
      trialConversionRate: eligibleTrials > 0 ? convertedTrials / eligibleTrials : 0,
    },
    revenueTrend: revenueTrendRows.map((row) => ({
      date: row.date,
      amount: toNumber(row.amount),
    })),
    creditTrend: creditTrendRows.map((row) => ({
      date: row.date,
      credits: toNumber(row.credits),
    })),
    subscriptionHealth,
    attentionRequired,
    planPerformance,
  };
}
