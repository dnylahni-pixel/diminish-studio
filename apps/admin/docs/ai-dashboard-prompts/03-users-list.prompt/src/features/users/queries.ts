import { db } from '@/db';
import { users, subscriptions, plans, creditAccounts } from '@/db/schema';
import { eq, and, or, ilike, gte, lte, desc, asc, sql, isNull } from 'drizzle-orm';
import { UsersSearchParams, UserRowData, UsersSummary } from './types';

const ALLOWED_SORTS = ['createdAt', 'username', 'creditBalance'];

export async function getUsers(params: UsersSearchParams) {
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const pageSize = [25, 50, 100].includes(parseInt(params.pageSize || '25', 10)) 
    ? parseInt(params.pageSize || '25', 10) 
    : 25;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (params.q) {
    const isNumeric = /^\d+$/.test(params.q);
    conditions.push(
      or(
        ilike(users.email, `%${params.q}%`),
        ilike(users.username, `%${params.q}%`),
        isNumeric ? eq(users.id, parseInt(params.q, 10)) : undefined
      )
    );
  }

  if (params.subscription) {
    if (params.subscription === 'none') {
      conditions.push(isNull(subscriptions.id));
    } else {
      conditions.push(eq(subscriptions.status, params.subscription));
    }
  }

  if (params.plan) {
    conditions.push(eq(plans.name, params.plan));
  }

  if (params.from) {
    conditions.push(gte(users.createdAt, new Date(params.from)));
  }
  if (params.to) {
    conditions.push(lte(users.createdAt, new Date(params.to)));
  }

  const whereClause = conditions.filter(Boolean).length > 0 ? and(...conditions) : undefined;

  // Sorting
  let orderBy = desc(users.createdAt);
  const sortCol = ALLOWED_SORTS.includes(params.sort || '') ? params.sort : 'createdAt';
  const sortDir = params.direction === 'asc' ? asc : desc;

  if (sortCol === 'username') orderBy = sortDir(users.username);
  if (sortCol === 'createdAt') orderBy = sortDir(users.createdAt);
  if (sortCol === 'creditBalance') orderBy = sortDir(sql`${creditAccounts.balance} - ${creditAccounts.reservedBalance}`);

  const dataQuery = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      storageUsedBytes: users.storageUsedBytes,
      storageQuotaBytes: users.storageQuotaBytes,
      subscriptionId: subscriptions.id,
      subscriptionStatus: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      planName: plans.name,
      creditBalance: creditAccounts.balance,
      creditReserved: creditAccounts.reservedBalance,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(creditAccounts, eq(users.id, creditAccounts.userId))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(whereClause);

  const [rawUsers, [{ count }]] = await Promise.all([dataQuery, countQuery]);

  const mappedUsers: UserRowData[] = rawUsers.map(row => ({
    id: row.id.toString(),
    username: row.username,
    email: row.email,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
    storageUsedBytes: row.storageUsedBytes,
    storageQuotaBytes: row.storageQuotaBytes,
    subscription: row.subscriptionId ? {
      id: row.subscriptionId.toString(),
      status: row.subscriptionStatus!,
      currentPeriodEnd: row.currentPeriodEnd,
      plan: row.planName ? { name: row.planName } : null,
    } : null,
    credit: row.creditBalance !== null ? {
      balance: row.creditBalance,
      reservedBalance: row.creditReserved ?? 0,
    } : null,
  }));

  return { users: mappedUsers, totalCount: Number(count), page, pageSize };
}

export async function getUsersSummary(): Promise<UsersSummary> {
  const [totalRes, activeSubRes, noSubRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(users)
      .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(subscriptions.status, 'active')),
    db.select({ count: sql<number>`count(*)` }).from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(isNull(subscriptions.id)),
  ]);

  return {
    totalUsers: Number(totalRes[0].count),
    activeSubscriptions: Number(activeSubRes[0].count),
    withoutSubscriptions: Number(noSubRes[0].count),
  };
}
