export interface OverviewFilterParams {
  from?: string;
  to?: string;
  currency?: string;
}

export interface OverviewFilters {
  from: string;
  to: string;
  currency: string;
}

export interface OverviewKpis {
  totalRevenue: number;
  mrr: number;
  activeSubscriptionsCount: number;
  availableCredits: number;
  totalUsersCount: number;
  newUsersCount: number;
  atRiskCount: number;
  creditUtilizationRate: number;
  trialConversionRate: number;
}

export interface RevenueTrendPoint {
  date: string;
  amount: number;
}

export interface CreditTrendPoint {
  date: string;
  credits: number;
}

export interface SubscriptionHealthDistribution {
  active: number;
  trialing: number;
  pastDue: number;
  paused: number;
  canceled: number;
  incomplete: number;
  expired: number;
}

export interface AttentionItem {
  id: string;
  type: "past_due_subscription" | "overdue_invoice" | "trial_ending_soon";
  title: string;
  subtitle: string;
  severity: "danger" | "warning" | "info";
  date: string;
  amount?: number;
  currency?: string;
}

export interface PlanPerformanceItem {
  id: string;
  name: string;
  activeSubscribers: number;
  mrr: number;
  share: number;
}

export interface OverviewDashboardData {
  filters: OverviewFilters;
  kpis: OverviewKpis;
  revenueTrend: RevenueTrendPoint[];
  creditTrend: CreditTrendPoint[];
  subscriptionHealth: SubscriptionHealthDistribution;
  attentionRequired: AttentionItem[];
  planPerformance: PlanPerformanceItem[];
}
