import { Activity, Database, Gauge, Layers3 } from "lucide-react";
import { Badge, Card } from "@/components/ui/data-display";
import { Progress } from "@/components/ui/feedback";
import { NumericText, Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import {
  formatBytes,
  formatCredits,
  healthTone,
  titleize,
} from "../formatters";

export function UserSummaryCards({ detail }: { detail: UserDetail }) {
  const { user, subscription, creditAccount, intelligence } = detail;
  const storageUtilization =
    user.storageQuotaBytes > 0
      ? Math.min(
          100,
          Math.round((user.storageUsedBytes / user.storageQuotaBytes) * 100),
        )
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
            <Layers3 className="size-4" />
          </div>
          <Badge tone={subscription ? "primary" : "neutral"} size="sm">
            {subscription ? `v${subscription.planVersion.versionNumber}` : "Unassigned"}
          </Badge>
        </div>
        <Text size="xs" tone="muted" weight="medium" className="mt-4">
          Current plan
        </Text>
        <Text size="lg" weight="semibold" className="mt-1 truncate">
          {subscription?.plan.name ?? "No active plan"}
        </Text>
        <Text size="xs" tone="subtle" className="mt-1">
          {subscription?.plan.code ?? "No commercial configuration"}
        </Text>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-success-50 text-success-700">
            <Gauge className="size-4" />
          </div>
          <Badge tone={healthTone(intelligence.health.riskLevel)} size="sm">
            {titleize(intelligence.health.riskLevel)}
          </Badge>
        </div>
        <Text size="xs" tone="muted" weight="medium" className="mt-4">
          Health score
        </Text>
        <NumericText size="xl" className="mt-1 block">
          {intelligence.health.score}
        </NumericText>
        <Progress value={intelligence.health.score} size="sm" />
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-info-50 text-info-700">
            <Activity className="size-4" />
          </div>
          <Badge
            tone={
              intelligence.creditReconciliation?.reconciled
                ? "success"
                : creditAccount
                  ? "warning"
                  : "neutral"
            }
            size="sm"
          >
            {creditAccount
              ? intelligence.creditReconciliation?.reconciled
                ? "Reconciled"
                : "Review"
              : "No wallet"}
          </Badge>
        </div>
        <Text size="xs" tone="muted" weight="medium" className="mt-4">
          Available credit
        </Text>
        <Text size="lg" weight="semibold" className="mt-1">
          {intelligence.availableCredit === null
            ? "—"
            : formatCredits(intelligence.availableCredit)}
        </Text>
        <Text size="xs" tone="subtle" className="mt-1">
          {intelligence.creditRunway?.runwayLabel ?? "No usage forecast"}
        </Text>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-600">
            <Database className="size-4" />
          </div>
          <Badge tone={storageUtilization >= 90 ? "warning" : "neutral"} size="sm">
            {storageUtilization}% used
          </Badge>
        </div>
        <Text size="xs" tone="muted" weight="medium" className="mt-4">
          Storage
        </Text>
        <Text size="lg" weight="semibold" className="mt-1">
          {formatBytes(user.storageUsedBytes)}
        </Text>
        <Text size="xs" tone="subtle" className="mt-1">
          of {formatBytes(user.storageQuotaBytes)}
        </Text>
      </Card>
    </div>
  );
}
