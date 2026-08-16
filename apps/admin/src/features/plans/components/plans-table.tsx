"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, ExternalLink, Layers3, MoreHorizontal, Plus } from "lucide-react";
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
import { LocalizedLink, useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import type { PlanListItem, PlansFilters } from "../types";
import {
  enumLabel,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPrice,
  getPlanStatusTone,
  getVersionStatusTone,
} from "./plan-formatters";

interface PlansTableProps {
  items: PlanListItem[];
  filters: PlansFilters;
  totalItems: number;
  pageCount: number;
  catalogPlanCount: number;
}

export function PlansTable({
  items,
  filters,
  totalItems,
  pageCount,
  catalogPlanCount,
}: PlansTableProps) {
  const router = useRouter();
  const pathname = usePathnameWithoutLocale();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const replaceParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    const query = params.toString();
    const target = localePrefix(locale, pathname);
    startTransition(() => {
      router.replace(query ? `${target}?${query}` : target, { scroll: false });
    });
  };

  const columns = useMemo<DataTableColumn<PlanListItem>[]>(
    () => [
      {
        key: "name",
        header: t("plans.list.table.plan"),
        sortable: true,
        render: (plan) => (
          <div className="min-w-56 max-w-sm">
            <div className="flex items-center gap-2">
              <LocalizedLink
                href={`/plans/${plan.id}`}
                className="font-semibold text-neutral-900 outline-none hover:text-primary-700 hover:underline hover:decoration-primary-200 hover:underline-offset-4 focus-visible:rounded-xs focus-visible:ring-[3px] focus-visible:ring-primary-200"
              >
                {plan.name}
              </LocalizedLink>
              <Code className="max-w-36 truncate text-[0.6875rem]">{plan.code}</Code>
            </div>
            <Text size="xs" tone="muted" className="mt-1 line-clamp-2">
              {plan.description || t("plans.list.table.noDescription")}
            </Text>
          </div>
        ),
      },
      {
        key: "status",
        header: t("plans.list.table.status"),
        render: (plan) => (
          <div className="space-y-2">
            <StatusIndicator
              tone={getPlanStatusTone(plan.status)}
              label={enumLabel(t, plan.status)}
              pulse={plan.status === "active"}
            />
            <Badge tone={plan.isPublic ? "primary" : "neutral"} size="sm">
              {plan.isPublic
                ? t("plans.list.table.visibilityPublic")
                : t("plans.list.table.visibilityPrivate")}
            </Badge>
          </div>
        ),
      },
      {
        key: "version",
        header: t("plans.list.table.currentVersion"),
        render: (plan) =>
          plan.currentVersion ? (
            <div>
              <div className="flex items-center gap-2">
                <NumericText size="sm">v{plan.currentVersion.versionNumber}</NumericText>
                <Badge
                  tone={getVersionStatusTone(plan.currentVersion.status)}
                  size="sm"
                >
                  {enumLabel(t, plan.currentVersion.status)}
                </Badge>
              </div>
              <Text size="xs" tone="subtle" className="mt-1">
                {plan.currentVersion.effectiveFrom
                  ? t("plans.list.table.effective", {
                      date: new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(plan.currentVersion.effectiveFrom)),
                    })
                  : t("plans.list.table.notScheduled")}
              </Text>
            </div>
          ) : (
            <div>
              <Text size="sm" weight="medium">
                {t("plans.list.table.noVersion")}
              </Text>
              <Text size="xs" tone="subtle" className="mt-1">
                {t("plans.list.table.configurationRequired")}
              </Text>
            </div>
          ),
      },
      {
        key: "pricing",
        header: t("plans.list.table.pricing"),
        render: (plan) =>
          plan.defaultPrice ? (
            <div className="min-w-40">
              <Text size="sm" weight="semibold">
                {formatPrice(plan.defaultPrice, t)}
              </Text>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {plan.hasMultipleCurrencies ? (
                  <Badge tone="info" size="sm">
                    {t("plans.list.table.multipleCurrencies")}
                  </Badge>
                ) : (
                  <Text size="xs" tone="subtle">
                    {enumLabel(t, plan.defaultPrice.priceType)}
                  </Text>
                )}
                {plan.defaultPrice.trialDays !== null &&
                  plan.defaultPrice.trialDays > 0 && (
                    <Badge tone="neutral" size="sm">
                      {t("plans.list.table.dayTrial", {
                        days: plan.defaultPrice.trialDays,
                      })}
                    </Badge>
                  )}
              </div>
            </div>
          ) : (
            <div>
              <Text size="sm" weight="medium">
                {t("plans.list.table.notPriced")}
              </Text>
              <Text size="xs" tone="subtle" className="mt-1">
                {t("plans.list.table.noActivePrice")}
              </Text>
            </div>
          ),
      },
      {
        key: "subscribers",
        header: t("plans.list.table.subscribers"),
        align: "right",
        render: (plan) => (
          <div className="min-w-36 text-right">
            <NumericText size="sm">{formatNumber(plan.activeSubscribers)}</NumericText>
            {plan.recurringRevenue.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {plan.recurringRevenue.slice(0, 2).map((revenue) => (
                  <Text
                    key={revenue.currency}
                    size="xs"
                    tone="subtle"
                    className="tabular-nums"
                  >
                    {revenue.currency === "UNSPECIFIED"
                      ? t("plans.list.table.revenueCurrencyMissing")
                      : t("plans.list.table.mrr", {
                          amount: formatMoney(revenue.amount, revenue.currency),
                        })}
                  </Text>
                ))}
                {plan.recurringRevenue.length > 2 && (
                  <Text size="xs" tone="subtle">
                    {t("plans.list.table.moreCurrencies", {
                      count: plan.recurringRevenue.length - 2,
                    })}
                  </Text>
                )}
              </div>
            ) : (
              <Text size="xs" tone="subtle" className="mt-1">
                {t("plans.list.table.noActiveMrr")}
              </Text>
            )}
          </div>
        ),
      },
      {
        key: "updated",
        header: t("plans.list.table.updated"),
        sortable: true,
        render: (plan) => (
          <div className="min-w-28">
            <Text as="div" size="sm" weight="medium">
              <time
                dateTime={plan.updatedAt}
                title={formatDateTime(plan.updatedAt, t)}
              >
                {plan.updatedRelative}
              </time>
            </Text>
            <Text size="xs" tone="subtle" className="mt-1">
              {t("plans.list.table.order", { value: formatNumber(plan.sortOrder) })}
            </Text>
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (plan) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  label={t("plans.list.table.actionsFor", { name: plan.name })}
                  variant="ghost"
                  size="sm"
                >
                  <MoreHorizontal className="size-4" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <LocalizedLink href={`/plans/${plan.id}`}>
                    <ExternalLink className="size-4 text-neutral-400" />
                    {t("plans.list.table.viewPlan")}
                  </LocalizedLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void navigator.clipboard.writeText(plan.id)}
                >
                  <Copy className="size-4 text-neutral-400" />
                  {t("plans.list.table.copyPlanId")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t],
  );

  const handleSortChange = (key: string) => {
    if (key !== "name" && key !== "updated") return;

    const nextDirection =
      filters.sort === key && filters.direction === "asc" ? "desc" : "asc";
    replaceParams({
      sort: key,
      direction: nextDirection,
      page: undefined,
    });
  };

  if (items.length === 0) {
    const hasCatalogData = catalogPlanCount > 0;

    return (
      <EmptyState
        icon={<Layers3 className="size-5" />}
        title={
          hasCatalogData
            ? t("plans.list.empty.titleHasCatalog")
            : t("plans.list.empty.titleNoCatalog")
        }
        description={
          hasCatalogData
            ? t("plans.list.empty.descriptionHasCatalog")
            : t("plans.list.empty.descriptionNoCatalog")
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {hasCatalogData && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.replace(localePrefix(locale, pathname), { scroll: false })
                }
              >
                {t("plans.list.empty.clearAllFilters")}
              </Button>
            )}
            <LocalizedLink
              href="/plans/new"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Plus className="size-3.5" />
              {t("plans.common.createPlan")}
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
        sortKey={filters.sort === "order" ? undefined : filters.sort}
        sortDirection={filters.direction}
        onSortChange={handleSortChange}
        footer={
          <>
            <Text size="xs" tone="muted">
              {t("plans.list.footer.showing", {
                first: formatNumber(firstItem),
                last: formatNumber(lastItem),
                total: formatNumber(totalItems),
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
