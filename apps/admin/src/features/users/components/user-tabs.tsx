"use client";

import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  Timeline,
} from "@/components/ui/data-display";
import { EmptyState } from "@/components/ui/feedback";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/selection";
import { Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import { formatDateTime, titleize } from "../formatters";
import { UserBillingTab } from "./user-billing-tab";
import { UserCreditsTab } from "./user-credits-tab";
import { UserOverviewTab } from "./user-overview-tab";
import { UserSubscriptionTab } from "./user-subscription-tab";

export function UserTabs({ detail }: { detail: UserDetail }) {
  return (
    <Tabs defaultValue="overview">
      <div className="overflow-x-auto">
        <TabsList className="min-w-max">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview">
        <UserOverviewTab detail={detail} />
      </TabsContent>
      <TabsContent value="subscription">
        <UserSubscriptionTab detail={detail} />
      </TabsContent>
      <TabsContent value="credits">
        <UserCreditsTab detail={detail} />
      </TabsContent>
      <TabsContent value="billing">
        <UserBillingTab detail={detail} />
      </TabsContent>
      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Unified activity feed</CardTitle>
              <Text size="xs" tone="muted" className="mt-1">
                Subscription, payment, credit, trial and coupon events ordered by
                their actual timestamps.
              </Text>
            </div>
            <Badge tone="neutral">{detail.activity.length}</Badge>
          </CardHeader>
          {detail.activity.length === 0 ? (
            <EmptyState title="No recent commercial activity" />
          ) : (
            <Timeline
              items={detail.activity.map((event) => ({
                title: titleize(event.title),
                description: event.description ?? titleize(event.kind),
                timestamp: formatDateTime(event.occurredAt),
                tone: event.tone,
              }))}
            />
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}
