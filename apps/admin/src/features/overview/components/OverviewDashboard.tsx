"use client";

import { Suspense } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Coins,
  Layers3,
  Repeat2,
  Users,
} from "lucide-react";
import {
  ChartContainer,
  ChartEmptyState,
  ChartHeader,
  Sparkline,
} from "@/components/ui/charts";
import {
  Badge,
  Card,
  StatusIndicator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/data-display";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { Heading, NumericText, Text } from "@/components/ui/typography";
import { useI18n } from "@/i18n/client";
import type { OverviewDashboardData } from "../types";
import { OverviewHeaderControls } from "./OverviewHeaderControls";

function currencyDivisor(currency: string) {
  try {
    const digits = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
    return 10 ** digits;
  } catch {
    return 100;
  }
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value / currencyDivisor(currency));
  } catch {
    return `${currency} ${(value / 100).toLocaleString("en-US")}`;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function KpiCard({
  label,
  value,
  helper,
  badge,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  badge?: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Card className="min-h-40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
          {icon}
        </div>
        {badge}
      </div>
      <Text size="xs" tone="muted" weight="medium" className="mt-5">
        {label}
      </Text>
      <NumericText size="xl" className="mt-1 block">
        {value}
      </NumericText>
      <Text size="xs" tone="subtle" className="mt-2">
        {helper}
      </Text>
    </Card>
  );
}

function HealthRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "success" | "info" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <StatusIndicator tone={tone} label={label} />
        <NumericText size="sm">{formatNumber(value)}</NumericText>
      </div>
      <Progress value={total > 0 ? Math.min(100, (value / total) * 100) : 0} size="sm" />
    </div>
  );
}

