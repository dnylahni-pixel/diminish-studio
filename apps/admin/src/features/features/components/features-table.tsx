"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Button, buttonVariants, IconButton } from "@/components/ui/actions";
import {
  Badge,
  DataTable,
  type DataTableColumn,
  StatusIndicator,
} from "@/components/ui/data-display";
import { EmptyState } from "@/components/ui/feedback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
} from "@/components/ui/navigation";
import { Code, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { FeatureKind, FeatureListItem, FeaturesFilters } from "../types";
import {
  formatDateTime,
  formatNumber,
  getFeatureKindTone,
} from "./feature-formatters";

export function FeaturesTable({
  items,
  filters,
  totalItems,
  pageCount,
  catalogFeatureCount,
}: {
  items: FeatureListItem[];
  filters: FeaturesFilters;
  totalItems: number;
  pageCount: number;
  catalogFeatureCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const replaceParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  const columns = useMemo<DataTableColumn<FeatureListItem>[]>(
    () => {
      const kindLabels: Record<FeatureKind, string> = {
        boolean: t("features.kindLabel.boolean"),
        metered: t("features.kindLabel.metered"),
        quota: t("features.kindLabel.quota"),
        package: t("features.kindLabel.package"),
      };

      return [
        {
          key: "name",
          header: t("features.table.feature"),
          sortable: true,
          render: (feature) => (
            <div className="min-w-60 max-w-md">
              <div className="flex items-center gap-2">
                <LocalizedLink
                  href={`/features/${feature.id}`}
                  className="font-semibold text-neutral-900 outline-none hover:text-primary-700 hover:underline hover:decoration-primary-200 hover:underline-offset-4 focus-visible:rounded-xs focus-visible:ring-[3px] focus-visible:ring-primary-200"
                >
                  {feature.name}
                </LocalizedLink>
                <Code className="max-w-40 truncate text-[0.6875rem]">
                  {feature.code}
                </Code>
              </div>
              <Text size="xs" tone="muted" className="mt-1 line-clamp-2">
                {feature.description ||
                  t("features.table.noDescription")}
              </Text>
            </div>
          ),
        },
        {
          key: "status",
          header: t("features.table.capability"),
          render: (feature) => (
            <div className="space-y-2">
              <StatusIndicator
                tone={feature.isActive ? "success" : "neutral"}
                label={
                  feature.isActive
                    ? t("features.active")
                    : t("features.inactive")
                }
                pulse={feature.isActive}
              />
              <Badge tone={getFeatureKindTone(feature.kind)} size="sm">
                {kindLabels[feature.kind]}
                {feature.unitName ? ` · ${feature.unitName}` : ""}
              </Badge>
            </div>
          ),
        },
        {
          key: "coverage",
          header: t("features.table.policyCoverage"),
          render: (feature) => (
            <div className="min-w-40 space-y-1">
              <Text size="sm" weight="semibold">
                {t("features.table.plans", {
                  count: formatNumber(feature.planCount),
                })}
              </Text>
              <Text size="xs" tone="subtle">
                {t("features.table.limitsRules", {
                  limits: formatNumber(feature.limitPolicyCount),
                  pricing: formatNumber(feature.pricingRuleCount),
                })}
              </Text>
              <Text size="xs" tone="subtle">
                {t("features.table.dependencyCount", {
                  count: formatNumber(feature.dependencyCount),
                })}
              </Text>
            </div>
          ),
        },
        {
          key: "usage",
          header: t("features.table.usage30d"),
          align: "right",
          sortable: true,
          render: (feature) => (
            <div className="min-w-32 text-end">
              <NumericText size="sm">
                {formatNumber(feature.usageQuantity30d)}
              </NumericText>
              <Text size="xs" tone="subtle" className="mt-1">
                {t("features.table.credits", {
                  count: formatNumber(feature.usageCredits30d),
                })}
              </Text>
            </div>
          ),
        },
        {
          key: "updated",
          header: t("features.table.updated"),
          sortable: true,
          render: (feature) => (
            <div className="min-w-28">
              <Text as="div" size="sm" weight="medium">
                <time
                  dateTime={feature.updatedAt}
                  title={formatDateTime(feature.updatedAt)}
                >
                  {feature.updatedRelative}
                </time>
              </Text>
              <Text size="xs" tone="subtle" className="mt-1">
                {t("features.table.utcCatalogTime")}
              </Text>
            </div>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "right",
          render: (feature) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  label={t("features.table.actionsFor", { name: feature.name })}
                  variant="ghost"
                  size="sm"
                >
                  <MoreHorizontal className="size-4" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <LocalizedLink href={`/features/${feature.id}`}>
                    <ExternalLink className="size-4 text-neutral-400" />
                    {t("features.table.manageFeature")}
                  </LocalizedLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void navigator.clipboard.writeText(feature.id)}
                >
                  <Copy className="size-4 text-neutral-400" />
                  {t("features.table.copyFeatureId")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ];
    },
    [t],
  );

  const handleSortChange = (key: string) => {
    if (key !== "name" && key !== "updated" && key !== "usage") return;
    const nextDirection =
      filters.sort === key && filters.direction === "asc" ? "desc" : "asc";
    replaceParams({
      sort: key,
      direction: nextDirection,
      page: undefined,
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SlidersHorizontal className="size-5" />}
        title={
          catalogFeatureCount > 0
            ? t("features.table.noMatchTitle")
            : t("features.table.readyTitle")
        }
        description={
          catalogFeatureCount > 0
            ? t("features.table.noMatchDescription")
            : t("features.table.readyDescription")
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {catalogFeatureCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.replace(pathname, { scroll: false })}
              >
                {t("features.table.clearFilters")}
              </Button>
            )}
            <LocalizedLink
              href="/features/new"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Plus className="size-3.5" />
              {t("features.createFeature")}
            </LocalizedLink>
          </div>
        }
      />
    );
  }

  const firstItem = (filters.page - 1) * filters.pageSize + 1;
  const lastItem = Math.min(filters.page * filters.pageSize, totalItems);

  return (
    <div className={isPending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <DataTable
        columns={columns}
        data={items}
        sortKey={filters.sort}
        sortDirection={filters.direction}
        onSortChange={handleSortChange}
        footer={
          <>
            <Text size="xs" tone="muted">
              {t("features.table.showing", {
                first: formatNumber(firstItem),
                last: formatNumber(lastItem),
                count: formatNumber(totalItems),
              })}
            </Text>
            <Pagination
              page={filters.page}
              pageCount={pageCount}
              onPageChange={(page) =>
                replaceParams({ page: page === 1 ? undefined : String(page) })
              }
              previousLabel={t("common.previous")}
              nextLabel={t("common.next")}
            />
          </>
        }
      />
    </div>
  );
}
