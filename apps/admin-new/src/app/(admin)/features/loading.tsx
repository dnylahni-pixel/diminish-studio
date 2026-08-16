import { Skeleton } from "@appica/ui-react/skeleton";

export default function FeaturesLoading() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="mt-6 flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full rounded-lg sm:w-80" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex flex-col">
            <div className="border-border-muted bg-background-subtle flex items-center gap-6 border-b px-4 py-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border-border-muted flex items-center gap-6 border-b px-4 py-4 last:border-b-0"
              >
                <Skeleton className="size-4 rounded" />
                <div className="flex w-40 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
