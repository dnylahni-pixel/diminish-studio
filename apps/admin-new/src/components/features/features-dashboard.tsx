"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  type Column,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
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
import { Checkbox } from "@appica/ui-react/checkbox";
import { Badge } from "@appica/ui-react/badge";
import { Input } from "@appica/ui-react/input";
import { Button } from "@appica/ui-react/button";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import { Loader } from "@appica/ui-react/loader";
import { Spinner } from "@appica/ui-react/spinner";
import { useToastManager } from "@appica/ui-react/toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleCheck,
  EllipsisVertical,
  Eye,
  Columns2,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { archiveFeature } from "@/features/features/actions";
import type {
  FeatureEditData,
  FeatureListItem,
  FeaturesListData,
} from "@/features/features/types";
import { translate, type FeaturesKey } from "@/i18n/features";
import { kindIcon } from "./kind";
import type { FeatureOption } from "./types";
import { FeatureCreateDialog } from "./feature-create-dialog";

interface FeaturesDashboardProps {
  data: FeaturesListData;
  availableFeatures: FeatureOption[];
  editableFeatures: FeatureEditData[];
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<FeatureListItem>;
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

interface RowActionsProps {
  feature: FeatureListItem;
  onEdit: (feature: FeatureListItem) => void;
  onArchive: (feature: FeatureListItem) => void;
}

function RowActions({ feature, onEdit, onArchive }: RowActionsProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const t = (key: FeaturesKey) => translate(locale, key);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("list.colActions")}
          >
            <EllipsisVertical />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(`/features/${feature.id}`)}
          >
            <Eye data-icon="start" />
            {t("list.viewDetails")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(feature)}>
            <Pencil data-icon="start" />
            {t("list.edit")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-error-emphasis! data-highlighted:before:bg-error-subtle!"
          onClick={() => onArchive(feature)}
        >
          <Trash data-icon="start" />
          {t("list.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FeaturesDashboard({
  data,
  availableFeatures,
  editableFeatures,
}: FeaturesDashboardProps) {
  const { locale } = useLocale();
  const t = (key: FeaturesKey) => translate(locale, key);
  const router = useRouter();
  const toast = useToastManager();
  const pathname = usePathname();
  const [isNavigating, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editFeature, setEditFeature] = useState<FeatureEditData | null>(null);
  const [archiveTarget, setArchiveTarget] =
    useState<FeatureListItem | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>(() => [
    { id: data.filters.sort, desc: data.filters.direction === "desc" },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    limitPolicyCount: false,
    pricingRuleCount: false,
    usage: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.max(0, data.filters.page - 1),
    pageSize: data.filters.pageSize,
  });
  const [query, setQuery] = useState(data.filters.q);

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if (query === data.filters.q) return;
      const params = new URLSearchParams(window.location.search);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      params.delete("page");
      navigate(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, data.filters.q, pathname]);

  const editById = new Map(
    editableFeatures.map((feature) => [feature.id, feature]),
  );

  const columns: ColumnDef<FeatureListItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked === true)
          }
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("list.colName")}</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground-intense font-medium">
            {row.original.name}
          </span>
          {row.original.description ? (
            <span className="text-foreground-muted max-w-64 truncate text-xs">
              {row.original.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: t("list.colCode"),
      cell: ({ row }) => (
        <code className="font-mono text-xs">{row.original.code}</code>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "kind",
      header: t("list.colKind"),
      cell: ({ row }) => {
        const Icon = kindIcon(row.original.kind);
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon
              className="text-foreground-muted size-3.5"
              aria-hidden
            />
            {t(`kind.${row.original.kind}Label` as FeaturesKey)}
            {row.original.unitName ? (
              <span className="text-foreground-muted text-xs">
                ({row.original.unitName})
              </span>
            ) : null}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "isActive",
      header: t("list.colStatus"),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "outline"}>
          {row.original.isActive
            ? t("list.statusActive")
            : t("list.statusInactive")}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "planCount",
      header: t("list.colPlans"),
      cell: ({ row }) => row.original.planCount,
      enableSorting: false,
    },
    {
      accessorKey: "dependencyCount",
      header: t("list.colDependencies"),
      cell: ({ row }) => row.original.dependencyCount,
      enableSorting: false,
    },
    {
      accessorKey: "limitPolicyCount",
      header: t("list.colLimits"),
      cell: ({ row }) => row.original.limitPolicyCount,
      enableSorting: false,
    },
    {
      accessorKey: "pricingRuleCount",
      header: t("list.colPricing"),
      cell: ({ row }) => row.original.pricingRuleCount,
      enableSorting: false,
    },
    {
      id: "usage",
      header: t("list.colUsage"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>
            {row.original.usageQuantity30d}
            {row.original.unitName ? ` ${row.original.unitName}` : ""}
          </span>
          <span className="text-foreground-muted text-xs">
            {t("list.usageCredits")}: {row.original.usageCredits30d}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "updatedRelative",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("list.colUpdated")}
        </SortableHeader>
      ),
      cell: ({ row }) => row.original.updatedRelative,
    },
    {
      id: "actions",
      header: t("list.colActions"),
      cell: ({ row }) => (
        <RowActions
          feature={row.original}
          onEdit={(feature) => {
            const editData = editById.get(feature.id);
            if (editData) setEditFeature(editData);
          }}
          onArchive={(feature) => {
            setArchiveError(null);
            setArchiveTarget(feature);
          }}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: data.items,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination },
    manualPagination: true,
    manualSorting: true,
    pageCount: data.pageCount,
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      const sort = next[0]?.id ?? "";
      const params = new URLSearchParams(window.location.search);
      if (sort === "name" || sort === "updated" || sort === "usage") {
        params.set("sort", sort);
        params.set("direction", next[0]?.desc ? "desc" : "asc");
      } else {
        params.delete("sort");
        params.delete("direction");
      }
      params.set("page", "1");
      navigate(`${pathname}?${params.toString()}`);
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(next.pageIndex + 1));
      navigate(`${pathname}?${params.toString()}`);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const totalCount = data.totalItems;
  const columnLabel: Record<string, string> = {
    name: t("list.colName"),
    code: t("list.colCode"),
    kind: t("list.colKind"),
    isActive: t("list.colStatus"),
    planCount: t("list.colPlans"),
    dependencyCount: t("list.colDependencies"),
    limitPolicyCount: t("list.colLimits"),
    pricingRuleCount: t("list.colPricing"),
    usage: t("list.colUsage"),
    updatedRelative: t("list.colUpdated"),
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    setArchiveError(null);
    startTransition(async () => {
      const result = await archiveFeature(archiveTarget.id);
      if (result.ok) {
        setArchiveTarget(null);
        router.refresh();
        toast.add({
          title: t("list.deleteSuccess"),
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
      } else {
        setArchiveError(t("list.deleteError"));
      }
    });
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground-intense text-2xl font-bold">
            {t("list.title")}
          </h1>
          <p className="text-foreground-muted mt-1 text-sm">
            {t("list.subtitle")}
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="start" className="size-4" />
          {t("list.add")}
        </Button>
      </div>

      <div className="mt-6 flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder={t("list.searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startSlot={<Search className="text-foreground-muted size-4" />}
              clearable
              onClear={() => setQuery("")}
              className="sm:w-80"
            />
            {isNavigating && (
              <span
                className="text-foreground-muted inline-flex items-center gap-2 text-sm"
                role="status"
              >
                <Loader variant="dots" currentColor className="text-lg" />
                {t("list.loading")}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="group/columns"
              render={
                <Button variant="outline">
                  <Columns2 data-icon="start" />
                  {t("list.columns")}
                  <ChevronDown
                    data-icon="end"
                    className="transition-transform duration-200 ease-out group-data-popup-open/columns:rotate-180 motion-reduce:transition-none"
                  />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>
                  {t("list.columns")}
                </DropdownMenuGroupLabel>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value === true)
                      }
                    >
                      {columnLabel[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
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
                    <TableRow key={row.id} highlighted={row.getIsSelected()}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-foreground-muted h-24 text-center"
                    >
                      {t("list.noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground-muted text-sm">
            {t("list.selectedRows")
              .replace("{selected}", String(selectedCount))
              .replace("{total}", String(totalCount))}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-sm">
              {t("list.pageOf")
                .replace("{page}", String(pagination.pageIndex + 1))
                .replace("{pages}", String(data.pageCount))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage() || isNavigating}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft data-icon="start" className="-ms-1" />
              {t("list.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage() || isNavigating}
              onClick={() => table.nextPage()}
            >
              {t("list.next")}
              <ChevronRight data-icon="end" className="-me-1" />
            </Button>
          </div>
        </div>
      </div>

      <FeatureCreateDialog
        open={createOpen || editFeature !== null}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditFeature(null);
        }}
        availableFeatures={availableFeatures}
        editingFeature={editFeature}
      />

      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveTarget(null);
            setArchiveError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("list.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("list.deleteConfirmBody").replace(
                "{name}",
                archiveTarget?.name ?? "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiveError && (
            <p className="text-error px-6 text-sm" role="alert">
              {archiveError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost">{t("dialog.back")}</Button>} />
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <Spinner currentColor className="text-[1.2em]" />
              ) : (
                <Trash data-icon="start" className="size-4" />
              )}
              {t("list.deleteConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
