import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  subscriptions,
  subscriptionEvents,
  creditAccounts,
  creditLedger,
  creditGrants,
  creditReservations,
  invoices,
  transactions,
  trials,
  couponRedemptions,
} from "@/db/schema";
import type { ActivityEvent, UserDetail } from "./types";

const RECENT_LIMIT = 10;

/**
 * Parses and validates a route param as a positive integer user id.
 * Returns null for anything non-numeric or non-positive so callers
 * can trigger notFound() without leaking parsing details.
 */
export function parseUserId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

/**
 * Loads everything the user detail page needs in a small, fixed number
 * of queries (no N+1): one query per related table, each scoped by
 * userId, executed in parallel.
 */
export async function getUserDetail(userId: number): Promise<UserDetail | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      preferredInstrument: true,
      createdAt: true,
      storageUsedBytes: true,
      storageQuotaBytes: true,
      // Explicitly excluded: passwordHash, providerPayload, or any
      // sensitive/internal columns must never be selected here.
    },
  });

  if (!user) return null;

  const [
    subscription,
    subEvents,
    creditAccount,
    ledgerEntries,
    grants,
    reservations,
    invoiceRows,
    transactionRows,
    trialRows,
    couponRows,
  ] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      orderBy: desc(subscriptions.createdAt),
      with: {
        plan: true,
        planVersion: true,
        planPrice: true,
      },
    }),
    db.query.subscriptionEvents.findMany({
      where: eq(subscriptionEvents.userId, userId),
      orderBy: desc(subscriptionEvents.createdAt),
      limit: RECENT_LIMIT,
    }),
    db.query.creditAccounts.findFirst({
      where: eq(creditAccounts.userId, userId),
    }),
    db.query.creditLedger.findMany({
      where: eq(creditLedger.userId, userId),
      orderBy: desc(creditLedger.createdAt),
      limit: RECENT_LIMIT,
    }),
    db.query.creditGrants.findMany({
      where: and(
        eq(creditGrants.userId, userId),
        eq(creditGrants.status, "active"),
      ),
      orderBy: desc(creditGrants.createdAt),
    }),
    db.query.creditReservations.findMany({
      where: and(
        eq(creditReservations.userId, userId),
        eq(creditReservations.status, "active"),
      ),
      orderBy: desc(creditReservations.createdAt),
    }),
    db.query.invoices.findMany({
      where: eq(invoices.userId, userId),
      orderBy: desc(invoices.createdAt),
      limit: RECENT_LIMIT,
    }),
    db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      orderBy: desc(transactions.createdAt),
      limit: RECENT_LIMIT,
      // Never select rawGatewayPayload / paymentToken / providerResponse.
      columns: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        processedAt: true,
        createdAt: true,
      },
    }),
    db.query.trials.findMany({
      where: eq(trials.userId, userId),
      orderBy: desc(trials.createdAt),
    }),
    db.query.couponRedemptions.findMany({
      where: eq(couponRedemptions.userId, userId),
      orderBy: desc(couponRedemptions.createdAt),
    }),
  ]);

  return {
    user,
    subscription: subscription ?? null,
    subscriptionEvents: subEvents,
    creditAccount: creditAccount ?? null,
    creditLedger: ledgerEntries,
    creditGrants: grants,
    creditReservations: reservations,
    invoices: invoiceRows,
    transactions: transactionRows,
    trials: trialRows,
    couponRedemptions: couponRows,
  };
}

/**
 * Builds a unified, time-sorted commercial activity feed from
 * subscription events, credit ledger entries, trials and coupon
 * redemptions. Product usage (songs/artists/chords) is intentionally
 * excluded per spec.
 */
export function buildActivityFeed(detail: UserDetail): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const e of detail.subscriptionEvents) {
    events.push({
      id: `sub-${e.id}`,
      kind: "subscription",
      title: e.eventType ?? "Subscription event",
      description: e.description ?? null,
      occurredAt: e.createdAt,
    });
  }

  for (const l of detail.creditLedger) {
    events.push({
      id: `credit-${l.id}`,
      kind: "credit",
      title: `${l.entryType} (${l.amount > 0 ? "+" : ""}${l.amount})`,
      description: l.description ?? null,
      occurredAt: l.createdAt,
    });
  }

  for (const t of detail.trials) {
    events.push({
      id: `trial-${t.id}`,
      kind: "trial",
      title: "Trial",
      description: t.status ?? null,
      occurredAt: t.createdAt,
    });
  }

  for (const c of detail.couponRedemptions) {
    events.push({
      id: `coupon-${c.id}`,
      kind: "coupon",
      title: "Coupon redeemed",
      description: c.couponCode ?? null,
      occurredAt: c.createdAt,
    });
  }

  return events
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, RECENT_LIMIT);
}
