"use client";

import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function PlanDetailLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <Skeleton className="h-5 w-64 max-w-full" />

      <div className="flex flex-col justify-between gap-5 xl:flex-row">
        <div className="space-y-3">
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-5 w-[38rem] max-w-full" />
        </div>
        <Skeleton className="h-16 w-72 max-w-full" />
      </div>

      <Skeleton className="h-20 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="min-h-36 space-y-4">
            <Skeleton className="size-9" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </Card>
        ))}
      </div>

      <Skeleton className="h-11 w-full" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="grid grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32 max-w-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}
