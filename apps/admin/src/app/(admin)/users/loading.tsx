import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function UsersLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-4">
            <Skeleton className="size-9 rounded-[var(--radius-md)]" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-44" />
          </Card>
        ))}
      </div>
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <Skeleton className="h-8 flex-1 xl:max-w-md" />
          <div className="grid flex-1 grid-cols-2 gap-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[30rem] w-full rounded-[var(--radius-lg)]" />
      </Card>
    </div>
  );
}
