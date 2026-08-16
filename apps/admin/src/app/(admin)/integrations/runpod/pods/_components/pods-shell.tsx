"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  ExternalLink,
  FilePenLine,
  Play,
  Square,
  RotateCcw,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/actions";
import { SearchInput } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/overlay";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/data-display";
import { Badge } from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Stack, Inline } from "@/components/ui/layout";
import { Text, Heading } from "@/components/ui/typography";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/navigation";
import { Pagination } from "@/components/ui/navigation";
import {
  formatCreditsPerHour,
  formatTimestamp,
} from "@/integrations/runpod/formatters";
import { podStatusTone, podStatusLabel } from "@/integrations/runpod/formatters";
import {
  startPodAction,
  stopPodAction,
  restartPodAction,
  resetPodAction,
  deletePodAction,
} from "@/integrations/runpod/server/mutations";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import { PodCreateDialog } from "./pod-create-dialog";
import { PodEditDialog } from "./pod-edit-dialog";
import type { PodSummary, TemplateSummary, ContainerRegistryAuthSummary } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface PodsShellProps {
  pods: PodSummary[];
  total: number;
  templates: TemplateSummary[];
  registryAuths: ContainerRegistryAuthSummary[];
  pageSize: number;
}

type FeedbackState = {
  tone: "success" | "danger";
  message: string;
} | null;

