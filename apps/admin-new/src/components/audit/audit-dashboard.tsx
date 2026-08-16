"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  type Column,
  type ColumnDef,
  type ExpandedState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@appica/ui-react/table";
import { ScrollArea } from "@appica/ui-react/scroll-area";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Spinner } from "@appica/ui-react/spinner";
import { useToastManager } from "@appica/ui-react/toast";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@appica/ui-react/alert-dialog";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Clock,
  History,
  RotateCw,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { restoreSettingVersion } from "@/features/audit/actions";
import type {
  AuditListData,
  AuditVersionRow,
  DiffEntry,
} from "@/features/audit/types";
import { translate, type AuditKey } from "@/i18n/audit";

/** Client-side relative-time formatting (mirrors the Settings workspace). */
function formatRelativeTime(
  iso: string,
  locale: "fa" | "en",
  justNow: string,
): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 60) return justNow;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, divisor] of units) {
    if (absolute >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }
  return justNow;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<AuditVersionRow>;
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="hover:text-foreground-intense focus-visible:outline-ring rounded-3xs -mx-1 inline-flex cursor-pointer items-center gap-1 px-1 outline-offset-2 focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.85]"
    >
      {children}
      {sorted === "asc" ? (
        <ChevronUp />
      ) : sorted === "desc" ? (
        <ChevronDown />
      ) : (
        <ChevronsUpDown className="text-foreground-muted" />
      )}
    </button>
  );
}

