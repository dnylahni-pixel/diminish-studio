import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DescriptionList, DescriptionItem } from "@/components/ui/description-list";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type {
  SubscriptionEvent,
  SubscriptionWithPlan,
} from "@/features/users/types";

interface Props {
  subscription: SubscriptionWithPlan | null;
  events: SubscriptionEvent[];
}

export function UserSubscriptionTab({ subscription, events }: Props) {
  if (!subscription) {
    return (
      <EmptyState
        title="No subscription"
        description="This user has never had a subscription."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList>
            <DescriptionItem label="Plan" value={subscription.plan?.name ?? "—"} />
            <DescriptionItem label="Status" value={subscription.status} />
            <DescriptionItem
              label="Started"
              value={
                <span title={formatDate(subscription.startedAt)}>
                  {formatRelativeTime(subscription.startedAt)}
                </span>
              }
            />
            <DescriptionItem
              label="Renews / Ends"
              value={
                subscription.cancelAt
                  ? `Cancels ${formatDate(subscription.cancelAt)}`
                  : subscription.currentPeriodEnd
                    ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                    : "—"
              }
            />
          </DescriptionList>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Period</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList>
              <DescriptionItem
                label="Start"
                value={
                  subscription.currentPeriodStart
                    ? formatDate(subscription.currentPeriodStart)
                    : "—"
                }
              />
              <DescriptionItem
                label="End"
                value={
                  subscription.currentPeriodEnd
                    ? formatDate(subscription.currentPeriodEnd)
                    : "—"
                }
              />
            </DescriptionList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList>
              <DescriptionItem
                label="Amount"
                value={
                  subscription.planPrice
                    ? formatCurrency(
                        subscription.planPrice.amount,
                        subscription.planPrice.currency,
                      )
                    : "—"
                }
              />
              <DescriptionItem
                label="Interval"
                value={
                  subscription.planPrice
                    ? `every ${subscription.planPrice.billingIntervalCount > 1 ? subscription.planPrice.billingIntervalCount + " " : ""}${subscription.planPrice.billingInterval}`
                    : "—"
                }
              />
            </DescriptionList>
          </CardContent>
        </Card>
      </div>

      {subscription.scheduledPlanChange && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Change</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {subscription.scheduledPlanChange}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Subscription Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState title="No recent events" />
          ) : (
            <Timeline>
              {events.map((event) => (
                <TimelineItem
                  key={event.id}
                  title={event.eventType}
                  description={event.description ?? undefined}
                  timestamp={
                    <span title={formatDate(event.createdAt)}>
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  }
                />
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
