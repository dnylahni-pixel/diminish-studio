"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RUNPOD_ROUTE_PREFIX } from "@/integrations/runpod/contract";
import {
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Badge,
} from "@/components/ui/data-display";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/inputs";
import { Button, IconButton } from "@/components/ui/actions";
import { Heading, Text, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Pagination,
} from "@/components/ui/navigation";
import { Plus, MoreHorizontal, FilePenLine, Trash2, Search } from "lucide-react";
import { formatTimestamp, formatCount } from "@/integrations/runpod/formatters";
import { LocalizedLink, useI18n } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import { EndpointCreateDialog } from "./endpoint-create-dialog";
import { EndpointEditDialog } from "./endpoint-edit-dialog";
import { EndpointDeleteDialog } from "./endpoint-delete-dialog";
import type { EndpointSummary, TemplateSummary, NetworkVolumeSummary, PaginatedResult } from "@/integrations/runpod/types";

const PAGE_SIZE = 10;

interface EndpointsShellProps {
  configStatus: "configured" | "not_configured";
  initialData: PaginatedResult<EndpointSummary> | null;
  initialError?: { message: string; category: string };
  templates: TemplateSummary[];
  networkVolumes: NetworkVolumeSummary[];
}

export function EndpointsShell({
  configStatus,
  initialData,
  initialError,
  templates,
  networkVolumes,
}: EndpointsShellProps) {
  const router = useRouter();
  const { t, locale } = useI18n();

  // Search and pagination state (client-side)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingEndpoint, setEditingEndpoint] = React.useState<EndpointSummary | null>(null);
  const [deletingEndpoint, setDeletingEndpoint] = React.useState<EndpointSummary | null>(null);

  // Derived data: filter items by search
  const allItems = initialData?.items ?? [];
  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const needle = searchQuery.toLowerCase();
    return allItems.filter(
      (ep) =>
        (ep.name ?? "").toLowerCase().includes(needle) ||
        ep.id.toLowerCase().includes(needle),
    );
  }, [allItems, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Determine state to render
  if (configStatus !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{t("runpod.endpoints.title")}</Heading>
        <Alert tone="warning" title={t("runpod.common.notConnected")}>
          {t("runpod.endpoints.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {t("runpod.endpoints.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  if (initialError) {
    return (
      <Stack gap="md">
        <Heading level={3}>{t("runpod.endpoints.title")}</Heading>
        <Alert
          tone="danger"
          title={t("runpod.endpoints.loadErrorTitle", { category: initialError.category })}
        >
          {initialError.message}{" "}
          <TextLink href={localePrefix(locale, "/integrations/runpod/settings")}>
            {t("runpod.common.checkConnectionSettings")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  if (initialData === null) {
    return (
      <Stack gap="md" align="center">
        <Spinner size="lg" />
        <Text tone="muted">{t("runpod.endpoints.loading")}</Text>
      </Stack>
    );
  }

  const total = filtered.length;

  return (
    <Stack gap="md">
      {/* Header */}
      <Inline gap="md" align="center" justify="between">
        <div>
          <Heading level={3}>{t("runpod.endpoints.title")}</Heading>
          <Text size="sm" tone="muted">
            {total !== 1
              ? t("runpod.endpoints.count", { count: total })
              : t("runpod.endpoints.countOne", { count: total })}
            {searchQuery && t("runpod.endpoints.countMatching", { query: searchQuery })}
          </Text>
        </div>
        <Button leadingIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          {t("runpod.endpoints.create")}
        </Button>
      </Inline>

      {/* Search */}
      <SearchInput
        placeholder={t("runpod.endpoints.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery("")}
      />

      {/* Truncated notice */}
      {initialData.truncated && (
        <Alert tone="neutral" title={t("runpod.endpoints.truncated.title")}>
          {t("runpod.endpoints.truncated.body", {
            shown: initialData.items.length,
            total: initialData.total,
          })}
        </Alert>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        searchQuery ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title={t("runpod.endpoints.empty.noMatchesTitle")}
            description={t("runpod.endpoints.empty.noMatchesDesc", { query: searchQuery })}
          />
        ) : (
          <EmptyState
            title={t("runpod.endpoints.empty.noDataTitle")}
            description={t("runpod.endpoints.empty.noDataDesc")}
            action={
              <Button leadingIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
                {t("runpod.endpoints.create")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("runpod.endpoints.col.name")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.endpoints.col.type")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.endpoints.col.workers")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.endpoints.col.scaler")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.endpoints.col.gpuCount")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.endpoints.col.created")}</TableHeaderCell>
                <TableHeaderCell><span className="sr-only">{t("common.actions")}</span></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell>
                    <LocalizedLink
                      href={`${RUNPOD_ROUTE_PREFIX}/endpoints/${endpoint.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {endpoint.name ?? endpoint.id.slice(0, 8)}
                    </LocalizedLink>
                  </TableCell>
                  <TableCell>
                    <Badge tone={endpoint.computeType === "GPU" ? "info" : "neutral"}>
                      {endpoint.computeType ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">
                      {t("runpod.endpoints.workersState", {
                        running: endpoint.workerState.running,
                        total: endpoint.workerState.total,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {endpoint.scalerType ? `${endpoint.scalerType} (${endpoint.scalerValue})` : "—"}
                  </TableCell>
                  <TableCell>{formatCount(endpoint.gpuCount)}</TableCell>
                  <TableCell>
                    <span title={formatTimestamp(endpoint.createdAt, t).absolute}>
                      {formatTimestamp(endpoint.createdAt, t).relative}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton label={t("common.actions")} variant="ghost" size="sm">
                          <MoreHorizontal className="size-4" />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingEndpoint(endpoint)}>
                          <FilePenLine className="size-4" />
                          {t("runpod.common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingEndpoint(endpoint)}>
                          <Trash2 className="size-4 text-danger-600" />
                          <span className="text-danger-600">{t("runpod.common.delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <Inline justify="center">
              <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
            </Inline>
          )}
        </>
      )}

      {/* Dialogs */}
      <EndpointCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        templates={templates}
        networkVolumes={networkVolumes}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      {editingEndpoint && (
        <EndpointEditDialog
          endpoint={editingEndpoint}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingEndpoint(null);
          }}
          onSuccess={() => {
            setEditingEndpoint(null);
            router.refresh();
          }}
        />
      )}

      {deletingEndpoint && (
        <EndpointDeleteDialog
          endpoint={deletingEndpoint}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeletingEndpoint(null);
          }}
          onSuccess={() => {
            setDeletingEndpoint(null);
            router.refresh();
          }}
        />
      )}
    </Stack>
  );
}
