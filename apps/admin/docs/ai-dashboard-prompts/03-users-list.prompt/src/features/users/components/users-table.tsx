'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { UserRowData } from '../types';

interface UsersTableProps {
  data: UserRowData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function UsersTable({ data, totalCount, currentPage, pageSize }: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (data.length === 0) {
    return <EmptyState title="No users found" description="Adjust your filters or search query." />;
  }

  const formatBytes = (bytes: number | bigint) => {
    const b = Number(bytes);
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get('sort');
    const currentDir = params.get('direction');
    
    if (currentSort === column) {
      params.set('direction', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', column);
      params.set('direction', 'desc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns = [
    {
      header: 'User',
      accessorKey: 'user',
      cell: (row: UserRowData) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatarUrl || undefined} fallback={row.username.substring(0, 2).toUpperCase()} />
          <div className="flex flex-col">
            <span className="font-medium">{row.username}</span>
            <span className="text-sm text-gray-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      sortable: true,
      onSort: () => handleSort('createdAt'),
      cell: (row: UserRowData) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Plan',
      accessorKey: 'plan',
      cell: (row: UserRowData) => row.subscription?.plan?.name || 'No plan',
    },
    {
      header: 'Subscription',
      accessorKey: 'subscription',
      cell: (row: UserRowData) => (
        row.subscription ? (
          <Badge variant={row.subscription.status === 'active' ? 'success' : 'secondary'}>
            {row.subscription.status}
          </Badge>
        ) : <span className="text-gray-400">None</span>
      ),
    },
    {
      header: 'Available Credit',
      accessorKey: 'creditBalance',
      sortable: true,
      onSort: () => handleSort('creditBalance'),
      cell: (row: UserRowData) => {
        if (!row.credit) return '0';
        const available = Number(row.credit.balance) - Number(row.credit.reservedBalance);
        return available.toLocaleString();
      },
    },
    {
      header: 'Storage',
      accessorKey: 'storage',
      cell: (row: UserRowData) => {
        const used = Number(row.storageUsedBytes);
        const quota = Number(row.storageQuotaBytes);
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        
        return (
          <div className="flex flex-col w-24">
            <span className="text-xs text-gray-500 mb-1">{formatBytes(used)} / {formatBytes(quota)}</span>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Renewal',
      accessorKey: 'renewal',
      cell: (row: UserRowData) => row.subscription?.currentPeriodEnd ? new Date(row.subscription.currentPeriodEnd).toLocaleDateString() : '—',
    },
    {
      header: '',
      accessorKey: 'actions',
      cell: (row: UserRowData) => (
        <DropdownMenu
          items={[
            { label: 'View user', onClick: () => router.push(`/users/${row.id}`) }
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable 
        columns={columns} 
        data={data} 
        onRowClick={(row) => router.push(`/users/${row.id}`)}
      />
      <Pagination 
        totalItems={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('page', page.toString());
          router.push(`${pathname}?${params.toString()}`);
        }}
        onPageSizeChange={(size) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('pageSize', size.toString());
          params.set('page', '1');
          router.push(`${pathname}?${params.toString()}`);
        }}
        pageSizeOptions={[25, 50, 100]}
      />
    </div>
  );
}
