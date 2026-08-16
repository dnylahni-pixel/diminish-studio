export interface UsersSearchParams {
  q?: string;
  subscription?: string;
  plan?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface UserRowData {
  id: string | number;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  storageUsedBytes: bigint | number;
  storageQuotaBytes: bigint | number;
  subscription: {
    id: string | number;
    status: string;
    currentPeriodEnd: Date | null;
    plan: {
      name: string;
    } | null;
  } | null;
  credit: {
    balance: number | bigint;
    reservedBalance: number | bigint;
  } | null;
}

export interface UsersSummary {
  totalUsers: number;
  activeSubscriptions: number;
  withoutSubscriptions: number;
}
