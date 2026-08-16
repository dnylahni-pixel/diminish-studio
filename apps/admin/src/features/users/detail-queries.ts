import {
  and,
  count,
  desc,
  eq,
  gte,
} from "drizzle-orm";
import { db } from "@/db";
import {
  couponRedemptions,
  creditAccounts,
  creditGrants,
  creditLedger,
  creditReservations,
  invoices,
  paymentMethods,
  planFeatures,
  planLimits,
  planPrices,
  plans,
  planVersions,
  subscriptionAddons,
  subscriptionEvents,
  subscriptions,
  transactions,
  trials,
  usageDailyAggregates,
  users,
} from "@/db/schema";
import { buildUserAccountIntelligenceProfile } from "./intelligence/account/user-360";
import { summarizeEntitlements } from "./intelligence/entitlements";
import type { ActivityEvent, UserDetail } from "./detail-types";

const RECENT_LIMIT = 12;
const DAY_IN_MS = 86_400_000;

export function parseUserId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function latestDate(values: Array<Date | null | undefined>) {
  return values
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function readablePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const candidate = record.description ?? record.reason ?? record.note;
  return typeof candidate === "string" ? candidate : null;
}

function couponLabel(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") return "Coupon";
  const record = snapshot as Record<string, unknown>;
  const candidate = record.code ?? record.name;
  return typeof candidate === "string" ? candidate : "Coupon";
}