export function OverviewDashboard({ data }: { data: OverviewDashboardData }) {
  const {
    filters,
    kpis,
    revenueTrend,
    creditTrend,
    subscriptionHealth,
    attentionRequired,
    planPerformance,
  } = data;
  const { t } = useI18n();

  const totalHealth =
    subscriptionHealth.active +
    subscriptionHealth.trialing +
    subscriptionHealth.pastDue +
    subscriptionHealth.paused +
    subscriptionHealth.canceled +
    subscriptionHealth.incomplete +
    subscriptionHealth.expired;
  const inactiveSubscriptions =
    subscriptionHealth.canceled + subscriptionHealth.incomplete + subscriptionHealth.expired;

  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Heading level={2}>{t("overview.title")}</Heading>
          <Text tone="muted" size="sm" className="mt-1">
            {t("overview.subtitle")}
          </Text>
        </div>
        <Suspense fallback={<div className="h-8 w-96 max-w-full rounded-[var(--radius-sm)] bg-neutral-100" />}>
          <OverviewHeaderControls
            from={filters.from}
            to={filters.to}
            currency={filters.currency}
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <KpiCard
          label={t("overview.kpi.netRevenue")}
          value={formatMoney(kpis.totalRevenue, filters.currency)}
          helper={t("overview.kpi.newUsersInPeriod", { count: formatNumber(kpis.newUsersCount) })}
          badge={<Badge tone="neutral">{t("overview.badge.periodTotal")}</Badge>}
          icon={<CircleDollarSign className="size-4" />}
        />
        <KpiCard
          label={t("overview.kpi.mrr")}
          value={formatMoney(kpis.mrr, filters.currency)}
          helper={t("overview.kpi.totalPlatformUsers", {
            count: formatNumber(kpis.totalUsersCount),
          })}
          badge={<Badge tone="success">{t("overview.badge.normalized")}</Badge>}
          icon={<Repeat2 className="size-4" />}
        />
        <KpiCard
          label={t("overview.kpi.activeSubscriptions")}
          value={formatNumber(kpis.activeSubscriptionsCount)}
          helper={t("overview.kpi.trialConversion", {
            percent: formatPercent(kpis.trialConversionRate),
          })}
          badge={
            kpis.atRiskCount > 0 ? (
              <Badge tone="warning">
                {t("overview.badge.atRisk", { count: formatNumber(kpis.atRiskCount) })}
              </Badge>
            ) : (
              <Badge tone="success">{t("overview.badge.healthy")}</Badge>
            )
          }
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label={t("overview.kpi.availableCredits")}
          value={formatNumber(kpis.availableCredits)}
          helper={t("overview.kpi.lifetimeUtilization", {
            percent: formatPercent(kpis.creditUtilizationRate),
          })}
          badge={<Badge tone="info">{t("overview.badge.platformBalance")}</Badge>}
          icon={<Coins className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartContainer className="xl:col-span-2">
          <ChartHeader
            title={t("overview.chart.revenueTrend.title")}
            subtitle={t("overview.chart.revenueTrend.subtitle", {
              from: filters.from,
              to: filters.to,
              currency: filters.currency,
            })}
            action={
              <NumericText size="sm">{formatMoney(kpis.totalRevenue, filters.currency)}</NumericText>
            }
          />
          {revenueTrend.length > 0 ? (
            <>
              <div className="overflow-x-auto py-3">
                <Sparkline
                  points={revenueTrend.map((point) => point.amount)}
                  width={680}
                  height={180}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-neutral-400">
                <span>{formatDate(revenueTrend[0].date)}</span>
                <span>{formatDate(revenueTrend.at(-1)?.date ?? revenueTrend[0].date)}</span>
              </div>
            </>
          ) : (
            <ChartEmptyState height={220} />
          )}
        </ChartContainer>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Heading level={6}>{t("overview.subHealth.title")}</Heading>
              <Text size="xs" tone="muted" className="mt-1">
                {t("overview.subHealth.subtitle")}
              </Text>
            </div>
            <Badge tone="neutral">
              {t("overview.subHealth.total", { count: formatNumber(totalHealth) })}
            </Badge>
          </div>
          <div className="mt-6 space-y-5">
            <HealthRow
              label={t("overview.subHealth.status.active")}
              value={subscriptionHealth.active}
              total={totalHealth}
              tone="success"
            />
            <HealthRow
              label={t("overview.subHealth.status.trialing")}
              value={subscriptionHealth.trialing}
              total={totalHealth}
              tone="info"
            />
            <HealthRow
              label={t("overview.subHealth.status.pastDue")}
              value={subscriptionHealth.pastDue}
              total={totalHealth}
              tone="danger"
            />
            <HealthRow
              label={t("overview.subHealth.status.paused")}
              value={subscriptionHealth.paused}
              total={totalHealth}
              tone="warning"
            />
            <HealthRow
              label={t("overview.subHealth.status.inactive")}
              value={inactiveSubscriptions}
              total={totalHealth}
              tone="neutral"
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartContainer>
          <ChartHeader
            title={t("overview.creditUsage.title")}
            subtitle={t("overview.creditUsage.subtitle")}
            action={
              <Badge tone="info">
                {t("overview.creditUsage.utilized", {
                  percent: formatPercent(kpis.creditUtilizationRate),
                })}
              </Badge>
            }
          />
          {creditTrend.length > 0 ? (
            <>
              <div className="overflow-x-auto py-3">
                <Sparkline
                  points={creditTrend.map((point) => point.credits)}
                  width={560}
                  height={150}
                  color="var(--color-info-500)"
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-neutral-400">
                <span>{formatDate(creditTrend[0].date)}</span>
                <span>{formatDate(creditTrend.at(-1)?.date ?? creditTrend[0].date)}</span>
              </div>
            </>
          ) : (
            <ChartEmptyState height={190} />
          )}
        </ChartContainer>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Heading level={6}>{t("overview.attention.title")}</Heading>
              <Text size="xs" tone="muted" className="mt-1">
                {t("overview.attention.subtitle")}
              </Text>
            </div>
            {attentionRequired.length > 0 && (
              <Badge tone="warning">
                {t("overview.attention.items", { count: attentionRequired.length })}
              </Badge>
            )}
          </div>

          <div className="mt-5">
            {attentionRequired.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {attentionRequired.slice(0, 6).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                        {item.type === "trial_ending_soon" ? (
                          <CalendarClock className="size-4" />
                        ) : (
                          <AlertTriangle className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Text size="sm" weight="semibold" className="truncate">
                          {item.title}
                        </Text>
                        <Text size="xs" tone="muted" className="truncate">
                          {item.subtitle}
                        </Text>
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      {item.amount !== undefined && item.currency && (
                        <NumericText size="sm">
                          {formatMoney(item.amount, item.currency)}
                        </NumericText>
                      )}
                      <Text size="xs" tone="subtle">
                        {formatDate(item.date)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("overview.attention.empty.title")}
                description={t("overview.attention.empty.description")}
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Heading level={6}>{t("overview.planPerformance.title")}</Heading>
            <Text size="xs" tone="muted" className="mt-1">
              {t("overview.planPerformance.subtitle")}
            </Text>
          </div>
          <Layers3 className="size-5 text-neutral-400" />
        </div>

        <div className="mt-5">
          {planPerformance.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("overview.planPerformance.table.plan")}</TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("overview.planPerformance.table.activeSubscribers")}
                  </TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("overview.planPerformance.table.mrr")}
                  </TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("overview.planPerformance.table.share")}
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {planPerformance.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium text-neutral-900">{plan.name}</TableCell>
                    <TableCell className="text-end">
                      <NumericText size="sm">{formatNumber(plan.activeSubscribers)}</NumericText>
                    </TableCell>
                    <TableCell className="text-end">
                      <NumericText size="sm">
                        {formatMoney(plan.mrr, filters.currency)}
                      </NumericText>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="ms-auto flex max-w-36 items-center justify-end gap-3">
                        <Progress value={Math.min(100, plan.share)} size="sm" />
                        <span className="w-10 text-xs font-medium tabular-nums text-neutral-600">
                          {Math.round(plan.share)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={t("overview.planPerformance.empty.title")}
              description={t("overview.planPerformance.empty.description")}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
