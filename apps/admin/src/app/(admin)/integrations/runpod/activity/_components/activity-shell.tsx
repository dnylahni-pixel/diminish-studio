"use client";

import { useState, useMemo, useCallback } from "react";
import { formatTimestamp } from "@/integrations/runpod/formatters";
import type { AuditLogEntry, RunpodErrorCategory } from "@/integrations/runpod/types";
import { Button, IconButton } from "@/components/ui/actions";
import { TextInput, Field } from "@/components/ui/inputs";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Card,
  Divider,
} from "@/components/ui/data-display";
import {
  EmptyState,
  TooltipProvider,
  Tooltip,
} from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/navigation";
import {
  Text,
  Heading,
  Caption,
} from "@/components/ui/typography";
import { Select } from "@/components/ui/select-combobox";
import { DateRangePicker } from "@/components/ui/date-time";
import { Drawer } from "@/components/ui/overlay";
import { Stack, Inline, Grid } from "@/components/ui/layout";
import {
  RotateCcw,
  Search,
  Copy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n/client";
import type { MessageKey, TFunction } from "@/i18n/translate";

// ---------------------------------------------------------------------------
// i18n key maps
// ---------------------------------------------------------------------------

const ACTION_VERB_KEYS: Record<string, MessageKey> = {
  all: "runpod.activity.verbs.all",
  create: "runpod.activity.verbs.create",
  update: "runpod.activity.verbs.update",
  delete: "runpod.activity.verbs.delete",
  start: "runpod.activity.verbs.start",
  stop: "runpod.activity.verbs.stop",
  restart: "runpod.activity.verbs.restart",
  reset: "runpod.activity.verbs.reset",
};

const TARGET_TYPE_KEYS: Record<string, MessageKey> = {
  pod: "runpod.activity.targets.pod",
  endpoint: "runpod.activity.targets.endpoint",
  template: "runpod.activity.targets.template",
  network_volume: "runpod.activity.targets.networkVolume",
  registry_auth: "runpod.activity.targets.registryAuth",
};

const STATUS_KEYS = {
  all: "runpod.activity.statuses.all",
  succeeded: "runpod.activity.statuses.succeeded",
  failed: "runpod.activity.statuses.failed",
} as const;

const ERROR_CATEGORY_KEYS: Record<RunpodErrorCategory, MessageKey> = {
  unauthenticated: "runpod.activity.errorCategory.unauthenticated",
  forbidden: "runpod.activity.errorCategory.forbidden",
  not_found: "runpod.activity.errorCategory.notFound",
  conflict: "runpod.activity.errorCategory.conflict",
  validation: "runpod.activity.errorCategory.validation",
  rate_limited: "runpod.activity.errorCategory.rateLimited",
  upstream_unavailable: "runpod.activity.errorCategory.unavailable",
  unexpected: "runpod.activity.errorCategory.unexpected",
};

const PAST_TENSE_KEYS: Record<string, MessageKey> = {
  create: "runpod.activity.verbs.pastCreated",
  update: "runpod.activity.verbs.pastUpdated",
  delete: "runpod.activity.verbs.pastDeleted",
  start: "runpod.activity.verbs.pastStarted",
  stop: "runpod.activity.verbs.pastStopped",
  restart: "runpod.activity.verbs.pastRestarted",
  reset: "runpod.activity.verbs.pastReset",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractVerb(action: string): string {
  const parts = action.split(".");
  return parts.length > 1 ? parts[1]! : action;
}

function targetTypeLabel(type: string, t: TFunction): string {
  const key = TARGET_TYPE_KEYS[type];
  if (key) return t(key);
  return type
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function formatActionDisplay(action: string, t: TFunction): string {
  const parts = action.split(".");
  if (parts.length === 2) {
    const target = parts[0]!;
    const verb = parts[1]!;
    const pastVerbKey = PAST_TENSE_KEYS[verb];
    const pastVerb = pastVerbKey ? t(pastVerbKey) : verb;
    const targetLabel = targetTypeLabel(target, t);
    return `${targetLabel} ${pastVerb}`;
  }
  return action;
}

function getDurationTone(ms: number): "success" | "warning" | "danger" {
  if (ms < 1000) return "success";
  if (ms < 5000) return "warning";
  return "danger";
}

const durationToneStyles: Record<string, string> = {
  success: "text-success-600",
  warning: "text-warning-600",
  danger: "text-danger-600",
};

function getDurationLabel(ms: number, t: TFunction): string {
  if (ms < 1) return t("runpod.activity.duration.lessThanMs");
  return `${ms.toLocaleString()}ms`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityFilters {
  actionVerb: string;
  targetType: string;
  status: string;
  actorId: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
}

interface ActivityShellProps {
  items: AuditLogEntry[];
  total: number;
}

const PAGE_SIZE = 20;
const INITIAL_FILTERS: ActivityFilters = {
  actionVerb: "all",
  targetType: "all",
  status: "all",
  actorId: "",
  dateRange: { from: undefined, to: undefined },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityShell({ items: initialItems, total: initialTotal }: ActivityShellProps) {
  const { t } = useI18n();
  const [items] = useState(initialItems);
  const [filters, setFilters] = useState<ActivityFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const actionVerbOptions = [
    { value: "all", label: t(ACTION_VERB_KEYS.all) },
    { value: "create", label: t(ACTION_VERB_KEYS.create) },
    { value: "update", label: t(ACTION_VERB_KEYS.update) },
    { value: "delete", label: t(ACTION_VERB_KEYS.delete) },
    { value: "start", label: t(ACTION_VERB_KEYS.start) },
    { value: "stop", label: t(ACTION_VERB_KEYS.stop) },
    { value: "restart", label: t(ACTION_VERB_KEYS.restart) },
    { value: "reset", label: t(ACTION_VERB_KEYS.reset) },
  ];

  const targetTypeOptions = [
    { value: "all", label: t("runpod.activity.targets.all") },
    { value: "pod", label: t(TARGET_TYPE_KEYS.pod) },
    { value: "endpoint", label: t(TARGET_TYPE_KEYS.endpoint) },
    { value: "template", label: t(TARGET_TYPE_KEYS.template) },
    { value: "network_volume", label: t(TARGET_TYPE_KEYS.network_volume) },
    { value: "registry_auth", label: t(TARGET_TYPE_KEYS.registry_auth) },
  ];

  const statusOptions = [
    { value: "all", label: t(STATUS_KEYS.all) },
    { value: "succeeded", label: t(STATUS_KEYS.succeeded) },
    { value: "failed", label: t(STATUS_KEYS.failed) },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((entry) => {
      if (filters.actionVerb !== "all") {
        const verb = extractVerb(entry.action);
        if (verb !== filters.actionVerb) return false;
      }
      if (filters.targetType !== "all") {
        if (entry.targetType !== filters.targetType) return false;
      }
      if (filters.status !== "all") {
        if (entry.status !== filters.status) return false;
      }
      if (filters.actorId) {
        if (!entry.actorId.toLowerCase().includes(filters.actorId.toLowerCase()))
          return false;
      }
      if (filters.dateRange.from) {
        const entryDate = new Date(entry.createdAt);
        if (entryDate < filters.dateRange.from) return false;
      }
      if (filters.dateRange.to) {
        const entryDate = new Date(entry.createdAt);
        const endOfDay = new Date(filters.dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (entryDate > endOfDay) return false;
      }
      return true;
    });
  }, [items, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const updateFilter = useCallback(
    <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters =
    filters.actionVerb !== "all" ||
    filters.targetType !== "all" ||
    filters.status !== "all" ||
    filters.actorId !== "" ||
    filters.dateRange.from !== undefined ||
    filters.dateRange.to !== undefined;

  return (
    <TooltipProvider>
      <Stack gap="md">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div>
          <Heading level={3}>{t("runpod.activity.title")}</Heading>
          <Text size="sm" tone="muted">
            {initialTotal !== 1
              ? t("runpod.activity.auditLogCount", { count: initialTotal })
              : t("runpod.activity.auditLogCountOne", { count: initialTotal })}
          </Text>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────── */}
        <Card padding="md">
          <Stack gap="md">
            <Inline gap="sm" align="start" wrap>
              <div className="min-w-[140px]">
                <Field label={t("runpod.activity.filters.action")}>
                  <Select
                    options={actionVerbOptions}
                    value={filters.actionVerb}
                    onValueChange={(v) => updateFilter("actionVerb", v)}
                    placeholder={t(ACTION_VERB_KEYS.all)}
                  />
                </Field>
              </div>
              <div className="min-w-[160px]">
                <Field label={t("runpod.activity.filters.target")}>
                  <Select
                    options={targetTypeOptions}
                    value={filters.targetType}
                    onValueChange={(v) => updateFilter("targetType", v)}
                    placeholder={t("runpod.activity.targets.all")}
                  />
                </Field>
              </div>
              <div className="min-w-[140px]">
                <Field label={t("runpod.activity.filters.status")}>
                  <Select
                    options={statusOptions}
                    value={filters.status}
                    onValueChange={(v) => updateFilter("status", v)}
                    placeholder={t(STATUS_KEYS.all)}
                  />
                </Field>
              </div>
              <div className="min-w-[200px]">
                <Field label={t("runpod.activity.filters.actor")}>
                  <TextInput
                    placeholder={t("runpod.activity.filters.actorPlaceholder")}
                    value={filters.actorId}
                    onChange={(e) => updateFilter("actorId", e.target.value)}
                    leadingIcon={<Search className="size-4" />}
                  />
                </Field>
              </div>
              <div className="min-w-[240px]">
                <Field label={t("runpod.activity.filters.dateRange")}>
                  <DateRangePicker
                    value={
                      filters.dateRange.from || filters.dateRange.to
                        ? (filters.dateRange as { from: Date; to?: Date })
                        : undefined
                    }
                    onChange={(range) =>
                      updateFilter("dateRange", {
                        from: range?.from,
                        to: range?.to,
                      })
                    }
                    placeholder={t("runpod.activity.filters.allTime")}
                  />
                </Field>
              </div>
            </Inline>

            {hasActiveFilters && (
              <Inline gap="sm">
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<RotateCcw className="size-3.5" />}
                  onClick={resetFilters}
                >
                  {t("runpod.activity.filters.reset")}
                </Button>
                <Text size="sm" tone="muted" as="span">
                  {filteredItems.length !== 1
                    ? t("runpod.activity.resultsCount", {
                        count: filteredItems.length,
                        total: items.length,
                      })
                    : t("runpod.activity.resultsCountOne", {
                        count: filteredItems.length,
                        total: items.length,
                      })}
                </Text>
              </Inline>
            )}
          </Stack>
        </Card>

        {/* ── Table ──────────────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <EmptyState
            title={
              hasActiveFilters
                ? t("runpod.activity.empty.noMatchesTitle")
                : t("runpod.activity.empty.noActivityTitle")
            }
            description={
              hasActiveFilters
                ? t("runpod.activity.empty.noMatchesDesc")
                : t("runpod.activity.empty.noActivityDesc")
            }
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("runpod.activity.col.time")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.actor")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.action")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.target")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.duration")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.status")}</TableHeaderCell>
                  <TableHeaderCell>{t("runpod.activity.col.error")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedItems.map((entry) => {
                  const formatted = formatTimestamp(entry.createdAt, t);
                  return (
                    <TableRow
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="cursor-pointer"
                    >
                      {/* Time */}
                      <TableCell>
                        <Tooltip content={formatted.absolute}>
                          <span className="tabular-nums text-sm">
                            {formatted.relative}
                          </span>
                        </Tooltip>
                      </TableCell>

                      {/* Actor */}
                      <TableCell>
                        <span className="font-mono text-xs truncate max-w-[120px] block">
                          {entry.actorId.slice(0, 16)}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <span className="font-medium text-sm">
                          {formatActionDisplay(entry.action, t)}
                        </span>
                      </TableCell>

                      {/* Target */}
                      <TableCell>
                        <Inline gap="xs">
                          <Badge size="sm" tone="neutral">
                            {targetTypeLabel(entry.targetType, t)}
                          </Badge>
                          {entry.targetId ? (
                            <code className="text-xs text-neutral-500 truncate max-w-[100px] block">
                              {entry.targetId.slice(0, 12)}
                            </code>
                          ) : (
                            <span className="text-neutral-300 text-xs">
                              &mdash;
                            </span>
                          )}
                        </Inline>
                      </TableCell>

                      {/* Duration */}
                      <TableCell>
                        <span
                          className={cn(
                            "tabular-nums text-sm font-medium",
                            entry.durationMs != null
                              ? durationToneStyles[
                                  getDurationTone(entry.durationMs)
                                ]
                              : "text-neutral-300"
                          )}
                        >
                          {entry.durationMs != null
                            ? getDurationLabel(entry.durationMs, t)
                            : "—"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          size="sm"
                          tone={
                            entry.status === "succeeded"
                              ? "success"
                              : "danger"
                          }
                        >
                          {entry.status === "succeeded"
                            ? t(STATUS_KEYS.succeeded)
                            : t(STATUS_KEYS.failed)}
                        </Badge>
                      </TableCell>

                      {/* Error category */}
                      <TableCell>
                        {entry.status === "failed" && entry.errorCategory ? (
                          <Badge size="sm" tone="danger">
                            {t(ERROR_CATEGORY_KEYS[entry.errorCategory])}
                          </Badge>
                        ) : (
                          <span className="text-neutral-300 text-xs">
                            &mdash;
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* ── Pagination ─────────────────────────────────────── */}
            <Inline justify="between" align="center">
              <Text size="sm" tone="muted" as="span">
                {t("runpod.activity.showingRange", {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, filteredItems.length),
                  total: filteredItems.length,
                })}
              </Text>
              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </Inline>
          </>
        )}

        {/* ── Detail Drawer ──────────────────────────────────────── */}
        <Drawer
          open={!!selectedEntry}
          onOpenChange={(open) => {
            if (!open) setSelectedEntry(null);
          }}
          title={t("runpod.activity.detail.title")}
        >
          {selectedEntry && <ActivityDetailContent entry={selectedEntry} />}
        </Drawer>
      </Stack>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Detail drawer content
// ---------------------------------------------------------------------------

function ActivityDetailContent({ entry }: { entry: AuditLogEntry }) {
  const { t } = useI18n();
  const [copiedActor, setCopiedActor] = useState(false);
  const [copiedVendor, setCopiedVendor] = useState(false);

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const formatted = formatTimestamp(entry.createdAt);

  return (
    <Stack gap="md">
      {/* Status & time */}
      <div className="flex items-center gap-2">
        <Badge
          tone={entry.status === "succeeded" ? "success" : "danger"}
          size="md"
        >
          {entry.status === "succeeded" ? t(STATUS_KEYS.succeeded) : t(STATUS_KEYS.failed)}
        </Badge>
        <span className="text-sm text-neutral-500 tabular-nums">
          {formatted.absolute}
        </span>
      </div>

      <Divider />

      {/* Actor */}
      <div>
        <Caption>{t("runpod.activity.detail.actor")}</Caption>
        <Inline gap="xs" className="mt-1">
          <code className="text-sm font-mono bg-neutral-100 px-2 py-1 rounded break-all flex-1">
            {entry.actorId}
          </code>
          <IconButton
            label={t("runpod.activity.detail.copyActor")}
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(entry.actorId, setCopiedActor)}
          >
            {copiedActor ? (
              <CheckCircle2 className="size-4 text-success-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </IconButton>
        </Inline>
        {entry.actorRole && (
          <Text size="xs" tone="muted" className="mt-0.5">
            {t("runpod.activity.detail.role", { role: entry.actorRole })}
          </Text>
        )}
      </div>

      <Divider />

      {/* Action & Target */}
      <Grid columns={2} gap="md">
        <div>
          <Caption>{t("runpod.activity.detail.action")}</Caption>
          <Text weight="medium" className="mt-1">
            {formatActionDisplay(entry.action, t)}
          </Text>
        </div>
        <div>
          <Caption>{t("runpod.activity.detail.targetType")}</Caption>
          <Badge tone="neutral" size="sm" className="mt-1">
            {targetTypeLabel(entry.targetType, t)}
          </Badge>
        </div>
        {entry.targetId && (
          <div>
            <Caption>{t("runpod.activity.detail.targetId")}</Caption>
            <code className="text-sm font-mono mt-1 block break-all">
              {entry.targetId}
            </code>
          </div>
        )}
      </Grid>

      <Divider />

      {/* Duration */}
      <div>
        <Caption>{t("runpod.activity.detail.duration")}</Caption>
        <Inline gap="sm" className="mt-1">
          <Inline gap="xs">
            <Clock className="size-4 text-neutral-400" />
            <Text
              weight="semibold"
              className={cn(
                "tabular-nums",
                entry.durationMs != null &&
                  durationToneStyles[getDurationTone(entry.durationMs)]
              )}
            >
              {entry.durationMs != null
                ? getDurationLabel(entry.durationMs, t)
                : "—"}
            </Text>
          </Inline>
          {entry.durationMs != null && (
            <Badge size="sm" tone={getDurationTone(entry.durationMs)}>
              {entry.durationMs < 1000
                ? t("runpod.activity.duration.fast")
                : entry.durationMs < 5000
                  ? t("runpod.activity.duration.moderate")
                  : t("runpod.activity.duration.slow")}
            </Badge>
          )}
        </Inline>
      </div>

      {/* Vendor request ID */}
      {entry.vendorRequestId && (
        <>
          <Divider />
          <div>
            <Caption>{t("runpod.activity.detail.vendorRequestId")}</Caption>
            <Inline gap="xs" className="mt-1">
              <code className="text-sm font-mono bg-neutral-100 px-2 py-1 rounded break-all flex-1">
                {entry.vendorRequestId}
              </code>
              <IconButton
                label={t("runpod.activity.detail.copyVendorRequestId")}
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopy(entry.vendorRequestId!, setCopiedVendor)
                }
              >
                {copiedVendor ? (
                  <CheckCircle2 className="size-4 text-success-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </IconButton>
            </Inline>
          </div>
        </>
      )}

      {/* Error details */}
      {entry.status === "failed" && entry.errorCategory && (
        <>
          <Divider />
          <div>
            <Caption>{t("runpod.activity.detail.error")}</Caption>
            <Stack gap="sm" className="mt-1">
              <Badge tone="danger" size="sm">
                {t(ERROR_CATEGORY_KEYS[entry.errorCategory])}
              </Badge>
            </Stack>
          </div>
        </>
      )}

      {/* Metadata JSON — shown for failed operations or when present */}
      {entry.metadata &&
        typeof entry.metadata === "object" &&
        Object.keys(entry.metadata).length > 0 && (
          <>
            <Divider />
            <div>
              <Caption>{t("runpod.activity.detail.metadata")}</Caption>
              <pre className="mt-1 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded p-3 overflow-x-auto max-h-48">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            </div>
          </>
        )}
    </Stack>
  );
}