function groupAmounts(
  rows: Array<{ currency: string; amount: number }>,
): Array<{ currency: string; amount: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export async function getUserDetail(userId: number): Promise<UserDetail | null> {
  const [userRows, subscriptionRows, creditAccountRows] = await Promise.all([
    db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        preferredInstrument: users.preferredInstrument,
        createdAt: users.createdAt,
        storageUsedBytes: users.storageUsedBytes,
        storageQuotaBytes: users.storageQuotaBytes,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        currency: subscriptions.currency,
        startedAt: subscriptions.startedAt,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        endedAt: subscriptions.endedAt,
        createdAt: subscriptions.createdAt,
        planId: plans.id,
        planCode: plans.code,
        planName: plans.name,
        planVersionId: planVersions.id,
        versionNumber: planVersions.versionNumber,
        versionTitle: planVersions.title,
        versionStatus: planVersions.status,
        planPriceId: planPrices.id,
        priceAmount: planPrices.amount,
        priceCurrency: planPrices.currency,
        priceType: planPrices.priceType,
        billingInterval: planPrices.billingInterval,
        billingIntervalCount: planPrices.billingIntervalCount,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(planVersions, eq(subscriptions.planVersionId, planVersions.id))
      .leftJoin(planPrices, eq(subscriptions.planPriceId, planPrices.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt), desc(subscriptions.id))
      .limit(1),
    db
      .select()
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId))
      .limit(1),
  ]);

  const user = userRows[0];
  if (!user) return null;

  const subscription = subscriptionRows[0] ?? null;
  const creditAccount = creditAccountRows[0] ?? null;
  const now = new Date();
  const recentPaymentWindow = new Date(now.getTime() - 90 * DAY_IN_MS);

  const [
    eventRows,
    ledgerRows,
    grantRows,
    reservationRows,
    invoiceRows,
    transactionRows,
    trialRows,
    couponRows,
    paymentMethodRows,
    usageRows,
    featureCountRows,
    limitCountRows,
    addonCountRows,
  ] = await Promise.all([
    subscription
      ? db
          .select()
          .from(subscriptionEvents)
          .where(eq(subscriptionEvents.subscriptionId, subscription.id))
          .orderBy(desc(subscriptionEvents.eventTime))
          .limit(RECENT_LIMIT)
      : [],
    creditAccount
      ? db
          .select()
          .from(creditLedger)
          .where(eq(creditLedger.creditAccountId, creditAccount.id))
          .orderBy(desc(creditLedger.createdAt))
          .limit(RECENT_LIMIT)
      : [],
    creditAccount
      ? db
          .select()
          .from(creditGrants)
          .where(eq(creditGrants.creditAccountId, creditAccount.id))
          .orderBy(desc(creditGrants.grantedAt))
          .limit(RECENT_LIMIT)
      : [],
    creditAccount
      ? db
          .select()
          .from(creditReservations)
          .where(
            and(
              eq(creditReservations.creditAccountId, creditAccount.id),
              eq(creditReservations.status, "active"),
            ),
          )
          .orderBy(desc(creditReservations.createdAt))
          .limit(RECENT_LIMIT)
      : [],
    db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        processedAt: transactions.processedAt,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select()
      .from(trials)
      .where(eq(trials.userId, userId))
      .orderBy(desc(trials.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select()
      .from(couponRedemptions)
      .where(eq(couponRedemptions.userId, userId))
      .orderBy(desc(couponRedemptions.redeemedAt))
      .limit(RECENT_LIMIT),
    db
      .select({
        id: paymentMethods.id,
        provider: paymentMethods.provider,
        type: paymentMethods.type,
        brand: paymentMethods.brand,
        last4: paymentMethods.last4,
        expMonth: paymentMethods.expMonth,
        expYear: paymentMethods.expYear,
        isDefault: paymentMethods.isDefault,
        status: paymentMethods.status,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt)),
    db
      .select({
        dateBucket: usageDailyAggregates.dateBucket,
        totalCredits: usageDailyAggregates.totalCredits,
      })
      .from(usageDailyAggregates)
      .where(
        and(
          eq(usageDailyAggregates.userId, userId),
          gte(usageDailyAggregates.dateBucket, new Date(now.getTime() - 90 * DAY_IN_MS)),
        ),
      )
      .orderBy(desc(usageDailyAggregates.dateBucket)),
    subscription
      ? db
          .select({ value: count() })
          .from(planFeatures)
          .where(
            and(
              eq(planFeatures.planVersionId, subscription.planVersionId),
              eq(planFeatures.isIncluded, true),
            ),
          )
      : [],
    subscription
      ? db
          .select({ value: count() })
          .from(planLimits)
          .where(eq(planLimits.planVersionId, subscription.planVersionId))
      : [],
    subscription
      ? db
          .select({ value: count() })
          .from(subscriptionAddons)
          .where(
            and(
              eq(subscriptionAddons.subscriptionId, subscription.id),
              eq(subscriptionAddons.status, "active"),
            ),
          )
      : [],
  ]);

  const openInvoices = invoiceRows.filter((invoice) =>
    ["open", "uncollectible"].includes(invoice.status),
  );
  const overdueInvoices = openInvoices.filter(
    (invoice) =>
      invoice.status === "uncollectible" ||
      (invoice.dueAt !== null && invoice.dueAt < now && invoice.amountDue > 0),
  );
  const failedPayments = transactionRows.filter(
    (transaction) =>
      transaction.status === "failed" &&
      transaction.createdAt >= recentPaymentWindow,
  );
  const storageUtilization =
    user.storageQuotaBytes > 0
      ? user.storageUsedBytes / user.storageQuotaBytes
      : 0;
  const lastActivity = latestDate([
    ...eventRows.map((event) => event.eventTime),
    ...ledgerRows.map((entry) => entry.createdAt),
    ...transactionRows.map((transaction) => transaction.processedAt ?? transaction.createdAt),
    ...usageRows.map((usage) => usage.dateBucket),
  ]);
  const daysSinceLastActivity = lastActivity
    ? Math.max(0, Math.floor((now.getTime() - lastActivity.getTime()) / DAY_IN_MS))
    : null;

  const intelligence = buildUserAccountIntelligenceProfile({
    accountBalance: creditAccount?.balance ?? null,
    reservedBalance: creditAccount?.reservedBalance ?? null,
    ledger: ledgerRows.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      createdAt: entry.createdAt,
    })),
    usage: usageRows.map((usage) => ({
      date: usage.dateBucket,
      credits: usage.totalCredits,
    })),
    healthSignals: {
      subscriptionStatus: subscription?.status ?? null,
      openInvoiceCount: openInvoices.length,
      overdueInvoiceCount: overdueInvoices.length,
      failedPaymentCount: failedPayments.length,
      storageUtilization,
      daysSinceLastActivity,
    },
    now,
  });

  const activity: ActivityEvent[] = [
    ...eventRows.map((event) => ({
      id: `subscription-${event.id}`,
      kind: "subscription" as const,
      title: event.eventType.replaceAll("_", " "),
      description: readablePayload(event.payload),
      occurredAt: event.eventTime.toISOString(),
      tone: event.eventType === "past_due" ? ("danger" as const) : ("info" as const),
    })),
    ...ledgerRows.map((entry) => ({
      id: `credit-${entry.id}`,
      kind: "credit" as const,
      title: entry.entryType.replaceAll("_", " "),
      description: entry.description,
      occurredAt: entry.createdAt.toISOString(),
      tone:
        entry.amount < 0
          ? ("warning" as const)
          : entry.entryType === "expiration"
            ? ("danger" as const)
            : ("success" as const),
    })),
    ...transactionRows.map((transaction) => ({
      id: `payment-${transaction.id}`,
      kind: "payment" as const,
      title: `${transaction.type.replaceAll("_", " ")} · ${transaction.status}`,
      description: transaction.description,
      occurredAt: (transaction.processedAt ?? transaction.createdAt).toISOString(),
      tone:
        transaction.status === "succeeded"
          ? ("success" as const)
          : transaction.status === "failed"
            ? ("danger" as const)
            : ("neutral" as const),
    })),
    ...trialRows.map((trial) => ({
      id: `trial-${trial.id}`,
      kind: "trial" as const,
      title: `Trial ${trial.status}`,
      description: trial.source,
      occurredAt: trial.createdAt.toISOString(),
      tone: trial.status === "converted" ? ("success" as const) : ("neutral" as const),
    })),
    ...couponRows.map((coupon) => ({
      id: `coupon-${coupon.id}`,
      kind: "coupon" as const,
      title: `${couponLabel(coupon.couponSnapshot)} redeemed`,
      description: coupon.discountType,
      occurredAt: coupon.redeemedAt.toISOString(),
      tone: coupon.status === "reversed" ? ("warning" as const) : ("info" as const),
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, RECENT_LIMIT);

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currency: subscription.currency,
          startedAt: toIso(subscription.startedAt),
          currentPeriodStart: toIso(subscription.currentPeriodStart),
          currentPeriodEnd: toIso(subscription.currentPeriodEnd),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: toIso(subscription.canceledAt),
          endedAt: toIso(subscription.endedAt),
          plan: {
            id: subscription.planId,
            code: subscription.planCode,
            name: subscription.planName,
          },
          planVersion: {
            id: subscription.planVersionId,
            versionNumber: subscription.versionNumber,
            title: subscription.versionTitle,
            status: subscription.versionStatus,
          },
          planPrice: subscription.planPriceId
            ? {
                id: subscription.planPriceId,
                amount: subscription.priceAmount ?? 0,
                currency: subscription.priceCurrency ?? subscription.currency ?? "—",
                priceType: subscription.priceType ?? "recurring",
                billingInterval: subscription.billingInterval,
                billingIntervalCount: subscription.billingIntervalCount,
              }
            : null,
        }
      : null,
    subscriptionEvents: eventRows.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      eventTime: event.eventTime.toISOString(),
      actorUserId: event.actorUserId,
      payload: event.payload,
    })),
    creditAccount: creditAccount
      ? {
          id: creditAccount.id,
          status: creditAccount.status,
          currencyContext: creditAccount.currencyContext,
          balance: creditAccount.balance,
          reservedBalance: creditAccount.reservedBalance,
          lifetimeGranted: creditAccount.lifetimeGranted,
          lifetimeUsed: creditAccount.lifetimeUsed,
          updatedAt: creditAccount.updatedAt.toISOString(),
        }
      : null,
    creditLedger: ledgerRows.map((entry) => ({
      id: entry.id,
      entryType: entry.entryType,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    })),
    creditGrants: grantRows.map((grant) => ({
      id: grant.id,
      source: grant.source,
      amountGranted: grant.amountGranted,
      amountRemaining: grant.amountRemaining,
      grantedAt: grant.grantedAt.toISOString(),
      expiresAt: toIso(grant.expiresAt),
      reference: grant.reference,
    })),
    creditReservations: reservationRows.map((reservation) => ({
      id: reservation.id,
      reservedAmount: reservation.reservedAmount,
      capturedAmount: reservation.capturedAmount,
      releasedAmount: reservation.releasedAmount,
      status: reservation.status,
      expiresAt: toIso(reservation.expiresAt),
      createdAt: reservation.createdAt.toISOString(),
    })),
    invoices: invoiceRows.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      issuedAt: toIso(invoice.issuedAt),
      dueAt: toIso(invoice.dueAt),
      paidAt: toIso(invoice.paidAt),
      createdAt: invoice.createdAt.toISOString(),
    })),
    transactions: transactionRows.map((transaction) => ({
      ...transaction,
      processedAt: toIso(transaction.processedAt),
      createdAt: transaction.createdAt.toISOString(),
    })),
    trials: trialRows.map((trial) => ({
      id: trial.id,
      status: trial.status,
      startsAt: trial.startsAt.toISOString(),
      endsAt: trial.endsAt.toISOString(),
      source: trial.source,
      createdAt: trial.createdAt.toISOString(),
    })),
    couponRedemptions: couponRows.map((coupon) => ({
      id: coupon.id,
      status: coupon.status,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
      discountPercentBps: coupon.discountPercentBps,
      creditAmount: coupon.creditAmount,
      currency: coupon.currency,
      redeemedAt: coupon.redeemedAt.toISOString(),
      couponLabel: couponLabel(coupon.couponSnapshot),
    })),
    paymentMethods: paymentMethodRows,
    commerce: {
      lifetimeInvoiced: groupAmounts(
        invoiceRows.map((invoice) => ({
          currency: invoice.currency,
          amount: invoice.totalAmount,
        })),
      ),
      successfulPayments: groupAmounts(
        transactionRows
          .filter(
            (transaction) =>
              transaction.type === "charge" && transaction.status === "succeeded",
          )
          .map((transaction) => ({
            currency: transaction.currency,
            amount: transaction.amount,
          })),
      ),
      openInvoiceCount: openInvoices.length,
      overdueInvoiceCount: overdueInvoices.length,
      paymentMethodOnFile: paymentMethodRows.some(
        (method) => method.status === "active",
      ),
    },
    entitlements: summarizeEntitlements({
      includedFeatures: Number(featureCountRows[0]?.value ?? 0),
      configuredLimits: Number(limitCountRows[0]?.value ?? 0),
      activeAddons: Number(addonCountRows[0]?.value ?? 0),
    }),
    intelligence,
    activity,
  };
}
