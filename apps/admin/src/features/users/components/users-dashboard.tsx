"use client";

import { AlertTriangle, CircleUserRound, CreditCard, UserRoundX } from "lucide-react";
import { Badge, Card } from "@/components/ui/data-display";
import { Heading, NumericText, Text } from "@/components/ui/typography";
import { useI18n } from "@/i18n/client";
import type { UsersListData } from "../list-types";
import { formatNumber } from "../formatters";
import { UsersFilters } from "./users-filters";
import { UsersTable } from "./users-table";

function SummaryCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const { t } = useI18n();
  const iconTone = {
    neutral: "bg-neutral-100 text-neutral-500",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    danger: "bg-danger-50 text-danger-700",
  }[tone];

  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex size-9 items-center justify-center rounded-[var(--radius-md)] ${iconTone}`}>
          {icon}
        </div>
        <Badge tone="neutral" size="sm">
          {t("users.list.live")}
        </Badge>
      </div>
      <Text size="xs" tone="muted" weight="medium" className="mt-4">
        {label}
      </Text>
      <NumericText size="xl" className="mt-1 block">
        {formatNumber(value)}
      </NumericText>
      <Text size="xs" tone="subtle" className="mt-1.5">
        {helper}
      </Text>
    </Card>
  );
}

export function UsersDashboard({ data }: { data: UsersListData }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={2}>{t("users.list.title")}</Heading>
            <Badge tone="primary">{t("users.list.badge.controlPlane")}</Badge>
          </div>
          <Text tone="muted" size="sm" className="mt-1 max-w-3xl">
            {t("users.list.description")}
          </Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-4 py-3 shadow-[var(--shadow-xs)]">
          <Text size="xs" weight="semibold">
            {t("users.list.source.title")}
          </Text>
          <Text size="xs" tone="muted" className="mt-0.5">
            {t("users.list.source.value")}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label={t("users.list.summary.totalUsers")}
          value={data.summary.totalUsers}
          helper={t("users.list.summary.totalUsersHelper")}
          icon={<CircleUserRound className="size-4" />}
        />
        <SummaryCard
          label={t("users.list.summary.activeSubscribers")}
          value={data.summary.activeSubscribers}
          helper={t("users.list.summary.activeSubscribersHelper")}
          icon={<CreditCard className="size-4" />}
          tone="success"
        />
        <SummaryCard
          label={t("users.list.summary.pastDueSubscribers")}
          value={data.summary.pastDueSubscribers}
          helper={t("users.list.summary.pastDueSubscribersHelper")}
          icon={<AlertTriangle className="size-4" />}
          tone="warning"
        />
        <SummaryCard
          label={t("users.list.summary.withoutSubscription")}
          value={data.summary.usersWithoutSubscriptions}
          helper={t("users.list.summary.withoutSubscriptionHelper")}
          icon={<UserRoundX className="size-4" />}
        />
      </div>

      <Card className="space-y-5" padding="lg">
        <UsersFilters filters={data.filters} plans={data.plans} />
        <UsersTable
          items={data.items}
          filters={data.filters}
          totalItems={data.totalItems}
          pageCount={data.pageCount}
        />
      </Card>
    </div>
  );
}
