import { Skeleton } from "@appica/ui-react/skeleton";

export default function LabLoading() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-6 w-44 rounded-full" />
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-background p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex flex-col">
            <div className="border-border-muted bg-background-subtle flex items-center gap-6 border-b px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border-border-muted flex items-center gap-6 border-b px-4 py-4 last:border-b-0"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
