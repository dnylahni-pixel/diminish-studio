"use client";

import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  type Column,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Chip, ChipGroup } from "@appica/ui-react/chip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@appica/ui-react/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import { Input } from "@appica/ui-react/input";
import { ScrollArea } from "@appica/ui-react/scroll-area";
import { Spinner } from "@appica/ui-react/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@appica/ui-react/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@appica/ui-react/tabs";
import { Thumbnail } from "@appica/ui-react/thumbnail";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@appica/ui-react/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@appica/ui-react/alert-dialog";
import { useToastManager } from "@appica/ui-react/toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Copy,
  Database,
  EllipsisVertical,
  Gauge,
  Info,
  Columns2,
  Package,
  Pencil,
  Plus,
  Rocket,
  Search,
  Trash,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { kindIcon } from "@/components/features/kind";
import {
  archivePlan,
  clonePlan,
  createDraftVersion,
  publishVersion,
} from "@/features/plans/actions";
import type {
  FeaturePolicyItem,
  FeatureWorkspaceItem,
  PlanPriceWorkspaceItem,
  PlanStatus,
  PlanWorkspaceItem,
  PlanWorkspaceVersion,
  PlansWorkspaceData,
} from "@/features/plans/types";
import { translate, type PlansKey } from "@/i18n/plans";
import { cn } from "@/lib/utils";
import { PlanLimitDialog } from "./plan-limit-dialog";
import { PlanFormDialog } from "./plan-form-dialog";
import { PlanCreatePanel } from "./plan-create-panel";

interface PlansDashboardProps {
  data: PlansWorkspaceData;
}

interface EditingState {
  planVersion: PlanWorkspaceVersion;
  feature: FeatureWorkspaceItem;
  policy: FeaturePolicyItem;
}

interface PolicyRow {
  feature: FeatureWorkspaceItem;
  policy: FeaturePolicyItem;
}

type PlanStatusFilter = "all" | PlanStatus;

const STATUS_FILTERS: PlanStatusFilter[] = [
  "all",
  "draft",
  "active",
  "archived",
];

function emptyPolicy(
  planVersionId: string,
  featureId: string,
): FeaturePolicyItem {
  return {
    planVersionId,
    featureId,
    isIncluded: null,
    limitValue: null,
    period: null,
    behavior: null,
    overageUnitPrice: null,
    metric: null,
    pricingModel: null,
    currency: null,
    unitPrice: null,
    creditCostPerUnit: null,
    minimumCharge: null,
  };
}

