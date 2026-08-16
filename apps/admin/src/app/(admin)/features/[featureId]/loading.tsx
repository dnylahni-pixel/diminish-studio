import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function FeatureDetailLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-5 w-52" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-96 w-full" />
      </Card>
    </div>
  );
}
