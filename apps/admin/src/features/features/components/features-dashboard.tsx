"use client";

import { Suspense, type ReactNode } from "react";
import {
  Activity,
  Boxes,
  Coins,
  Gauge,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/actions";
import { Badge, Card } from "@/components/ui/data-display";
import { Skeleton } from "@/components/ui/feedback";
import { Heading, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { FeaturesListData } from "../types";
import { formatNumber } from "./feature-formatters";
import { FeaturesFilters } from "./features-filters";
import { FeaturesTable } from "./features-table";

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
          {icon}
        </div>
        <Badge tone="neutral" size="sm">
          {t("features.dashboard.live")}
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

export function FeaturesDashboard({ data }: { data: FeaturesListData }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={2}>{t("features.catalog")}</Heading>
            <Badge tone="primary">{t("features.dashboard.policyDriven")}</Badge>
          </div>
          <Text tone="muted" size="sm" className="mt-1 max-w-3xl">
            {t("features.dashboard.subtitle")}
          </Text>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-4 py-3 shadow-[var(--shadow-xs)]">
            <Text size="xs" weight="semibold">
              {t("features.dashboard.safePolicyFallback")}
            </Text>
            <Text size="xs" tone="muted" className="mt-0.5">
              {t("features.dashboard.noOverrideFallback")}
            </Text>
          </div>
          <LocalizedLink
            href="/features/new"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Plus className="size-4" />
            {t("features.createFeature")}
          </LocalizedLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label={t("features.dashboard.totalFeatures")}
          value={data.summary.totalFeatures}
          helper={t("features.dashboard.activeCapabilities", {
            count: formatNumber(data.summary.activeFeatures),
          })}
          icon={<Boxes className="size-4" />}
        />
        <SummaryCard
          label={t("features.dashboard.meteredFeatures")}
          value={data.summary.meteredFeatures}
          helper={t("features.dashboard.meteredEligible")}
          icon={<Gauge className="size-4" />}
        />
        <SummaryCard
          label={t("features.dashboard.configuredPolicies")}
          value={data.summary.configuredPolicies}
          helper={t("features.dashboard.connectedToPlans")}
          icon={<ShieldCheck className="size-4" />}
        />
        <SummaryCard
          label={t("features.dashboard.creditsConsumed30d")}
          value={data.summary.usageCredits30d}
          helper={t("features.dashboard.usageUnitsRecorded", {
            count: formatNumber(data.summary.usageQuantity30d),
          })}
          icon={<Coins className="size-4" />}
        />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-100 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <Heading level={6}>{t("features.dashboard.inventoryTitle")}</Heading>
              <Text size="xs" tone="muted" className="mt-1">
                {t("features.dashboard.inventorySubtitle")}
              </Text>
            </div>
            <Badge tone="neutral">
              {t("features.dashboard.matchingFeatures", {
                count: formatNumber(data.totalItems),
              })}
            </Badge>
          </div>
          <div className="mt-5">
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <FeaturesFilters filters={data.filters} />
            </Suspense>
          </div>
        </div>
        <div className="p-5">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <FeaturesTable
              items={data.items}
              filters={data.filters}
              totalItems={data.totalItems}
              pageCount={data.pageCount}
              catalogFeatureCount={data.summary.totalFeatures}
            />
          </Suspense>
        </div>
      </Card>

      <Card padding="sm">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 size-4 text-primary-600" />
          <div>
            <Text size="sm" weight="semibold">
              {t("features.dashboard.optionalPolicyContract")}
            </Text>
            <Text size="xs" tone="muted" className="mt-1">
              {t("features.dashboard.optionalPolicyContractText")}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
