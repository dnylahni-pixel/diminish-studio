import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DescriptionList, DescriptionItem } from "@/components/ui/description-list";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type { SubscriptionWithPlan, User } from "@/features/users/types";

interface Props {
  user: User;
  subscription: SubscriptionWithPlan | null;
}

export function UserOverviewTab({ user, subscription }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList>
            <DescriptionItem label="Username" value={user.username} />
            <DescriptionItem label="Email" value={user.email} />
            <DescriptionItem label="User ID" value={String(user.id)} />
            <DescriptionItem
              label="Preferred Instrument"
              value={user.preferredInstrument ?? "—"}
            />
            <DescriptionItem
              label="Joined"
              value={
                <span title={formatDate(user.createdAt)}>
                  {formatRelativeTime(user.createdAt)}
                </span>
              }
            />
            <DescriptionItem label="Bio" value={user.bio ?? "—"} />
          </DescriptionList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList>
            <DescriptionItem
              label="Plan"
              value={subscription?.plan?.name ?? "No active plan"}
            />
            <DescriptionItem
              label="Plan Code"
              value={subscription?.plan?.code ?? "—"}
            />
            <DescriptionItem
              label="Status"
              value={subscription?.status ?? "—"}
            />
            <DescriptionItem
              label="Price"
              value={
                subscription?.planPrice
                  ? `${formatCurrency(
                      subscription.planPrice.amount,
                      subscription.planPrice.currency,
                    )} / ${subscription.planPrice.billingIntervalCount > 1 ? subscription.planPrice.billingIntervalCount : ""}${subscription.planPrice.billingInterval}`
                  : "—"
              }
            />
            <DescriptionItem
              label="Current Period"
              value={
                subscription?.currentPeriodStart && subscription?.currentPeriodEnd
                  ? `${formatDate(subscription.currentPeriodStart)} → ${formatDate(subscription.currentPeriodEnd)}`
                  : "—"
              }
            />
          </DescriptionList>
        </CardContent>
      </Card>
    </div>
  );
}
