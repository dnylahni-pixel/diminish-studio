// =============================================================================
// Canonical intelligence dataset shape
// -----------------------------------------------------------------------------
// Every engine in src/features/** consumes this single, plain-TypeScript
// dataset shape. Both the demo fixtures (src/demo/fixtures) and the optional
// database adapter (src/db/loaders) produce exactly this shape, so the exact
// same calculator code runs in Demo Mode and Database Mode — the UI never
// contains a second, drifting copy of the business logic.
//
// Field names mirror src/db/schema.ts columns (camelCase) so mapping a
// Drizzle row into this shape is a 1:1 rename, not a re-derivation.
// =============================================================================

export type UUID = string;

export interface UserRow {
  id: UUID;
  email: string;
  fullName: string | null;
  status: "active" | "suspended" | "deleted";
  acquisitionSource: string | null;
  createdAt: Date;
}

export interface FeatureRow {
  id: UUID;
  key: string;
  name: string;
  category: string | null;
  isMetered: boolean;
  unit: string | null;
  status: "active" | "deprecated" | "archived";
}

export interface FeatureDependencyRow {
  id: UUID;
  featureId: UUID;
  dependsOnFeatureId: UUID;
  dependencyType: "requires" | "recommends";
}

export interface PlanRow {
  id: UUID;
  key: string;
  name: string;
  status: "draft" | "active" | "deprecated" | "archived";
  tier: number;
}

export interface PlanVersionRow {
  id: UUID;
  planId: UUID;
  version: number;
  status: "draft" | "published" | "retired";
  effectiveFrom: Date;
  effectiveTo: Date | null;
  billingIntervalUnit: "day" | "week" | "month" | "year";
  billingIntervalCount: number;
}

export interface PlanPriceRow {
  id: UUID;
  planVersionId: UUID;
  currency: string;
  unitAmount: bigint;
  billingScheme: "flat" | "per_seat";
}

export interface PlanFeatureRow {
  id: UUID;
  planVersionId: UUID;
  featureId: UUID;
  isEnabled: boolean;
}

export interface PlanLimitRow {
  id: UUID;
  planVersionId: UUID;
  featureId: UUID;
  limitType: "quota" | "rate" | "seat";
  limitValue: bigint | null;
  periodUnit: "day" | "month" | "billing_cycle" | null;
}

export interface PricingTier {
  upTo: string | null;
  unitAmount: string;
  flatAmount: string;
}

export interface FeaturePricingRuleRow {
  id: UUID;
  featureId: UUID;
  planVersionId: UUID | null;
  currency: string;
  pricingModel: "flat" | "tiered" | "volume";
  tiers: PricingTier[];
}

export interface PlanCreditPolicyRow {
  id: UUID;
  planVersionId: UUID;
  currency: string;
  grantAmount: bigint;
  rolloverEnabled: boolean;
  rolloverMaxAmount: bigint | null;
  expirationDays: number | null;
}

export interface PlanChangeRuleRow {
  id: UUID;
  fromPlanId: UUID | null;
  toPlanId: UUID;
  changeType: "upgrade" | "downgrade" | "lateral";
  prorationBehavior: "immediate" | "end_of_period" | "none";
  isAllowed: boolean;
}

export interface AddonRow {
  id: UUID;
  key: string;
  name: string;
  status: "active" | "archived";
}

export interface PlanAddonRow {
  id: UUID;
  planId: UUID;
  addonId: UUID;
  isRequired: boolean;
}

export interface AddonPriceRow {
  id: UUID;
  addonId: UUID;
  currency: string;
  unitAmount: bigint;
  billingIntervalUnit: "day" | "week" | "month" | "year";
}

export interface AddonFeatureRow {
  id: UUID;
  addonId: UUID;
  featureId: UUID;
}

