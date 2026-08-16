"use client";

import { Suspense } from "react";
import { Eye, FilePenLine, Layers3, Plus, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/actions";
import { Badge, Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";
import { Heading, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { PlansListData } from "../types";
import { formatNumber } from "./plan-formatters";
import { PlansFilters } from "./plans-filters";
import { PlansTable } from "./plans-table";

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
          {icon}
        </div>
        <Badge tone="neutral" size="sm">
          {t("plans.list.live")}
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

function FiltersFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-80 max-w-full" />
      <div className="flex flex-col gap-3 xl:flex-row">
        <Skeleton className="h-8 flex-1 xl:max-w-md" />
        <div className="grid flex-1 grid-cols-2 gap-2 xl:grid-cols-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </div>
  );
}

export function PlansDashboard({ data }: { data: PlansListData }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={2}>{t("plans.list.title")}</Heading>
            <Badge tone="primary">{t("plans.list.versionedCatalog")}</Badge>
          </div>
          <Text tone="muted" size="sm" className="mt-1 max-w-2xl">
            {t("plans.list.description")}
          </Text>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-4 py-3 shadow-[var(--shadow-xs)]">
            <Text size="xs" weight="semibold">
              {t("plans.list.governance")}
            </Text>
            <Text size="xs" tone="muted" className="mt-0.5">
              {t("plans.list.governanceDescription")}
            </Text>
          </div>
          <LocalizedLink
            href="/plans/new"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Plus className="size-4" />
            {t("plans.common.createPlan")}
          </LocalizedLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label={t("plans.list.summary.totalPlans")}
          value={data.summary.totalPlans}
          helper={t("plans.list.summary.totalPlansHelper")}
          icon={<Layers3 className="size-4" />}
        />
        <SummaryCard
          label={t("plans.list.summary.activePublicPlans")}
          value={data.summary.activePublicPlans}
          helper={t("plans.list.summary.activePublicPlansHelper")}
          icon={<Eye className="size-4" />}
        />
        <SummaryCard
          label={t("plans.list.summary.draftPlans")}
          value={data.summary.draftPlans}
          helper={t("plans.list.summary.draftPlansHelper")}
          icon={<FilePenLine className="size-4" />}
        />
        <SummaryCard
          label={t("plans.list.summary.activeSubscribers")}
          value={data.summary.activeSubscribers}
          helper={t("plans.list.summary.activeSubscribersHelper")}
          icon={<Users className="size-4" />}
        />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-100 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <Heading level={6}>{t("plans.list.inventoryTitle")}</Heading>
              <Text size="xs" tone="muted" className="mt-1">
                {t("plans.list.inventoryDescription")}
              </Text>
            </div>
            <Badge tone="neutral">
              {t("plans.list.matchingPlans", { count: formatNumber(data.totalItems) })}
            </Badge>
          </div>
          <div className="mt-5">
            <Suspense fallback={<FiltersFallback />}>
              <PlansFilters filters={data.filters} currencies={data.currencies} />
            </Suspense>
          </div>
        </div>
        <div className="p-5">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <PlansTable
              items={data.items}
              filters={data.filters}
              totalItems={data.totalItems}
              pageCount={data.pageCount}
              catalogPlanCount={data.summary.totalPlans}
            />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
