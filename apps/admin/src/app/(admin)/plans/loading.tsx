"use client";

import { Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";

export default function PlansLoading() {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-5 w-[34rem] max-w-full" />
        </div>
        <Skeleton className="h-16 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="min-h-36 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="size-9" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-44 max-w-full" />
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="space-y-5 border-b border-neutral-100 p-5">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-10 w-80 max-w-full" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Skeleton className="h-8 xl:col-span-2" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-11 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