/** Expandable before→after diff for a single version row. */
function VersionDiff({ diff }: { diff: DiffEntry[] }) {
  const { locale } = useLocale();
  const t = (key: AuditKey) => translate(locale, key);

  return (
    <div className="bg-background-muted border-border-muted rounded-md border px-4 py-3">
      <p className="text-foreground-muted text-xs font-medium">
        {t("diff.title")}
      </p>
      {diff.length === 0 ? (
        <p className="text-foreground-muted mt-2 text-xs">{t("diff.empty")}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2.5">
          {diff.map((entry) => (
            <div
              key={entry.path}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-3 text-xs"
            >
              <code className="text-foreground-muted font-mono leading-6">
                {entry.path}
              </code>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground-muted leading-5">
                  {t("diff.before")}
                </span>
                <span className="text-error break-words leading-5 line-through decoration-error/40">
                  {entry.before}
                </span>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground-muted leading-5">
                  {t("diff.after")}
                </span>
                <span className="text-success break-words leading-5">
                  {entry.after}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Audit & Versions workspace — version history of `settings_versions` as a
 * TanStack + Appica data table with expandable before→after diffs and a
 * Restore action (behind an AlertDialog confirm) that replays an old value as a
 * new version. Mounted inside the Review Lab's Audit tab (not a final route).
 */
export function AuditDashboard({ data }: { data: AuditListData }) {
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToastManager();
  const t = (key: AuditKey) => translate(locale, key);
  const [isRestoring, startTransition] = useTransition();
  const [sorting, setSorting] = useState<SortingState>(() => [
    { id: "changedAt", desc: true },
  ]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [restoreTarget, setRestoreTarget] =
    useState<AuditVersionRow | null>(null);
  const columns: ColumnDef<AuditVersionRow>[] = [
    {
      id: "expand",
      header: () => <span className="sr-only">{t("table.colExpand")}</span>,
      cell: ({ row }) => {
        const isExpanded = row.getIsExpanded();
        return (
          <button
            type="button"
            aria-label={t("table.colExpand")}
            aria-expanded={isExpanded}
            onClick={() => row.toggleExpanded()}
            className="text-foreground-muted hover:text-foreground-intense focus-visible:outline-ring inline-flex size-7 cursor-pointer items-center justify-center rounded-md outline-offset-2 focus-visible:outline-2"
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "key",
      header: t("table.colKey"),
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-0.5">
          <code className="font-mono text-xs">{row.original.key}</code>
          {row.original.isCurrent ? (
            <Badge variant="success" size="sm">
              {t("table.currentBadge")}
            </Badge>
          ) : null}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "versionNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("table.colVersion")}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <code className="font-mono text-xs">v{row.original.versionNumber}</code>
      ),
    },
    {
      accessorKey: "changedBy",
      header: t("table.colChangedBy"),
      cell: ({ row }) => (
        <span className="text-foreground-emphasis text-sm">
          {row.original.changedBy}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "changedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("table.colChangedAt")}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-foreground-muted text-sm">
          {formatRelativeTime(row.original.changedAt, locale, t("meta.justNow"))}
        </span>
      ),
    },
    {
      accessorKey: "changeReason",
      header: t("table.colReason"),
      cell: ({ row }) => (
        <span
          className="text-foreground-muted max-w-56 truncate text-sm"
          title={row.original.changeReason ?? undefined}
        >
          {row.original.changeReason ?? t("table.noReason")}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      header: t("table.colActions"),
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={row.original.isCurrent || isRestoring}
          title={
            row.original.isCurrent ? t("restore.currentDisabled") : undefined
          }
          onClick={() => {
            setRestoreTarget(row.original);
          }}
        >
          <RotateCw data-icon="start" className="size-4" />
          {t("restore.confirm")}
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: data.versions,
    columns,
    state: { sorting, expanded, pagination },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getRowId: (row) => `${row.key}:${row.versionNumber}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true,
  });

  const handleRestore = () => {
    if (!restoreTarget) return;
    startTransition(async () => {
      const result = await restoreSettingVersion(
        restoreTarget.key,
        restoreTarget.versionNumber,
        locale,
      );
      if (result.status === "success") {
        setRestoreTarget(null);
        router.refresh();
        toast.add({
          title: t("restore.success").replace(
            "{version}",
            String(restoreTarget.versionNumber),
          ),
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
        return;
      }
      toast.add({
        title: result.message,
        data: { icon: <CircleX className="text-error-emphasis" /> },
        priority: "high",
      });
    });
  };

  const pageCount = Math.max(1, table.getPageCount());

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-foreground-intense text-2xl font-bold">
              {t("page.title")}
            </h1>
            <Badge variant="outline">
              <History data-icon="start" className="size-3.5" />
              {t("summary.versions").replace(
                "{count}",
                String(data.totals.versionCount),
              )}
            </Badge>
            <Badge variant="outline">
              <Clock data-icon="start" className="size-3.5" />
              {t("summary.auditEntries").replace(
                "{count}",
                String(data.totals.auditEntryCount),
              )}
            </Badge>
          </div>
          <p className="text-foreground-muted mt-1 max-w-2xl text-sm">
            {t("page.subtitle")}
          </p>
        </div>
      </div>

      <div className="mt-6 w-full overflow-hidden rounded-lg border border-border bg-background">
        <ScrollArea
          orientation="horizontal"
          scrollbarVisibility="auto"
          className="w-full [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
        >
          <Table hoverableRows className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() ? (
                      <TableRow className="border-border-muted">
                        <TableCell
                          colSpan={columns.length}
                          className="bg-background-muted px-4 py-3"
                        >
                          <VersionDiff diff={row.original.diff} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-foreground-muted h-24 text-center"
                  >
                    {t("table.noVersions")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {table.getRowModel().rows.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground-muted text-sm">
            {t("table.pageOf")
              .replace("{page}", String(pagination.pageIndex + 1))
              .replace("{pages}", String(pageCount))}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft data-icon="start" className="-ms-1" />
              {t("table.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              {t("table.next")}
              <ChevronRight data-icon="end" className="-me-1" />
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("restore.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("restore.description")
                .replace("{key}", restoreTarget?.key ?? "")
                .replace("{version}", String(restoreTarget?.versionNumber ?? ""))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="ghost">{t("restore.cancel")}</Button>}
            />
            <Button
              variant="primary"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Spinner currentColor className="text-[1.2em]" />
              ) : (
                <RotateCw data-icon="start" className="size-4" />
              )}
              {t("restore.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