export interface CouponRow {
  id: UUID;
  code: string;
  discountType: "percentage" | "fixed_amount";
  percentOff: string | null;
  amountOff: bigint | null;
  currency: string | null;
  duration: "once" | "repeating" | "forever";
  durationInMonths: number | null;
  maxRedemptions: number | null;
  redeemBy: Date | null;
  status: "active" | "expired" | "archived";
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export interface SubscriptionRow {
  id: UUID;
  userId: UUID;
  planVersionId: UUID;
  status: SubscriptionStatus;
  currency: string;
  startAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt: Date | null;
  canceledAt: Date | null;
  endedAt: Date | null;
}

export interface SubscriptionEventRow {
  id: UUID;
  subscriptionId: UUID;
  eventType: string;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
}

export interface SubscriptionPeriodRow {
  id: UUID;
  subscriptionId: UUID;
  planVersionId: UUID;
  periodStart: Date;
  periodEnd: Date;
  status: "upcoming" | "current" | "closed" | "voided";
}

export interface SubscriptionScheduleRow {
  id: UUID;
  subscriptionId: UUID;
  scheduleType: "plan_change" | "cancellation" | "pause" | "resume";
  targetPlanVersionId: UUID | null;
  effectiveAt: Date;
  status: "pending" | "executed" | "canceled" | "failed";
  executedAt: Date | null;
}

export interface TrialRow {
  id: UUID;
  subscriptionId: UUID;
  startAt: Date;
  endAt: Date;
  convertedAt: Date | null;
  status: "active" | "converted" | "expired" | "canceled";
}

export interface SubscriptionAddonRow {
  id: UUID;
  subscriptionId: UUID;
  addonId: UUID;
  quantity: number;
  status: "active" | "removed";
  startAt: Date;
  endAt: Date | null;
}

export interface SubscriptionDiscountRow {
  id: UUID;
  subscriptionId: UUID;
  couponId: UUID;
  appliedAt: Date;
  expiresAt: Date | null;
  status: "active" | "expired" | "removed";
}

export interface TransactionRow {
  id: UUID;
  subscriptionId: UUID | null;
  userId: UUID;
  invoiceId: UUID | null;
  type: "charge" | "refund" | "adjustment";
  status: "succeeded" | "failed" | "pending" | "reversed";
  amount: bigint;
  currency: string;
  idempotencyKey: string | null;
  failureReason: string | null;
  occurredAt: Date;
}

export interface PaymentMethodRow {
  id: UUID;
  userId: UUID;
  type: "card" | "bank_transfer" | "wallet";
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  status: "active" | "expired" | "removed";
}

export interface InvoiceRow {
  id: UUID;
  subscriptionId: UUID | null;
  userId: UUID;
  invoiceNumber: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  currency: string;
  subtotal: bigint;
  taxTotal: bigint;
  discountTotal: bigint;
  total: bigint;
  amountPaid: bigint;
  amountDue: bigint;
  issuedAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
}

export interface InvoiceItemRow {
  id: UUID;
  invoiceId: UUID;
  subscriptionPeriodId: UUID | null;
  description: string;
  itemType: "plan" | "addon" | "usage" | "credit_package" | "tax" | "discount" | "proration";
  quantity: string;
  unitAmount: bigint;
  amount: bigint;
  currency: string;
}

export interface TaxRateRow {
  id: UUID;
  code: string;
  percentage: string;
  isInclusive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  status: "active" | "archived";
}

export interface CouponRedemptionRow {
  id: UUID;
  couponId: UUID;
  subscriptionId: UUID | null;
  userId: UUID;
  redeemedAt: Date;
  amountDiscounted: bigint | null;
  currency: string | null;
}

export interface UsageDailyAggregateRow {
  id: UUID;
  subscriptionId: UUID;
  featureId: UUID;
  usageDate: string; // YYYY-MM-DD
  quantity: number;
  eventCount: number;
}

export interface CreditAccountRow {
  id: UUID;
  userId: UUID;
  currency: string;
  balance: bigint;
  reservedBalance: bigint;
  lifetimeGranted: bigint;
  lifetimeUsed: bigint;
  status: "active" | "frozen" | "closed";
}

export type CreditLedgerEntryType =
  | "grant"
  | "reserve"
  | "capture"
  | "release"
  | "expire"
  | "adjustment"
  | "refund";

export interface CreditLedgerRow {
  id: UUID;
  creditAccountId: UUID;
  entryType: CreditLedgerEntryType;
  amount: bigint;
  balanceAfter: bigint;
  referenceType: string | null;
  referenceId: UUID | null;
  idempotencyKey: string | null;
  createdAt: Date;
}

export interface CreditGrantRow {
  id: UUID;
  creditAccountId: UUID;
  source: "plan_policy" | "package_purchase" | "promo" | "manual" | "refund";
  amount: bigint;
  remainingAmount: bigint;
  currency: string;
  grantedAt: Date;
  expiresAt: Date | null;
  status: "active" | "exhausted" | "expired" | "revoked";
}

export interface CreditReservationRow {
  id: UUID;
  creditAccountId: UUID;
  usageEventId: UUID | null;
  amount: bigint;
  status: "held" | "captured" | "released" | "expired";
  idempotencyKey: string | null;
  heldAt: Date;
  resolvedAt: Date | null;
  expiresAt: Date | null;
}

export interface CreditPackageRow {
  id: UUID;
  key: string;
  name: string;
  creditAmount: bigint;
  status: "active" | "archived";
}

export interface CreditPackagePriceRow {
  id: UUID;
  creditPackageId: UUID;
  currency: string;
  unitAmount: bigint;
}

export interface CreditExpirationRow {
  id: UUID;
  creditGrantId: UUID;
  expiredAmount: bigint;
  expiredAt: Date;
}

export interface UsageEventRow {
  id: UUID;
  subscriptionId: UUID;
  featureId: UUID;
  userId: UUID | null;
  quantity: number;
  occurredAt: Date;
  recordedAt: Date;
  status: "recorded" | "reversed";
  idempotencyKey: string | null;
  creditReservationId: UUID | null;
}

export interface IntelligenceDataset {
  users: UserRow[];
  features: FeatureRow[];
  featureDependencies: FeatureDependencyRow[];
  plans: PlanRow[];
  planVersions: PlanVersionRow[];
  planPrices: PlanPriceRow[];
  planFeatures: PlanFeatureRow[];
  planLimits: PlanLimitRow[];
  featurePricingRules: FeaturePricingRuleRow[];
  planCreditPolicies: PlanCreditPolicyRow[];
  planChangeRules: PlanChangeRuleRow[];
  addons: AddonRow[];
  planAddons: PlanAddonRow[];
  addonPrices: AddonPriceRow[];
  addonFeatures: AddonFeatureRow[];
  coupons: CouponRow[];
  subscriptions: SubscriptionRow[];
  subscriptionEvents: SubscriptionEventRow[];
  subscriptionPeriods: SubscriptionPeriodRow[];
  subscriptionSchedules: SubscriptionScheduleRow[];
  trials: TrialRow[];
  subscriptionAddons: SubscriptionAddonRow[];
  subscriptionDiscounts: SubscriptionDiscountRow[];
  transactions: TransactionRow[];
  paymentMethods: PaymentMethodRow[];
  invoices: InvoiceRow[];
  invoiceItems: InvoiceItemRow[];
  taxRates: TaxRateRow[];
  couponRedemptions: CouponRedemptionRow[];
  usageDailyAggregates: UsageDailyAggregateRow[];
  creditAccounts: CreditAccountRow[];
  creditLedger: CreditLedgerRow[];
  creditGrants: CreditGrantRow[];
  creditReservations: CreditReservationRow[];
  creditPackages: CreditPackageRow[];
  creditPackagePrices: CreditPackagePriceRow[];
  creditExpirations: CreditExpirationRow[];
  usageEvents: UsageEventRow[];
}

export interface DatasetSourceMeta {
  mode: "demo" | "database";
  label: string;
  generatedAt: string;
}

export interface LoadedDataset {
  dataset: IntelligenceDataset;
  source: DatasetSourceMeta;
}
