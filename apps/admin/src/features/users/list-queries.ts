import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { creditAccounts, plans, subscriptions, users } from "@/db/schema";
import type {
  SortDirection,
  SubscriptionStatus,
  UserRowData,
  UsersFilters,
  UsersListData,
  UsersSearchParams,
  UsersSort,
  UsersSubscriptionFilter,
} from "./list-types";

const PAGE_SIZES = [25, 50, 100] as const;
const SUBSCRIPTION_FILTERS: UsersSubscriptionFilter[] = [
  "all",
  "none",
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
  "expired",
];
const SORT_OPTIONS: UsersSort[] = ["createdAt", "username", "creditBalance"];
const DIRECTIONS: SortDirection[] = ["asc", "desc"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isOneOf<T extends string>(
  value: string | undefined,
  options: readonly T[],
): value is T {
  return value !== undefined && options.includes(value as T);
}

function parseDate(value: string | undefined, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

function toCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseUsersFilters(raw: UsersSearchParams): UsersFilters {
  const q = (firstParam(raw.q) ?? "").trim().slice(0, 120);
  const requestedSubscription = firstParam(raw.subscription);
  const requestedSort = firstParam(raw.sort);
  const requestedDirection = firstParam(raw.direction);
  const requestedPage = Number.parseInt(firstParam(raw.page) ?? "1", 10);
  const requestedPageSize = Number.parseInt(firstParam(raw.pageSize) ?? "25", 10);

  return {
    q,
    subscription: isOneOf(requestedSubscription, SUBSCRIPTION_FILTERS)
      ? requestedSubscription
      : "all",
    plan: firstParam(raw.plan) ?? "all",
    from: firstParam(raw.from) ?? "",
    to: firstParam(raw.to) ?? "",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: PAGE_SIZES.includes(requestedPageSize as (typeof PAGE_SIZES)[number])
      ? requestedPageSize
      : 25,
    sort: isOneOf(requestedSort, SORT_OPTIONS) ? requestedSort : "createdAt",
    direction: isOneOf(requestedDirection, DIRECTIONS)
      ? requestedDirection
      : "desc",
  };
}

export async function getUsersListData(
  rawParams: UsersSearchParams,
): Promise<UsersListData> {
  const filters = parseUsersFilters(rawParams);
  const conditions: Array<SQL | undefined> = [];
  const fromDate = parseDate(filters.from);
  const toDate = parseDate(filters.to, true);

  if (filters.q) {
    const search = `%${filters.q}%`;
    const numericId = /^\d+$/.test(filters.q) ? Number(filters.q) : null;
    conditions.push(
      or(
        ilike(users.email, search),
        ilike(users.username, search),
        numericId !== null ? eq(users.id, numericId) : undefined,
      ),
    );
  }

  if (filters.subscription === "none") {
    conditions.push(
      notExists(
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.userId, users.id)),
      ),
    );
  } else if (filters.subscription !== "all") {
    conditions.push(
      exists(
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, users.id),
              eq(subscriptions.status, filters.subscription),
            ),
          ),
      ),
    );
  }

  if (filters.plan !== "all") {
    conditions.push(
      exists(
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, users.id),
              eq(subscriptions.planId, filters.plan),
            ),
          ),
      ),
    );
  }

  if (fromDate) conditions.push(gte(users.createdAt, fromDate));
  if (toDate) conditions.push(lte(users.createdAt, toDate));

  const whereClause = and(...conditions);
  const sortColumn =
    filters.sort === "username"
      ? users.username
      : filters.sort === "creditBalance"
        ? sql<number>`COALESCE(${creditAccounts.balance} - ${creditAccounts.reservedBalance}, 0)`
        : users.createdAt;
  const sortExpression =
    filters.direction === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [
    summaryRows,
    activeRows,
    pastDueRows,
    withoutSubscriptionRows,
    countRows,
    planRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: sql<string>`COUNT(DISTINCT ${subscriptions.userId})::text` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db
      .select({ value: sql<string>`COUNT(DISTINCT ${subscriptions.userId})::text` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "past_due")),
    db
      .select({ value: count() })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(isNull(subscriptions.id)),
    db.select({ value: count() }).from(users).where(whereClause),
    db
      .select({ id: plans.id, name: plans.name })
      .from(plans)
      .orderBy(asc(plans.sortOrder), asc(plans.name)),
  ]);

  const totalItems = toCount(countRows[0]?.value);
  const pageCount = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const offset = (currentPage - 1) * filters.pageSize;

  const userRows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      storageUsedBytes: users.storageUsedBytes,
      storageQuotaBytes: users.storageQuotaBytes,
    })
    .from(users)
    .leftJoin(creditAccounts, eq(users.id, creditAccounts.userId))
    .where(whereClause)
    .orderBy(sortExpression, asc(users.id))
    .limit(filters.pageSize)
    .offset(offset);

  const userIds = userRows.map((user) => user.id);
  const [subscriptionRows, creditRows] =
    userIds.length === 0
      ? [[], []]
      : await Promise.all([
          db
            .select({
              id: subscriptions.id,
              userId: subscriptions.userId,
              status: subscriptions.status,
              currentPeriodEnd: subscriptions.currentPeriodEnd,
              createdAt: subscriptions.createdAt,
              planId: plans.id,
              planName: plans.name,
              planCode: plans.code,
            })
            .from(subscriptions)
            .innerJoin(plans, eq(subscriptions.planId, plans.id))
            .where(inArray(subscriptions.userId, userIds))
            .orderBy(
              asc(subscriptions.userId),
              desc(subscriptions.createdAt),
              desc(subscriptions.id),
            ),
          db
            .select({
              userId: creditAccounts.userId,
              balance: creditAccounts.balance,
              reservedBalance: creditAccounts.reservedBalance,
              status: creditAccounts.status,
            })
            .from(creditAccounts)
            .where(inArray(creditAccounts.userId, userIds)),
        ]);

  const latestSubscriptionByUser = new Map<
    number,
    (typeof subscriptionRows)[number]
  >();
  for (const subscription of subscriptionRows) {
    if (!latestSubscriptionByUser.has(subscription.userId)) {
      latestSubscriptionByUser.set(subscription.userId, subscription);
    }
  }

  const creditByUser = new Map(creditRows.map((credit) => [credit.userId, credit]));

  const items: UserRowData[] = userRows.map((user) => {
    const subscription = latestSubscriptionByUser.get(user.id);
    const credit = creditByUser.get(user.id);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status as SubscriptionStatus,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            plan: {
              id: subscription.planId,
              name: subscription.planName,
              code: subscription.planCode,
            },
          }
        : null,
      credit: credit
        ? {
            balance: credit.balance,
            reservedBalance: credit.reservedBalance,
            availableBalance: credit.balance - credit.reservedBalance,
            status: credit.status,
          }
        : null,
    };
  });

  return {
    filters: { ...filters, page: currentPage },
    summary: {
      totalUsers: toCount(summaryRows[0]?.value),
      activeSubscribers: toCount(activeRows[0]?.value),
      usersWithoutSubscriptions: toCount(withoutSubscriptionRows[0]?.value),
      pastDueSubscribers: toCount(pastDueRows[0]?.value),
    },
    items,
    plans: planRows,
    totalItems,
    pageCount,
  };
}
