import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  DescriptionList,
  Timeline,
} from "@/components/ui/data-display";
import { EmptyState } from "@/components/ui/feedback";
import { Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  subscriptionTone,
  titleize,
} from "../formatters";

export function UserSubscriptionTab({ detail }: { detail: UserDetail }) {
  const { subscription, subscriptionEvents, trials } = detail;

  if (!subscription) {
    return (
      <EmptyState
        title="No subscription history"
        description="This account has not been connected to a commercial plan."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Subscription lifecycle</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Latest subscription record and billing period.
            </Text>
          </div>
          <Badge tone={subscriptionTone(subscription.status)}>
            {titleize(subscription.status)}
          </Badge>
        </CardHeader>
        <DescriptionList
          items={[
            { term: "Plan", description: subscription.plan.name },
            {
              term: "Version",
              description: `v${subscription.planVersion.versionNumber} · ${subscription.planVersion.title ?? titleize(subscription.planVersion.status)}`,
            },
            {
              term: "Started",
              description: formatDate(subscription.startedAt),
            },
            {
              term: "Current period",
              description: `${formatDate(subscription.currentPeriodStart)} → ${formatDate(subscription.currentPeriodEnd)}`,
            },
            {
              term: "Renewal behavior",
              description: subscription.cancelAtPeriodEnd
                ? "Cancel at period end"
                : "Continue automatically",
            },
            {
              term: "Price",
              description: subscription.planPrice
                ? `${formatMoney(subscription.planPrice.amount, subscription.planPrice.currency)} · ${subscription.planPrice.billingInterval ?? "one time"}`
                : "No attached price",
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Trial history</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Trial lifecycle records associated with this account.
            </Text>
          </div>
          <Badge tone="neutral">{trials.length}</Badge>
        </CardHeader>
        {trials.length === 0 ? (
          <EmptyState
            title="No trials"
            description="No trial lifecycle record exists for this user."
          />
        ) : (
          <Timeline
            items={trials.map((trial) => ({
              title: `Trial ${titleize(trial.status)}`,
              description: `${formatDate(trial.startsAt)} → ${formatDate(trial.endsAt)}${trial.source ? ` · ${trial.source}` : ""}`,
              timestamp: formatDateTime(trial.createdAt),
              tone: trial.status === "converted" ? "success" : "neutral",
            }))}
          />
        )}
      </Card>

      <Card className="2xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Recent subscription events</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Append-only lifecycle audit trail from subscription_events.
            </Text>
          </div>
        </CardHeader>
        {subscriptionEvents.length === 0 ? (
          <EmptyState
            title="No subscription events"
            description="No lifecycle event has been recorded for this subscription."
          />
        ) : (
          <Timeline
            items={subscriptionEvents.map((event) => ({
              title: titleize(event.eventType),
              description:
                event.actorUserId === null
                  ? "System initiated"
                  : `Actor user #${event.actorUserId}`,
              timestamp: formatDateTime(event.eventTime),
              tone: event.eventType === "past_due" ? "danger" : "info",
            }))}
          />
        )}
      </Card>
    </div>
  );
}
