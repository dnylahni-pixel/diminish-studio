import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function NewPlanLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-5 w-[38rem] max-w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </Card>
        <Card className="h-96">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    </div>
  );
}
