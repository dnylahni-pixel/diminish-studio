import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function UserDetailLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <Skeleton className="h-4 w-48" />
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="size-9 rounded-[var(--radius-md)]" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-36" />
          </Card>
        ))}
      </div>
      <Card padding="lg" className="space-y-5">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </Card>
    </div>
  );
}