const LIFECYCLE_SUCCESS_KEYS: Record<"start" | "stop" | "restart" | "reset", MessageKey> = {
  start: "runpod.pods.feedback.started",
  stop: "runpod.pods.feedback.stopped",
  restart: "runpod.pods.feedback.restarted",
  reset: "runpod.pods.feedback.reset",
};

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function PodsShell({ pods, total, templates, registryAuths, pageSize }: PodsShellProps) {
  const router = useRouter();
  const { t } = useI18n();

  /* ----- Filtering state ----- */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [computeFilter, setComputeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  /* ----- Dialog state ----- */
  const [createOpen, setCreateOpen] = useState(false);
  const [editPod, setEditPod] = useState<PodSummary | null>(null);
  const [deletePodId, setDeletePodId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ----- Action feedback ----- */
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  /* ----- In-flight lifecycle action ----- */
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ----- Reset page when filters change ----- */
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, computeFilter]);

  /* ----- Client-side filtering ----- */
  const filtered = useMemo(() => {
    let result = pods;

    if (search) {
      const needle = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(needle) ||
          (p.name ?? "").toLowerCase().includes(needle) ||
          (p.imageName ?? "").toLowerCase().includes(needle),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.desiredStatus === statusFilter);
    }

    if (computeFilter !== "ALL") {
      result = result.filter((p) => p.computeType === computeFilter);
    }

    return result;
  }, [pods, search, statusFilter, computeFilter]);

  /* ----- Client-side pagination ----- */
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  /* ----- Helper: show ephemeral feedback ----- */
  const showFeedback = useCallback((tone: "success" | "danger", message: string) => {
    setFeedback({ tone, message });
    if (tone === "success") {
      setTimeout(() => setFeedback(null), 4000);
    }
  }, []);

  /* ----- Lifecycle action handler ----- */
  const handleLifecycleAction = useCallback(
    async (action: "start" | "stop" | "restart" | "reset", podId: string) => {
      setActionLoading(podId);
      setFeedback(null);

      let result;
      switch (action) {
        case "start":
          result = await startPodAction({ podId });
          break;
        case "stop":
          result = await stopPodAction({ podId });
          break;
        case "restart":
          result = await restartPodAction({ podId });
          break;
        case "reset":
          result = await resetPodAction({ podId });
          break;
      }

      setActionLoading(null);

      if (result.ok) {
        showFeedback("success", t(LIFECYCLE_SUCCESS_KEYS[action]));
        router.refresh();
      } else {
        showFeedback("danger", result.error.message);
      }
    },
    [router, showFeedback, t],
  );

  /* ----- Delete handler ----- */
  const handleDelete = useCallback(async () => {
    if (!deletePodId) return;
    setDeleting(true);
    setFeedback(null);

    const result = await deletePodAction({ podId: deletePodId });

    setDeleting(false);
    setDeletePodId(null);

    if (result.ok) {
      showFeedback("success", t("runpod.pods.feedback.deleted"));
      router.refresh();
    } else {
      showFeedback("danger", result.error.message);
    }
  }, [deletePodId, router, showFeedback, t]);

  /* ----- Filter options ----- */
  const statusOptions = [
    { value: "ALL", label: t("runpod.pods.status.all") },
    { value: "RUNNING", label: t("runpod.pods.status.running") },
    { value: "EXITED", label: t("runpod.pods.status.exited") },
    { value: "TERMINATED", label: t("runpod.pods.status.terminated") },
  ];

  const computeOptions = [
    { value: "ALL", label: t("runpod.pods.compute.all") },
    { value: "GPU", label: "GPU" },
    { value: "CPU", label: "CPU" },
  ];

  /* ----- Render ----- */

  // Determine if current user has mutate permission for action enablement
  // Since pods-shell operates on the data it receives, it always renders
  // action buttons. Permission enforcement happens server-side in the
  // mutation functions.

  return (
    <Stack gap="md">
      {/* Header row */}
      <Inline justify="between" align="start">
        <div>
          <Heading level={3}>{t("runpod.pods.title")}</Heading>
          <Text size="sm" tone="muted">
            {filtered.length === total
              ? total !== 1
                ? t("runpod.pods.count", { count: total })
                : t("runpod.pods.countOne", { count: total })
              : total !== 1
                ? t("runpod.pods.countOf", { count: filtered.length, total })
                : t("runpod.pods.countOfOne", { count: filtered.length, total })}
          </Text>
        </div>
        <Button
          variant="primary"
          leadingIcon={<Plus className="size-4" />}
          onClick={() => setCreateOpen(true)}
        >
          {t("runpod.pods.createButton")}
        </Button>
      </Inline>

      {/* Feedback alert */}
      {feedback && (
        <Alert
          tone={feedback.tone}
          title={feedback.tone === "danger" ? t("runpod.pods.errorTitle") : t("runpod.pods.successTitle")}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filters */}
      <Inline gap="sm" wrap={false}>
        <SearchInput
          placeholder={t("runpod.pods.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          className="w-72"
        />
        <div className="w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder={t("runpod.pods.status.all")}
          />
        </div>
        <div className="w-40">
          <Select
            options={computeOptions}
            value={computeFilter}
            onValueChange={setComputeFilter}
            placeholder={t("runpod.pods.compute.all")}
          />
        </div>
      </Inline>

      {/* Table or empty state */}
      {paginated.length === 0 ? (
        <EmptyState
          title={t("runpod.pods.empty.noDataTitle")}
          description={
            search || statusFilter !== "ALL" || computeFilter !== "ALL"
              ? t("runpod.pods.empty.filteredDesc")
              : t("runpod.pods.empty.noDataDesc")
          }
          action={
            !search && statusFilter === "ALL" && computeFilter === "ALL" ? (
              <Button
                variant="primary"
                leadingIcon={<Plus className="size-4" />}
                onClick={() => setCreateOpen(true)}
              >
                {t("runpod.pods.createButton")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("runpod.pods.col.name")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.pods.col.status")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.pods.col.type")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.pods.col.gpu")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.pods.col.cost")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.pods.col.created")}</TableHeaderCell>
              <TableHeaderCell className="w-12">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((pod) => (
              <TableRow key={pod.id}>
                <TableCell>
                  <LocalizedLink
                    href={`/integrations/runpod/pods/${pod.id}`}
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {pod.name ?? pod.id.slice(0, 8)}
                  </LocalizedLink>
                </TableCell>
                <TableCell>
                  <Badge tone={podStatusTone(pod.desiredStatus)}>
                    {t(podStatusLabel(pod.desiredStatus))}
                  </Badge>
                </TableCell>
                <TableCell>{pod.computeType ?? "—"}</TableCell>
                <TableCell>
                  {pod.gpuDisplayName ?? (
                    <span className="text-neutral-400">&mdash;</span>
                  )}
                </TableCell>
                <TableCell>{formatCreditsPerHour(pod.costPerHr)}</TableCell>
                <TableCell>
                  <span title={formatTimestamp(pod.createdAt, t).absolute}>
                    {formatTimestamp(pod.createdAt, t).relative}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={actionLoading === pod.id}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <LocalizedLink href={`/integrations/runpod/pods/${pod.id}`}>
                          <ExternalLink className="size-4" />
                          {t("runpod.pods.viewDetails")}
                        </LocalizedLink>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setEditPod(pod)}>
                        <FilePenLine className="size-4" />
                        {t("runpod.pods.editPod")}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {pod.desiredStatus !== "RUNNING" && (
                        <DropdownMenuItem
                          onClick={() => handleLifecycleAction("start", pod.id)}
                        >
                          <Play className="size-4" />
                          {t("runpod.pods.startPod")}
                        </DropdownMenuItem>
                      )}

                      {pod.desiredStatus === "RUNNING" && (
                        <DropdownMenuItem
                          onClick={() => handleLifecycleAction("stop", pod.id)}
                        >
                          <Square className="size-4" />
                          {t("runpod.pods.stopPod")}
                        </DropdownMenuItem>
                      )}

                      {pod.desiredStatus === "RUNNING" && (
                        <DropdownMenuItem
                          onClick={() => handleLifecycleAction("restart", pod.id)}
                        >
                          <RotateCcw className="size-4" />
                          {t("runpod.pods.restartPod")}
                        </DropdownMenuItem>
                      )}

                      {pod.desiredStatus !== "TERMINATED" && (
                        <DropdownMenuItem
                          onClick={() => handleLifecycleAction("reset", pod.id)}
                        >
                          <Rocket className="size-4" />
                          {t("runpod.pods.resetPod")}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-danger-600"
                        onClick={() => setDeletePodId(pod.id)}
                      >
                        <Trash2 className="size-4" />
                        {t("runpod.pods.deletePod")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <Inline justify="between" align="center">
          <Text size="sm" tone="muted">
            {t("runpod.pods.showingRange", {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, filtered.length),
              total: filtered.length,
            })}
          </Text>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </Inline>
      )}

      {/* Truncated data notice */}
      {pods.length < total && paginated.length === 0 && (
        <Alert tone="neutral" title={t("runpod.pods.truncated.title")}>
          {t("runpod.pods.truncated.body", { shown: pods.length, total })}
        </Alert>
      )}

      {/* ---------- Create dialog ---------- */}
      <PodCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        templates={templates}
        registryAuths={registryAuths}
      />

      {/* ---------- Edit dialog ---------- */}
      {editPod && (
        <PodEditDialog
          open={!!editPod}
          onOpenChange={(open) => {
            if (!open) setEditPod(null);
          }}
          pod={editPod}
        />
      )}

      {/* ---------- Delete confirmation ---------- */}
      <AlertDialog
        open={!!deletePodId}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletePodId(null);
        }}
      >
        <AlertDialogContent
          title={t("runpod.pods.delete.title")}
          description={t("runpod.pods.delete.confirm")}
          cancelLabel={t("common.cancel")}
          confirmLabel={deleting ? t("runpod.pods.delete.deleting") : t("runpod.common.delete")}
          tone="danger"
          onConfirm={handleDelete}
        />
      </AlertDialog>
    </Stack>
  );
}
