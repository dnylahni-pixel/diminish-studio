export type PlanStatus = "draft" | "active" | "archived";
export type PlanVersionStatus = "draft" | "published" | "retired";
export type PriceType = "recurring" | "one_time";
export type BillingInterval = "day" | "week" | "month" | "year";
export type FeatureKind = "boolean" | "metered" | "quota" | "package";
export type LimitPeriod = "none" | "day" | "week" | "month";
export type LimitBehavior = "block" | "allow_overage";
export type FeaturePriceMetric =
  | "unit"
  | "minute"
  | "megabyte"
  | "request"
  | "seat";
export type FeaturePriceModel = "flat" | "tiered" | "volume";
export type CreditPolicyReset = "none" | "daily" | "weekly" | "monthly";
export type CreditWindowPeriod =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year"
  | "total";
export type AddonScope = "subscription" | "account";
export type AccessMode = "inherit" | "allow" | "deny";
export type LimitMode = "unlimited" | "custom";
export type PricingMode = "free" | "custom";
export type PlanCreationMode = "scratch" | "clone";

/**
 * One credit grant window for a plan version. `period: "total"` is the
 * plan-wide overall allowance; smaller windows (e.g. weekly, 5 hours) add
 * tighter per-period limits on top of it.
 */
export interface CreditWindow {
  id: string;
  period: CreditWindowPeriod;
  periodCount: number;
  creditAmount: number;
}

export interface PlanWorkspaceVersion {
  id: string;
  planId: string;
  versionNumber: number;
  status: PlanVersionStatus;
  title: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  changeNotes: string | null;
  allowedUploadMimeTypes: string[];
  createdAt: string;
}

export interface PlanWorkspaceItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  isPublic: boolean;
  sortOrder: number;
  activeSubscribers: number;
  versions: PlanWorkspaceVersion[];
  defaultPrice: PlanPriceWorkspaceItem | null;
  creditPolicy: PlanCreditPolicyWorkspaceItem | null;
  addons: AddonWorkspaceItem[];
}

export interface FeatureWorkspaceItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: FeatureKind;
  unitName: string | null;
  isActive: boolean;
}

export interface PlanPriceWorkspaceItem {
  id: string;
  planVersionId: string;
  priceType: PriceType;
  currency: string;
  /** Amount in minor units (e.g. cents) as a decimal string. */
  amount: string;
  billingInterval: BillingInterval | null;
  billingIntervalCount: number | null;
  trialDays: number | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface PlanCreditPolicyWorkspaceItem {
  planVersionId: string;
  monthlyCreditGrant: string;
  rolloverEnabled: boolean;
  rolloverCap: string | null;
  resetPolicy: CreditPolicyReset;
  grantExpiryDays: number | null;
  negativeBalanceAllowed: boolean;
  maxNegativeBalance: string | null;
  windows: CreditWindow[];
}

export interface AddonWorkspaceItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: AddonScope;
  isActive: boolean;
}

/**
 * The effective policy of one feature on one plan version. `null` means the
 * row does not exist yet, so the runtime falls back to the feature default /
 * system default (inherit / unlimited / free).
 */
export interface FeaturePolicyItem {
  planVersionId: string;
  featureId: string;
  isIncluded: boolean | null;
  limitValue: string | null;
  period: LimitPeriod | null;
  behavior: LimitBehavior | null;
  overageUnitPrice: string | null;
  metric: FeaturePriceMetric | null;
  pricingModel: FeaturePriceModel | null;
  currency: string | null;
  unitPrice: string | null;
  creditCostPerUnit: string | null;
  minimumCharge: string | null;
}

export interface PlansWorkspaceSummary {
  totalPlans: number;
  activePlans: number;
  publishedVersions: number;
  activeSubscribers: number;
}

export interface PlansWorkspaceData {
  summary: PlansWorkspaceSummary;
  plans: PlanWorkspaceItem[];
  features: FeatureWorkspaceItem[];
  addons: AddonWorkspaceItem[];
  policies: FeaturePolicyItem[];
}

export interface SavePlanFeaturePolicyInput {
  planVersionId: string;
  featureId: string;
  accessMode: AccessMode;
  limitMode: LimitMode;
  limitValue: string;
  period: LimitPeriod;
  behavior: LimitBehavior;
  overageUnitPrice: string;
  pricingMode: PricingMode;
  metric: FeaturePriceMetric;
  pricingModel: FeaturePriceModel;
  currency: string;
  unitPrice: string;
  creditCostPerUnit: string;
  minimumCharge: string;
  locale: "fa" | "en";
}

export interface PlanPolicyActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  /** When a save branches into a new draft version, this is the new version. */
  versionId?: string;
  versionNumber?: number;
}

export interface CreateDraftVersionInput {
  planId: string;
  sourceVersionId: string;
  locale: "fa" | "en";
}

export interface PublishVersionInput {
  planId: string;
  versionId: string;
  locale: "fa" | "en";
}

export interface CreatePlanInput {
  creationMode: PlanCreationMode;
  sourcePlanId: string;
  name: string;
  code: string;
  description: string;
  status: "draft" | "active";
  isPublic: boolean;
  sortOrder: number;
  versionTitle: string;
  changeNotes: string;
  effectiveFrom: string;
  priceType: PriceType;
  amountMajor: string;
  currency: string;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  trialDays: number;
  creditWindows: CreditWindow[];
  rolloverEnabled: boolean;
  rolloverCap: number;
  negativeBalanceAllowed: boolean;
  maxNegativeBalance: number;
  featureIds: string[];
  addonIds: string[];
  allowedUploadMimeTypes: string[];
  locale: "fa" | "en";
}

export interface UpdatePlanInput {
  planId: string;
  name: string;
  description: string;
  isPublic: boolean;
  status: PlanStatus;
  locale: "fa" | "en";
}

export interface PlanCrudActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  planId?: string;
}
