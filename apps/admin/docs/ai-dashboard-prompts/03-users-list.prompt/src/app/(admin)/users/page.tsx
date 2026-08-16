import { Suspense } from 'react';
import { getUsers, getUsersSummary } from '@/features/users/queries';
import { UsersTable } from '@/features/users/components/users-table';
import { UsersFilters } from '@/features/users/components/users-filters';
import { UsersSearchParams } from '@/features/users/types';

interface PageProps {
  searchParams: Promise<UsersSearchParams>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  // Await searchParams as required in Next.js 16 App Router
  const params = await searchParams;
  
  const [summary, { users, totalCount, page, pageSize }] = await Promise.all([
    getUsersSummary(),
    getUsers(params)
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your enterprise users and subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{summary.totalUsers.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{summary.activeSubscriptions.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Without Subscriptions</h3>
          <p className="text-3xl font-bold mt-2 text-gray-700">{summary.withoutSubscriptions.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <UsersFilters />
        
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Loading users...</div>}>
          <UsersTable 
            data={users} 
            totalCount={totalCount} 
            currentPage={page} 
            pageSize={pageSize} 
          />
        </Suspense>
      </div>
    </div>
  );
}
