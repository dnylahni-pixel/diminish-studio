import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { SubscriptionWithPlan, User } from "@/features/users/types";

interface Props {
  user: User;
  subscription: SubscriptionWithPlan | null;
}

function subscriptionStatusTone(status: string | undefined) {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "info";
    case "past_due":
    case "unpaid":
      return "warning";
    case "canceled":
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

export function UserIdentityHeader({ user, subscription }: Props) {
  const initials = user.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <span className="text-sm text-muted-foreground">#{user.id}</span>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p
            className="text-xs text-muted-foreground"
            title={formatDate(user.createdAt)}
          >
            Joined {formatRelativeTime(user.createdAt)}
          </p>
        </div>
      </div>

      <StatusIndicator
        tone={subscriptionStatusTone(subscription?.status)}
        label={subscription ? subscription.status : "No subscription"}
      />
    </div>
  );
}
