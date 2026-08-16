export default function UsersLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
      
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg border border-gray-200"></div>
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex justify-between gap-4 mb-6">
        <div className="h-10 bg-gray-100 rounded w-full max-w-sm"></div>
        <div className="hidden md:flex gap-2">
          <div className="h-10 bg-gray-100 rounded w-32"></div>
          <div className="h-10 bg-gray-100 rounded w-32"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="h-96 bg-gray-50 rounded-lg border border-gray-200"></div>
    </div>
  );
}
