export type SubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export type UsersSubscriptionFilter = "all" | "none" | SubscriptionStatus;
export type UsersSort = "createdAt" | "username" | "creditBalance";
export type SortDirection = "asc" | "desc";

export interface UsersSearchParams {
  q?: string | string[];
  subscription?: string | string[];
  plan?: string | string[];
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
}

export interface UsersFilters {
  q: string;
  subscription: UsersSubscriptionFilter;
  plan: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  sort: UsersSort;
  direction: SortDirection;
}

export interface UserRowData {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
    plan: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  credit: {
    balance: number;
    reservedBalance: number;
    availableBalance: number;
    status: "active" | "frozen" | "closed";
  } | null;
}

export interface UsersSummary {
  totalUsers: number;
  activeSubscribers: number;
  usersWithoutSubscriptions: number;
  pastDueSubscribers: number;
}

export interface UsersListData {
  filters: UsersFilters;
  summary: UsersSummary;
  items: UserRowData[];
  plans: Array<{ id: string; name: string }>;
  totalItems: number;
  pageCount: number;
}
