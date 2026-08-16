import type { UserIntelligenceProfile } from "./intelligence/account/user-360";
import type { EntitlementSummary } from "./intelligence/entitlements";

export interface UserDetail {
  user: {
    id: number;
    clerkId: string | null;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    preferredInstrument: string | null;
    createdAt: string;
    storageUsedBytes: number;
    storageQuotaBytes: number;
  };
  subscription: {
    id: string;
    status:
      | "incomplete"
      | "trialing"
      | "active"
      | "past_due"
      | "paused"
      | "canceled"
      | "expired";
    currency: string | null;
    startedAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    endedAt: string | null;
    plan: {
      id: string;
      code: string;
      name: string;
    };
    planVersion: {
      id: string;
      versionNumber: number;
      title: string | null;
      status: "draft" | "published" | "retired";
    };
    planPrice: {
      id: string;
      amount: number;
      currency: string;
      priceType: "recurring" | "one_time";
      billingInterval: "day" | "week" | "month" | "year" | null;
      billingIntervalCount: number | null;
    } | null;
  } | null;
  subscriptionEvents: Array<{
    id: string;
    eventType: string;
    eventTime: string;
    actorUserId: number | null;
    payload: unknown;
  }>;
  creditAccount: {
    id: string;
    status: "active" | "frozen" | "closed";
    currencyContext: string | null;
    balance: number;
    reservedBalance: number;
    lifetimeGranted: number;
    lifetimeUsed: number;
    updatedAt: string;
  } | null;
  creditLedger: Array<{
    id: string;
    entryType: string;
    amount: number;
    balanceAfter: number | null;
    description: string | null;
    createdAt: string;
  }>;
  creditGrants: Array<{
    id: string;
    source: string;
    amountGranted: number;
    amountRemaining: number;
    grantedAt: string;
    expiresAt: string | null;
    reference: string | null;
  }>;
  creditReservations: Array<{
    id: string;
    reservedAmount: number;
    capturedAmount: number;
    releasedAmount: number;
    status: string;
    expiresAt: string | null;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    currency: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    issuedAt: string | null;
    dueAt: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    description: string | null;
    processedAt: string | null;
    createdAt: string;
  }>;
  trials: Array<{
    id: string;
    status: string;
    startsAt: string;
    endsAt: string;
    source: string | null;
    createdAt: string;
  }>;
  couponRedemptions: Array<{
    id: string;
    status: string;
    discountType: string;
    discountAmount: number | null;
    discountPercentBps: number | null;
    creditAmount: number | null;
    currency: string | null;
    redeemedAt: string;
    couponLabel: string;
  }>;
  paymentMethods: Array<{
    id: string;
    provider: string;
    type: string;
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
    isDefault: boolean;
    status: string;
  }>;
  commerce: {
    lifetimeInvoiced: Array<{ currency: string; amount: number }>;
    successfulPayments: Array<{ currency: string; amount: number }>;
    openInvoiceCount: number;
    overdueInvoiceCount: number;
    paymentMethodOnFile: boolean;
  };
  entitlements: EntitlementSummary;
  intelligence: UserIntelligenceProfile;
  activity: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  kind: "subscription" | "credit" | "trial" | "coupon" | "payment";
  title: string;
  description: string | null;
  occurredAt: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}
