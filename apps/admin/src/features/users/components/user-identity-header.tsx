import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Avatar, Badge, StatusIndicator } from "@/components/ui/data-display";
import { Heading, Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import {
  formatDateTime,
  formatRelativeTime,
  healthTone,
  subscriptionTone,
  titleize,
} from "../formatters";

export function UserIdentityHeader({ detail }: { detail: UserDetail }) {
  const { user, subscription, intelligence } = detail;

  return (
    <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt={user.username}
          fallback={user.username.slice(0, 2).toUpperCase()}
          size="xl"
          ring
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={2} className="truncate">
              {user.username}
            </Heading>
            <Badge tone="neutral">User #{user.id}</Badge>
            {user.clerkId && <Badge tone="primary">Identity linked</Badge>}
          </div>
          <Text size="sm" tone="muted" className="mt-1 truncate">
            {user.email}
          </Text>
          <Text
            size="xs"
            tone="subtle"
            className="mt-1"
            title={formatDateTime(user.createdAt)}
          >
            Joined {formatRelativeTime(user.createdAt)}
          </Text>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 px-4 py-3 shadow-[var(--shadow-xs)]">
        <div>
          <Text size="xs" tone="subtle">
            Subscription
          </Text>
          <StatusIndicator
            tone={subscriptionTone(subscription?.status)}
            label={subscription ? titleize(subscription.status) : "No subscription"}
            pulse={subscription?.status === "active"}
          />
        </div>
        <div className="h-9 w-px bg-neutral-200" />
        <div>
          <Text size="xs" tone="subtle">
            Account health
          </Text>
          <div className="mt-1 flex items-center gap-2">
            {intelligence.health.riskLevel === "healthy" ? (
              <ShieldCheck className="size-4 text-success-600" />
            ) : (
              <ShieldAlert className="size-4 text-warning-600" />
            )}
            <Badge tone={healthTone(intelligence.health.riskLevel)}>
              {intelligence.health.score}/100 · {titleize(intelligence.health.riskLevel)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
