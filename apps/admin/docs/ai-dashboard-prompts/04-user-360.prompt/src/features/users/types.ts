import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  subscriptions,
  plans,
  planVersions,
  planPrices,
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

export type User = InferSelectModel<typeof users>;

export type SubscriptionWithPlan = InferSelectModel<typeof subscriptions> & {
  plan: InferSelectModel<typeof plans> | null;
  planVersion: InferSelectModel<typeof planVersions> | null;
  planPrice: InferSelectModel<typeof planPrices> | null;
};

export type SubscriptionEvent = InferSelectModel<typeof subscriptionEvents>;

export type CreditAccount = InferSelectModel<typeof creditAccounts>;
export type CreditLedgerEntry = InferSelectModel<typeof creditLedger>;
export type CreditGrant = InferSelectModel<typeof creditGrants>;
export type CreditReservation = InferSelectModel<typeof creditReservations>;

export type Invoice = InferSelectModel<typeof invoices>;
export type Transaction = InferSelectModel<typeof transactions>;
export type Trial = InferSelectModel<typeof trials>;
export type CouponRedemption = InferSelectModel<typeof couponRedemptions>;

/**
 * Aggregated detail payload for the /users/[userId] route.
 * Every nested collection is already scoped to this user (fetched with
 * a WHERE userId = ? clause), never filtered client-side.
 */
export interface UserDetail {
  user: User;
  subscription: SubscriptionWithPlan | null;
  subscriptionEvents: SubscriptionEvent[];
  creditAccount: CreditAccount | null;
  creditLedger: CreditLedgerEntry[];
  creditGrants: CreditGrant[];
  creditReservations: CreditReservation[];
  invoices: Invoice[];
  transactions: Transaction[];
  trials: Trial[];
  couponRedemptions: CouponRedemption[];
}

export interface ActivityEvent {
  id: string;
  kind: "subscription" | "credit" | "trial" | "coupon";
  title: string;
  description?: string | null;
  occurredAt: Date;
}
