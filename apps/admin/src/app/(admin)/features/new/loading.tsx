import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function NewFeatureLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <Skeleton className="h-8 w-80 max-w-full" />
      <Card>
        <Skeleton className="h-[42rem] w-full" />
      </Card>
    </div>
  );
}
