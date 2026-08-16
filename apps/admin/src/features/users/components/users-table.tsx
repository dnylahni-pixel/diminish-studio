"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/actions";
import {
  Avatar,
  Badge,
  DataTable,
  type DataTableColumn,
  StatusIndicator,
} from "@/components/ui/data-display";
import { EmptyState, Progress } from "@/components/ui/feedback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
} from "@/components/ui/navigation";
import { NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import type { UserRowData, UsersFilters } from "../list-types";
import {
  formatBytes,
  formatDate,
  formatNumber,
  subscriptionTone,
  titleize,
} from "../formatters";

export function UsersTable({
  items,
  filters,
  totalItems,
  pageCount,
}: {
  items: UserRowData[];
  filters: UsersFilters;
  totalItems: number;
  pageCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const statusLabel = (status: string) => {
    const known: Record<string, MessageKey> = {
      active: "users.enums.active",
      trialing: "users.enums.trialing",
      past_due: "users.enums.pastDue",
      paused: "users.enums.paused",
      canceled: "users.enums.canceled",
      expired: "users.enums.expired",
      none: "users.enums.none",
    };
    return known[status] ? t(known[status]) : titleize(status);
  };

  const replaceParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const columns = useMemo<DataTableColumn<UserRowData>[]>(
    () => [
      {
        key: "username",
        header: t("users.table.col.user"),
        sortable: true,
        render: (user) => (
          <div className="flex min-w-64 items-center gap-3">
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.username}
              fallback={user.username.slice(0, 2).toUpperCase()}
              size="md"
            />
            <div className="min-w-0">
              <LocalizedLink
                href={`/users/${user.id}`}
                className="block truncate font-semibold text-neutral-900 hover:text-primary-700 hover:underline hover:underline-offset-4"
              >
                {user.username}
              </LocalizedLink>
              <Text size="xs" tone="muted" className="truncate">
                {user.email} · #{user.id}
              </Text>
            </div>
          </div>
        ),
      },
      {
        key: "subscription",
        header: t("users.table.col.commercialState"),
        render: (user) =>
          user.subscription ? (
            <div className="min-w-40 space-y-1.5">
              <StatusIndicator
                tone={subscriptionTone(user.subscription.status)}
                label={statusLabel(user.subscription.status)}
                pulse={user.subscription.status === "active"}
              />
              <Text size="xs" tone="subtle">
                {user.subscription.plan.name}
              </Text>
            </div>
          ) : (
            <div>
              <StatusIndicator tone="neutral" label={t("users.table.noSubscription")} />
              <Text size="xs" tone="subtle" className="mt-1">
                {t("users.table.noCommercialHistory")}
              </Text>
            </div>
          ),
      },
      {
        key: "creditBalance",
        header: t("users.table.col.availableCredit"),
        sortable: true,
        align: "right",
        render: (user) =>
          user.credit ? (
            <div className="min-w-32 text-end">
              <NumericText size="sm">
                {formatNumber(user.credit.availableBalance)}
              </NumericText>
              <div className="mt-1 flex justify-end gap-1.5">
                <Badge
                  tone={user.credit.status === "active" ? "success" : "warning"}
                  size="sm"
                >
                  {statusLabel(user.credit.status)}
                </Badge>
                {user.credit.reservedBalance > 0 && (
                  <Text size="xs" tone="subtle">
                    {t("users.table.held", {
                      count: formatNumber(user.credit.reservedBalance),
                    })}
                  </Text>
                )}
              </div>
            </div>
          ) : (
            <Text size="sm" tone="subtle">
              {t("users.table.noWallet")}
            </Text>
          ),
      },
      {
        key: "storage",
        header: t("users.table.col.storage"),
        render: (user) => {
          const utilization =
            user.storageQuotaBytes > 0
              ? Math.min(
                  100,
                  Math.round(
                    (user.storageUsedBytes / user.storageQuotaBytes) * 100,
                  ),
                )
              : 0;
          return (
            <div className="min-w-40">
              <div className="flex justify-between gap-3">
                <Text size="xs" tone="muted">
                  {formatBytes(user.storageUsedBytes)}
                </Text>
                <Text size="xs" tone="subtle">
                  {utilization}%
                </Text>
              </div>
              <Progress value={utilization} size="sm" />
            </div>
          );
        },
      },
      {
        key: "createdAt",
        header: t("users.table.col.joined"),
        sortable: true,
        render: (user) => (
          <div className="min-w-28">
            <Text size="sm">{formatDate(user.createdAt)}</Text>
            <Text size="xs" tone="subtle" className="mt-1">
              {user.subscription?.currentPeriodEnd
                ? t("users.table.renews", {
                    date: formatDate(user.subscription.currentPeriodEnd),
                  })
                : t("users.table.noRenewal")}
            </Text>
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label={t("users.table.actionsFor", { name: user.username })} variant="ghost" size="sm">
                <MoreHorizontal className="size-4" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <LocalizedLink href={`/users/${user.id}`}>
                  <ExternalLink className="size-4" />
                  {t("users.table.openUser360")}
                </LocalizedLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t],
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("users.table.emptyTitle")}
        description={t("users.table.emptyDescription")}
      />
    );
  }

  return (
    <div className={isPending ? "opacity-70" : undefined}>
      <DataTable
        columns={columns}
        data={items}
        sortKey={filters.sort}
        sortDirection={filters.direction}
        onSortChange={(key) => {
          const direction =
            filters.sort === key && filters.direction === "asc" ? "desc" : "asc";
          replaceParams({ sort: key, direction, page: undefined });
        }}
        footer={
          <>
            <Text size="xs" tone="muted">
              {t("users.table.matchingUsers", {
                count: formatNumber(totalItems),
              })}
            </Text>
            <div className="flex items-center gap-3">
              <div className="min-w-24">
                <select
                  value={filters.pageSize}
                  onChange={(event) =>
                    replaceParams({
                      pageSize: event.target.value,
                      page: undefined,
                    })
                  }
                  className="h-8 rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-0 px-2 text-xs text-neutral-700"
                  aria-label={t("common.rowsPerPage")}
                >
                  <option value="25">{t("users.table.pageSize", { size: "25" })}</option>
                  <option value="50">{t("users.table.pageSize", { size: "50" })}</option>
                  <option value="100">{t("users.table.pageSize", { size: "100" })}</option>
                </select>
              </div>
              <Pagination
                page={filters.page}
                pageCount={pageCount}
                onPageChange={(page) =>
                  replaceParams({ page: page === 1 ? undefined : String(page) })
                }
                previousLabel={t("common.previous")}
                nextLabel={t("common.next")}
              />
            </div>
          </>
        }
      />
    </div>
  );
}
