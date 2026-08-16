import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function FeaturesLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-[32rem] max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-[32rem] w-full" />
      </Card>
    </div>
  );
}
