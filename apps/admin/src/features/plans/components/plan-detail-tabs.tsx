"use client";

import type { ReactNode } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/selection";

interface PlanDetailTab {
  value: string;
  label: string;
  content: ReactNode;
}

export function PlanDetailTabs({ tabs }: { tabs: PlanDetailTab[] }) {
  return (
    <Tabs defaultValue={tabs[0]?.value}>
      <div className="overflow-x-auto">
        <TabsList className="min-w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
