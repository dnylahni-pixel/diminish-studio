export type FeatureKind = "boolean" | "metered" | "quota" | "package";
export type FeatureMetric = "unit" | "minute" | "megabyte" | "request" | "seat";
export type FeaturePriceModel = "flat" | "tiered" | "volume";
export type LimitPeriod = "none" | "day" | "week" | "month";
export type LimitBehavior = "block" | "allow_overage";
export type FeatureStatusFilter = "all" | "active" | "inactive";
export type FeaturePolicyFilter =
  | "all"
  | "open"
  | "restricted"
  | "metered"
  | "unconfigured";
export type FeatureSort = "name" | "updated" | "usage";
export type SortDirection = "asc" | "desc";

export interface FeaturesSearchParams {
  q?: string | string[];
  status?: string | string[];
  kind?: string | string[];
  policy?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
  page?: string | string[];
}

export interface FeaturesFilters {
  q: string;
  status: FeatureStatusFilter;
  kind: "all" | FeatureKind;
  policy: FeaturePolicyFilter;
  sort: FeatureSort;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export interface FeatureListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: FeatureKind;
  unitName: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedRelative: string;
  planCount: number;
  dependencyCount: number;
  limitPolicyCount: number;
  pricingRuleCount: number;
  usageQuantity30d: string;
  usageCredits30d: string;
}

export interface FeaturesListData {
  filters: FeaturesFilters;
  summary: {
    totalFeatures: number;
    activeFeatures: number;
    meteredFeatures: number;
    configuredPolicies: number;
    usageQuantity30d: string;
    usageCredits30d: string;
  };
  items: FeatureListItem[];
  totalItems: number;
  pageCount: number;
}

export interface FeatureOption {
  id: string;
  code: string;
  name: string;
  kind: FeatureKind;
  unitName: string | null;
  isActive: boolean;
}

export interface FeatureCreationData {
  features: FeatureOption[];
}

export interface FeatureEditData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: FeatureKind;
  unitName: string | null;
  isActive: boolean;
  defaultAccess: "allow" | "deny";
  dependencyIds: string[];
}

export interface FeatureDependencyDetail {
  id: string;
  featureId: string;
  featureCode: string;
  featureName: string;
  dependsOnFeatureId: string;
  dependsOnFeatureCode: string;
  dependsOnFeatureName: string;
  isHardDependency: boolean;
  conditionConfig: unknown;
}

export interface FeatureLimitDetail {
  id: string;
  limitValue: string | null;
  period: LimitPeriod;
  behavior: LimitBehavior;
  overageUnitPrice: string | null;
  metadata: unknown;
}

export interface FeaturePricingRuleDetail {
  id: string;
  metric: FeatureMetric;
  pricingModel: FeaturePriceModel;
  currency: string | null;
  unitPrice: string | null;
  creditCostPerUnit: string | null;
  minimumCharge: string | null;
  tiers: unknown;
  isActive: boolean;
  metadata: unknown;
}

export interface FeaturePlanPolicyDetail {
  planId: string;
  planCode: string;
  planName: string;
  planStatus: "draft" | "active" | "archived";
  planVersionId: string;
  versionNumber: number;
  versionStatus: "draft" | "published" | "retired";
  isIncluded: boolean | null;
  config: unknown;
  limits: FeatureLimitDetail[];
  pricingRules: FeaturePricingRuleDetail[];
}

export interface FeatureUsageDay {
  date: string;
  quantity: string;
  credits: string;
  money: string;
}

export interface FeatureDetailData {
  feature: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    kind: FeatureKind;
    unitName: string | null;
    isActive: boolean;
    metadata: unknown;
    createdAt: string;
    updatedAt: string;
  };
  dependencies: FeatureDependencyDetail[];
  requiredBy: FeatureDependencyDetail[];
  planPolicies: FeaturePlanPolicyDetail[];
  availableFeatures: FeatureOption[];
  availablePlanVersions: Array<{
    id: string;
    label: string;
    planId: string;
    planStatus: "draft" | "active" | "archived";
    versionNumber: number;
    versionStatus: "draft" | "published" | "retired";
  }>;
  usage: {
    quantity30d: string;
    credits30d: string;
    money30d: string;
    activeUsers30d: number;
    events30d: number;
    daily: FeatureUsageDay[];
  };
  catalogHealth: {
    hasCycle: boolean;
    cyclePaths: string[][];
    missingDependencies: number;
  };
}

export interface FeatureActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
}
