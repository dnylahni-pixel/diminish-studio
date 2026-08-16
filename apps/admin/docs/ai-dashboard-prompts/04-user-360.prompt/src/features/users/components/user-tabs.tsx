"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface Props {
  overview: ReactNode;
  subscription: ReactNode;
  credits: ReactNode;
  billing: ReactNode;
  activity: ReactNode;
}

export function UserTabs({
  overview,
  subscription,
  credits,
  billing,
  activity,
}: Props) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="subscription">{subscription}</TabsContent>
      <TabsContent value="credits">{credits}</TabsContent>
      <TabsContent value="billing">{billing}</TabsContent>
      <TabsContent value="activity">{activity}</TabsContent>
    </Tabs>
  );
}