function formatDate(iso: string, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function formatPrice(
  price: PlanPriceWorkspaceItem,
  locale: "fa" | "en",
  t: (key: PlansKey) => string,
) {
  const amount = (Number(price.amount) / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (price.priceType === "one_time") {
    return `${amount} ${price.currency} · ${t("values.oneTime")}`;
  }
  const count = price.billingIntervalCount ?? 1;
  const interval = t(`interval.${price.billingInterval ?? "month"}` as PlansKey);
  return `${amount} ${price.currency} / ${count} ${interval}`;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<PolicyRow>;
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

function VersionMeta({
  version,
  locale,
}: {
  version: PlanWorkspaceVersion;
  locale: "fa" | "en";
}) {
  const t = (key: PlansKey) => translate(locale, key);
  return (
    <div className="border-border bg-background-subtle rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-foreground-intense text-sm font-medium">
          {version.title ?? t("version.noTitle")}
        </span>
        {version.effectiveFrom ? (
          <span className="text-foreground-muted text-xs">
            {t("version.effectiveFrom")}:{" "}
            {formatDate(version.effectiveFrom, locale)}
          </span>
        ) : null}
        {version.effectiveTo ? (
          <span className="text-foreground-muted text-xs">
            {t("version.effectiveTo")}: {formatDate(version.effectiveTo, locale)}
          </span>
        ) : null}
      </div>
      <Collapsible className="mt-2">
        <CollapsibleTrigger className="group text-foreground-muted hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs">
          {t("version.changeNotes")}
          <ChevronDown className="size-3.5 transition-transform duration-200 group-data-panel-open:rotate-180 motion-reduce:transition-none" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-foreground-muted pt-1 text-sm">
            {version.changeNotes ?? t("version.noChangeNotes")}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PlanPolicyTable({
  version,
  features,
  policies,
  onEdit,
}: {
  version: PlanWorkspaceVersion;
  features: FeatureWorkspaceItem[];
  policies: FeaturePolicyItem[];
  onEdit: (feature: FeatureWorkspaceItem, policy: FeaturePolicyItem) => void;
}) {
  const { locale } = useLocale();
  const t = (key: PlansKey) => translate(locale, key);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    overage: false,
    behavior: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const policyByKey = useMemo(() => {
    const map = new Map<string, FeaturePolicyItem>();
    for (const policy of policies) {
      map.set(`${policy.planVersionId}:${policy.featureId}`, policy);
    }
    return map;
  }, [policies]);

  const rows = useMemo(
    () =>
      features.map((feature) => ({
        feature,
        policy:
          policyByKey.get(`${version.id}:${feature.id}`) ??
          emptyPolicy(version.id, feature.id),
      })),
    [features, version.id, policyByKey],
  );

  const columns: ColumnDef<PolicyRow>[] = [
    {
      id: "feature",
      accessorFn: (row) => row.feature.name,
      header: ({ column }) => (
        <SortableHeader column={column}>{t("table.feature")}</SortableHeader>
      ),
      cell: ({ row }) => {
        const Icon = kindIcon(row.original.feature.kind);
        return (
          <div className="flex items-center gap-3">
            <Thumbnail size="sm" variant="icon-soft">
              <Icon className="size-4" aria-hidden />
            </Thumbnail>
            <div className="flex flex-col">
              <span className="text-foreground-intense text-sm font-medium">
                {row.original.feature.name}
              </span>
              <code className="text-foreground-muted font-mono text-xs">
                {row.original.feature.code}
              </code>
            </div>
          </div>
        );
      },
    },
    {
      id: "kind",
      accessorFn: (row) => row.feature.kind,
      header: t("table.kind"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {t(`kind.${row.original.feature.kind}` as PlansKey)}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      id: "access",
      accessorFn: (row) => row.policy.isIncluded,
      header: t("table.access"),
      cell: ({ row }) => {
        const { policy } = row.original;
        if (policy.isIncluded === null) {
          return <Badge variant="outline">{t("values.inherit")}</Badge>;
        }
        return policy.isIncluded ? (
          <Badge variant="success">{t("values.allow")}</Badge>
        ) : (
          <Badge variant="warning">{t("values.deny")}</Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: "limit",
      accessorFn: (row) => row.policy.limitValue,
      header: ({ column }) => (
        <SortableHeader column={column}>{t("table.limit")}</SortableHeader>
      ),
      cell: ({ row }) => {
        const { feature, policy } = row.original;
        if (policy.limitValue === null) {
          return <span className="text-foreground-muted">{t("values.unlimited")}</span>;
        }
        return (
          <span className="text-foreground-intense font-medium">
            {policy.limitValue}
            {feature.unitName ? (
              <span className="text-foreground-muted"> {feature.unitName}</span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "period",
      accessorFn: (row) => row.policy.period,
      header: t("table.period"),
      cell: ({ row }) =>
        row.original.policy.period &&
        row.original.policy.period !== "none"
          ? t(`period.${row.original.policy.period}` as PlansKey)
          : "—",
      enableSorting: false,
    },
    {
      id: "behavior",
      accessorFn: (row) => row.policy.behavior,
      header: t("table.behavior"),
      cell: ({ row }) => {
        const { behavior } = row.original.policy;
        if (!behavior) return "—";
        return behavior === "allow_overage"
          ? t("values.allowOverage")
          : t("values.block");
      },
      enableSorting: false,
    },
    {
      id: "overage",
      accessorFn: (row) => row.policy.overageUnitPrice,
      header: t("table.overage"),
      cell: ({ row }) => row.original.policy.overageUnitPrice ?? "—",
      enableSorting: false,
    },
    {
      id: "pricing",
      accessorFn: (row) => row.policy.metric,
      header: t("table.pricing"),
      cell: ({ row }) => {
        const { policy } = row.original;
        if (policy.metric === null) {
          return <span className="text-foreground-muted">{t("values.free")}</span>;
        }
        return (
          <span className="flex flex-col">
            <span>{t(`metric.${policy.metric}` as PlansKey)}</span>
            <span className="text-foreground-muted text-xs">
              {policy.unitPrice ?? "0"} {policy.currency ?? ""}
              {policy.creditCostPerUnit
                ? ` · ${policy.creditCostPerUnit} cr`
                : ""}
            </span>
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("actions.edit")}
              >
                <EllipsisVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(row.original.feature, row.original.policy)}
            >
              <Pencil data-icon="start" />
              {t("actions.edit")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const columnLabel: Record<string, string> = {
    feature: t("table.feature"),
    kind: t("table.kind"),
    access: t("table.access"),
    limit: t("table.limit"),
    period: t("table.period"),
    behavior: t("table.behavior"),
    overage: t("table.overage"),
    pricing: t("table.pricing"),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={t("table.searchPlaceholder")}
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          startSlot={<Search className="text-foreground-muted size-4" />}
          clearable
          onClear={() => setGlobalFilter("")}
          className="sm:w-80"
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group/columns"
            render={
              <Button variant="outline">
                <Columns2 data-icon="start" />
                {t("table.columns")}
                <ChevronDown
                  data-icon="end"
                  className="transition-transform duration-200 ease-out group-data-popup-open/columns:rotate-180 motion-reduce:transition-none"
                />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-border">
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
                  <TableRow key={row.original.feature.id}>
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
                    {t("table.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-foreground-muted text-sm">
          {t("table.pageOf")
            .replace("{page}", String(table.getState().pagination.pageIndex + 1))
            .replace("{pages}", String(table.getPageCount()))}
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
    </div>
  );
}

export function PlansDashboard({ data }: PlansDashboardProps) {
  const { locale } = useLocale();
  const t = (key: PlansKey) => translate(locale, key);
  const router = useRouter();
  const toast = useToastManager();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatusFilter>("all");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    data.plans[0]?.id ?? null,
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [publishTarget, setPublishTarget] = useState<{
    plan: PlanWorkspaceItem;
    version: PlanWorkspaceVersion;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isPublishing, startPublishTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanWorkspaceItem | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] =
    useState<PlanWorkspaceItem | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiving, startArchiveTransition] = useTransition();

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (!q) return true;
      return (
        plan.name.toLowerCase().includes(q) ||
        plan.code.toLowerCase().includes(q) ||
        (plan.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [data.plans, query, statusFilter]);

  const selectedPlan =
    filteredPlans.find((plan) => plan.id === selectedPlanId) ??
    filteredPlans[0] ??
    null;
  const selectedVersion =
    selectedPlan?.versions.find(
      (version) => version.id === selectedVersionId,
    ) ??
    selectedPlan?.versions[0] ??
    null;

  const policyByKey = useMemo(() => {
    const map = new Map<string, FeaturePolicyItem>();
    for (const policy of data.policies) {
      map.set(`${policy.planVersionId}:${policy.featureId}`, policy);
    }
    return map;
  }, [data.policies]);

  const policyFor = (planVersionId: string, featureId: string) =>
    policyByKey.get(`${planVersionId}:${featureId}`) ??
    emptyPolicy(planVersionId, featureId);

  const selectPlan = (plan: PlanWorkspaceItem) => {
    setIsCreating(false);
    setSelectedPlanId(plan.id);
    setSelectedVersionId(plan.versions[0]?.id ?? null);
  };

  const statusVariant = (status: PlanWorkspaceItem["status"]) =>
    status === "active"
      ? "success"
      : status === "draft"
        ? "warning"
        : "outline";

  const versionStatusVariant = (status: PlanWorkspaceVersion["status"]) =>
    status === "published"
      ? "success"
      : status === "draft"
        ? "warning"
        : "outline";

  const handleCreateDraft = async (
    plan: PlanWorkspaceItem,
    version: PlanWorkspaceVersion,
  ) => {
    setIsCreatingDraft(true);
    try {
      const result = await createDraftVersion({
        planId: plan.id,
        sourceVersionId: version.id,
        locale,
      });
      if (result.status === "success" && result.versionId) {
        setSelectedVersionId(result.versionId);
        router.refresh();
        toast.add({
          title: result.message,
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
      } else {
        toast.add({
          title: result.message,
          data: {
            icon: <CircleX className="text-error-emphasis" />,
          },
        });
      }
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleClone = async (plan: PlanWorkspaceItem) => {
    setIsCloning(true);
    try {
      const result = await clonePlan(plan.id, locale);
      if (result.status === "success" && result.planId) {
        setSelectedPlanId(result.planId);
        setSelectedVersionId(null);
        router.refresh();
        toast.add({
          title: result.message,
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
      } else {
        toast.add({
          title: result.message,
          data: {
            icon: <CircleX className="text-error-emphasis" />,
          },
        });
      }
    } finally {
      setIsCloning(false);
    }
  };

  const handleSaved = (message: string, versionId?: string) => {
    setEditing(null);
    if (versionId) setSelectedVersionId(versionId);
    router.refresh();
    toast.add({
      title: message,
      data: { icon: <CircleCheck className="text-success-emphasis" /> },
    });
  };

  const handlePublish = () => {
    if (!publishTarget) return;
    setPublishError(null);
    startPublishTransition(async () => {
      const result = await publishVersion({
        planId: publishTarget.plan.id,
        versionId: publishTarget.version.id,
        locale,
      });
      if (result.status === "success") {
        setPublishTarget(null);
        router.refresh();
        toast.add({
          title: result.message,
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
      } else {
        setPublishError(result.message);
      }
    });
  };

  const handlePlanSaved = (message: string) => {
    setPlanFormOpen(false);
    setEditingPlan(null);
    router.refresh();
    toast.add({
      title: message,
      data: { icon: <CircleCheck className="text-success-emphasis" /> },
    });
  };

  const handlePlanCreated = (message: string, planId?: string) => {
    setIsCreating(false);
    if (planId) {
      setSelectedPlanId(planId);
      setSelectedVersionId(null);
    }
    router.refresh();
    toast.add({
      title: message,
      data: { icon: <CircleCheck className="text-success-emphasis" /> },
    });
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    setArchiveError(null);
    startArchiveTransition(async () => {
      const result = await archivePlan(archiveTarget.id, locale);
      if (result.status === "success") {
        setArchiveTarget(null);
        router.refresh();
        toast.add({
          title: result.message,
          data: {
            icon: <CircleCheck className="text-success-emphasis" />,
          },
        });
      } else {
        setArchiveError(result.message);
      }
    });
  };

  const summaryCards = [
    {
      key: "summary.totalPlans" as PlansKey,
      value: data.summary.totalPlans,
      icon: Package,
      variant: "icon-soft" as const,
    },
    {
      key: "summary.activePlans" as PlansKey,
      value: data.summary.activePlans,
      icon: Gauge,
      variant: "icon-success" as const,
    },
    {
      key: "summary.publishedVersions" as PlansKey,
      value: data.summary.publishedVersions,
      icon: CircleCheck,
      variant: "icon-info" as const,
    },
    {
      key: "summary.activeSubscribers" as PlansKey,
      value: data.summary.activeSubscribers,
      icon: Database,
      variant: "icon-warning" as const,
    },
  ];

  const planListItems = (
    <div className="flex flex-col gap-2">
      {data.plans.length === 0 ? (
        <Alert variant="info">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>{t("plan.none")}</AlertTitle>
        </Alert>
      ) : filteredPlans.length === 0 ? (
        <Alert variant="warning">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>{t("plan.noMatches")}</AlertTitle>
        </Alert>
      ) : (
        filteredPlans.map((plan) => {
          const publishedCount = plan.versions.filter(
            (version) => version.status === "published",
          ).length;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => selectPlan(plan)}
              className={cn(
                "text-start flex flex-col gap-2 rounded-lg border px-4 py-3 transition-colors",
                selectedPlan?.id === plan.id
                  ? "border-border bg-background-subtle"
                  : "border-border-muted bg-background hover:bg-background-subtle",
              )}
            >
              <span className="flex items-center gap-3">
                <Thumbnail size="md" variant="icon-soft">
                  <Package className="size-4" aria-hidden />
                </Thumbnail>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-foreground-intense truncate text-sm font-semibold">
                    {plan.name}
                  </span>
                  <code className="text-foreground-muted font-mono text-xs">
                    {plan.code}
                  </code>
                </span>
                <Badge variant={statusVariant(plan.status)}>
                  {t(`status.${plan.status}` as PlansKey)}
                </Badge>
              </span>
              <span className="text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>
                  {t("summary.activeSubscribers")}: {plan.activeSubscribers}
                </span>
                <span>
                  {t("summary.publishedVersions")}: {publishedCount}
                </span>
                <Badge variant="outline" size="xs">
                  {plan.isPublic ? t("values.public") : t("values.private")}
                </Badge>
              </span>
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground-intense text-2xl font-bold">
            {t("page.title")}
          </h1>
          <p className="text-foreground-muted mt-1 max-w-2xl text-sm">
            {t("page.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus data-icon="start" className="size-4" />
          {t("plan.create")}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
            >
              <Thumbnail variant={card.variant} size="md">
                <Icon className="size-4" aria-hidden />
              </Thumbnail>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground-muted text-xs">
                  {t(card.key)}
                </span>
                <span className="text-foreground-intense text-2xl font-bold tabular-nums">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder={t("plan.searchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          startSlot={<Search className="text-foreground-muted size-4" />}
          clearable
          onClear={() => setQuery("")}
          className="lg:w-80"
        />
        <ChipGroup variant="outline" className="flex-wrap">
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              variant={statusFilter === status ? "primary" : "outline"}
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all"
                ? t("values.all")
                : t(`status.${status}` as PlansKey)}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {isCreating ? (
        <div className="mt-6 grid w-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {planListItems}
          <div className="min-w-0">
            <PlanCreatePanel
              features={data.features}
              addons={data.addons}
              onCancel={() => setIsCreating(false)}
              onSaved={handlePlanCreated}
            />
          </div>
        </div>
      ) : data.plans.length === 0 ? (
        <Alert variant="info" className="mt-6">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>{t("plan.none")}</AlertTitle>
        </Alert>
      ) : filteredPlans.length === 0 ? (
        <Alert variant="warning" className="mt-6">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>{t("plan.noMatches")}</AlertTitle>
        </Alert>
      ) : (
        <div className="mt-6 grid w-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {planListItems}

          {selectedPlan ? (
            <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground-intense text-lg font-bold">
                      {selectedPlan.name}
                    </h2>
                    <Badge variant={statusVariant(selectedPlan.status)}>
                      {t(`status.${selectedPlan.status}` as PlansKey)}
                    </Badge>
                    <Badge variant="outline">
                      {selectedPlan.isPublic
                        ? t("values.public")
                        : t("values.private")}
                    </Badge>
                  </div>
                  <code className="text-foreground-muted font-mono text-xs">
                    {selectedPlan.code}
                  </code>
                  {selectedPlan.description ? (
                    <p className="text-foreground-muted text-sm">
                      {selectedPlan.description}
                    </p>
                  ) : null}
                  {selectedPlan.defaultPrice ||
                  selectedPlan.creditPolicy ||
                  selectedPlan.addons.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {selectedPlan.defaultPrice ? (
                        <Badge variant="outline">
                          {formatPrice(selectedPlan.defaultPrice, locale, t)}
                        </Badge>
                      ) : null}
                      {selectedPlan.creditPolicy ? (
                        <Badge variant="outline">
                          {t("plan.credit")}:{" "}
                          {selectedPlan.creditPolicy.windows.length > 0
                            ? `${selectedPlan.creditPolicy.windows.length} ${t(
                                "plan.windows",
                              )}`
                            : Number(
                                selectedPlan.creditPolicy.monthlyCreditGrant,
                              ).toLocaleString(locale)}
                        </Badge>
                      ) : null}
                      {selectedPlan.addons.length > 0 ? (
                        <Badge variant="outline">
                          {t("plan.addons")}: {selectedPlan.addons.length}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClone(selectedPlan)}
                    disabled={isCloning || isCreatingDraft || isPublishing}
                  >
                    {isCloning ? (
                      <Spinner currentColor className="text-[1.2em]" />
                    ) : (
                      <Copy data-icon="start" className="size-4" />
                    )}
                    {isCloning ? t("actions.cloning") : t("actions.clone")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(selectedPlan);
                      setPlanFormOpen(true);
                    }}
                  >
                    <Pencil data-icon="start" className="size-4" />
                    {t("plan.edit")}
                  </Button>
                  {selectedPlan.status !== "archived" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setArchiveError(null);
                        setArchiveTarget(selectedPlan);
                      }}
                    >
                      <Trash data-icon="start" className="size-4" />
                      {t("plan.archive")}
                    </Button>
                  ) : null}
                  {selectedVersion ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCreateDraft(selectedPlan, selectedVersion)
                        }
                        disabled={isCreatingDraft || isPublishing}
                      >
                        {isCreatingDraft ? (
                          <Spinner currentColor className="text-[1.2em]" />
                        ) : (
                          <Copy data-icon="start" className="size-4" />
                        )}
                        {isCreatingDraft
                          ? t("actions.creatingDraft")
                          : t("actions.createDraft")}
                      </Button>
                      {selectedVersion.status === "draft" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setPublishError(null);
                            setPublishTarget({
                              plan: selectedPlan,
                              version: selectedVersion,
                            });
                          }}
                          disabled={isCreatingDraft || isPublishing}
                        >
                          <Rocket data-icon="start" className="size-4" />
                          {t("actions.publish")}
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              {selectedPlan.versions.length === 0 ? (
                <Alert variant="warning" className="m-4">
                  <AlertIcon>
                    <Info />
                  </AlertIcon>
                  <AlertTitle>{t("plan.noVersions")}</AlertTitle>
                </Alert>
              ) : (
                <Tabs
                  value={selectedVersion?.id ?? ""}
                  onValueChange={(value) => setSelectedVersionId(value)}
                  className="p-4"
                >
                  <div className="scrollbar-none overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <TabsList>
                      {selectedPlan.versions.map((version) => (
                        <TabsTrigger key={version.id} value={version.id}>
                          v{version.versionNumber}
                          <Badge
                            variant={versionStatusVariant(version.status)}
                            size="xs"
                            className="ms-1.5"
                          >
                            {t(`versionStatus.${version.status}` as PlansKey)}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {selectedPlan.versions.map((version) => (
                    <TabsContent key={version.id} value={version.id} className="mt-4">
                      <div className="flex flex-col gap-4">
                        <VersionMeta version={version} locale={locale} />
                        {data.features.length === 0 ? (
                          <Alert variant="warning">
                            <AlertIcon>
                              <Info />
                            </AlertIcon>
                            <AlertTitle>{t("plan.noFeatures")}</AlertTitle>
                          </Alert>
                        ) : (
                          <PlanPolicyTable
                            key={version.id}
                            version={version}
                            features={data.features}
                            policies={data.policies}
                            onEdit={(feature, policy) =>
                              setEditing({
                                planVersion: version,
                                feature,
                                policy,
                              })
                            }
                          />
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          ) : null}
        </div>
      )}

      {editing ? (
        <PlanLimitDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          planVersion={editing.planVersion}
          feature={editing.feature}
          policy={editing.policy}
          onSaved={handleSaved}
        />
      ) : null}

      {editingPlan ? (
        <PlanFormDialog
          open={planFormOpen}
          onOpenChange={(open) => {
            setPlanFormOpen(open);
            if (!open) setEditingPlan(null);
          }}
          plan={editingPlan}
          onSaved={handlePlanSaved}
        />
      ) : null}

      <AlertDialog
        open={publishTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPublishTarget(null);
            setPublishError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("actions.publishConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.publishConfirmBody").replace(
                "{version}",
                String(publishTarget?.version.versionNumber ?? ""),
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {publishError ? (
            <p className="text-error px-6 text-sm" role="alert">
              {publishError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogClose
              render={
                <Button variant="ghost" disabled={isPublishing}>
                  {t("actions.cancel")}
                </Button>
              }
            />
            <Button
              variant="primary"
              disabled={isPublishing}
              onClick={handlePublish}
            >
              {isPublishing ? (
                <Spinner currentColor className="text-[1.2em]" />
              ) : (
                <Rocket data-icon="start" className="size-4" />
              )}
              {isPublishing ? t("actions.publishing") : t("actions.publish")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {t("planForm.archiveConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("planForm.archiveConfirmBody").replace(
                "{name}",
                archiveTarget?.name ?? "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiveError ? (
            <p className="text-error px-6 text-sm" role="alert">
              {archiveError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogClose
              render={
                <Button variant="ghost" disabled={isArchiving}>
                  {t("planForm.cancel")}
                </Button>
              }
            />
            <Button
              variant="destructive"
              disabled={isArchiving}
              onClick={handleArchive}
            >
              {isArchiving ? (
                <Spinner currentColor className="text-[1.2em]" />
              ) : (
                <Trash data-icon="start" className="size-4" />
              )}
              {t("planForm.archiveConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
