export type PlanStatus = "draft" | "active" | "archived";
export type PlanVersionStatus = "draft" | "published" | "retired";
export type PriceType = "recurring" | "one_time";
export type BillingInterval = "day" | "week" | "month" | "year";
export type FeatureKind = "boolean" | "metered" | "quota" | "package";
export type LimitPeriod = "none" | "day" | "week" | "month";
export type LimitBehavior = "block" | "allow_overage";
export type FeaturePriceMetric = "unit" | "minute" | "megabyte" | "request" | "seat";
export type FeaturePriceModel = "flat" | "tiered" | "volume";
export type CreditPolicyReset = "none" | "daily" | "weekly" | "monthly";
export type ProrationMode = "none" | "immediate" | "next_cycle";
export type AddonScope = "subscription" | "account";
export type SubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export type PlanListStatusFilter = "all" | PlanStatus;
export type PlanVisibilityFilter = "all" | "public" | "private";
export type PlanSort = "order" | "name" | "updated";
export type SortDirection = "asc" | "desc";
export type PlanCreationMode = "scratch" | "clone";

export interface PlansSearchParams {
  q?: string | string[];
  status?: string | string[];
  visibility?: string | string[];
  currency?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
  page?: string | string[];
}

export interface PlansFilters {
  q: string;
  status: PlanListStatusFilter;
  visibility: PlanVisibilityFilter;
  currency: string;
  sort: PlanSort;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export interface MoneyAmount {
  amount: string;
  currency: string;
}

export interface PlanPriceSummary extends MoneyAmount {
  id: string;
  priceType: PriceType;
  billingInterval: BillingInterval | null;
  billingIntervalCount: number | null;
  trialDays: number | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface RevenueByCurrency extends MoneyAmount {
  activeSubscriptions: number;
}

export interface PlansSummary {
  totalPlans: number;
  activePublicPlans: number;
  draftPlans: number;
  activeSubscribers: number;
}

export interface PlanListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  isPublic: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedRelative: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    status: PlanVersionStatus;
    effectiveFrom: string | null;
  } | null;
  prices: PlanPriceSummary[];
  defaultPrice: PlanPriceSummary | null;
  hasMultipleCurrencies: boolean;
  activeSubscribers: number;
  recurringRevenue: RevenueByCurrency[];
}

export interface PlansListData {
  filters: PlansFilters;
  summary: PlansSummary;
  items: PlanListItem[];
  currencies: string[];
  totalItems: number;
  pageCount: number;
}

export interface PlanVersionDetail {
  id: string;
  versionNumber: number;
  status: PlanVersionStatus;
  title: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  changeNotes: string | null;
  createdAt: string;
}

export interface PlanPriceDetail extends PlanPriceSummary {
  planVersionId: string;
}

export interface PlanLimitDetail {
  id: string;
  planVersionId: string;
  featureId: string;
  limitValue: string | null;
  period: LimitPeriod;
  behavior: LimitBehavior;
  overageUnitPrice: string | null;
}

export interface FeaturePricingRuleDetail {
  id: string;
  planVersionId: string;
  featureId: string;
  metric: FeaturePriceMetric;
  pricingModel: FeaturePriceModel;
  currency: string | null;
  unitPrice: string | null;
  tiers: unknown;
  creditCostPerUnit: string | null;
  minimumCharge: string | null;
  isActive: boolean;
}

export interface PlanFeatureDetail {
  id: string;
  planVersionId: string;
  featureId: string;
  code: string;
  name: string;
  description: string | null;
  kind: FeatureKind;
  unitName: string | null;
  isIncluded: boolean;
  config: unknown;
  limits: PlanLimitDetail[];
  pricingRules: FeaturePricingRuleDetail[];
}

export interface PlanCreditPolicyDetail {
  id: string;
  planVersionId: string;
  monthlyCreditGrant: string;
  rolloverEnabled: boolean;
  rolloverCap: string | null;
  resetPolicy: CreditPolicyReset;
  grantExpiryDays: number | null;
  negativeBalanceAllowed: boolean;
  maxNegativeBalance: string | null;
}

export interface PlanAddonPriceDetail extends MoneyAmount {
  id: string;
  priceType: PriceType;
  billingInterval: BillingInterval | null;
  billingIntervalCount: number | null;
  isActive: boolean;
}

export interface PlanAddonDetail {
  id: string;
  addonId: string;
  code: string;
  name: string;
  description: string | null;
  scope: AddonScope;
  isActive: boolean;
  isDefault: boolean;
  isRequired: boolean;
  prices: PlanAddonPriceDetail[];
}

export interface PlanChangeRuleDetail {
  id: string;
  direction: "outbound" | "inbound";
  relatedPlanId: string;
  relatedPlanCode: string;
  relatedPlanName: string;
  relatedPlanStatus: PlanStatus;
  prorationMode: ProrationMode;
  allowChange: boolean;
  carryUnusedCredits: boolean;
  changeFeeAmount: string | null;
  currency: string | null;
  ruleConfig: unknown;
}

export interface SubscriptionBreakdownItem {
  planVersionId: string;
  versionNumber: number | null;
  status: SubscriptionStatus;
  count: number;
}

export interface PlanDetailData {
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: PlanStatus;
    isPublic: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  };
  versions: PlanVersionDetail[];
  currentVersion: PlanVersionDetail | null;
  configurationVersion: PlanVersionDetail | null;
  prices: PlanPriceDetail[];
  features: PlanFeatureDetail[];
  creditPolicies: PlanCreditPolicyDetail[];
  addons: PlanAddonDetail[];
  changeRules: PlanChangeRuleDetail[];
  subscriptionBreakdown: SubscriptionBreakdownItem[];
  activeSubscribers: number;
  defaultPrice: PlanPriceDetail | null;
  monthlyCreditGrant: string | null;
}

export interface PlanCreationFeatureOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: FeatureKind;
  unitName: string | null;
}

export interface PlanCreationAddonOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: AddonScope;
}

export interface PlanCreationSourceOption {
  id: string;
  code: string;
  name: string;
  status: PlanStatus;
  versionNumber: number | null;
}

export interface PlanCreationData {
  features: PlanCreationFeatureOption[];
  addons: PlanCreationAddonOption[];
  sourcePlans: PlanCreationSourceOption[];
  suggestedSortOrder: number;
}

export interface CreatePlanActionState {
  status: "idle" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
}
