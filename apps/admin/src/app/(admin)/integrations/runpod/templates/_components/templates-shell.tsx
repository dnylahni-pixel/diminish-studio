"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, MoreHorizontal, FilePenLine, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { SearchInput } from "@/components/ui/inputs";
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
  Badge,
} from "@/components/ui/data-display";
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
import { formatGb } from "@/integrations/runpod/formatters";
import { deleteTemplateAction } from "@/integrations/runpod/server/mutations";
import { TemplateCreateDialog } from "./template-create-dialog";
import { TemplateEditDialog } from "./template-edit-dialog";
import type { TemplateSummary, ContainerRegistryAuthSummary } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface TemplatesShellProps {
  templates: TemplateSummary[];
  total: number;
  registryAuths: ContainerRegistryAuthSummary[];
  pageSize: number;
}

type FeedbackState = {
  tone: "success" | "danger";
  message: string;
} | null;

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function TemplatesShell({ templates, total, registryAuths, pageSize }: TemplatesShellProps) {
  const router = useRouter();

  /* ----- Filtering state ----- */
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* ----- Dialog state ----- */
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TemplateSummary | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ----- Action feedback ----- */
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  /* ----- Reset page when search changes ----- */
  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ----- Client-side filtering ----- */
  const filtered = useMemo(() => {
    if (!search) return templates;

    const needle = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.id.toLowerCase().includes(needle) ||
        (t.name ?? "").toLowerCase().includes(needle) ||
        (t.imageName ?? "").toLowerCase().includes(needle),
    );
  }, [templates, search]);

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

  /* ----- Delete handler ----- */
  const handleDelete = useCallback(async () => {
    if (!deleteTemplateId) return;
    setDeleting(true);
    setFeedback(null);

    const result = await deleteTemplateAction({ templateId: deleteTemplateId });

    setDeleting(false);
    setDeleteTemplateId(null);

    if (result.ok) {
      showFeedback("success", "Template deleted successfully.");
      router.refresh();
    } else {
      showFeedback("danger", result.error.message);
    }
  }, [deleteTemplateId, router, showFeedback]);

  /* ----- Render ----- */

  return (
    <Stack gap="md">
      {/* Header row */}
      <Inline justify="between" align="start">
        <div>
          <Heading level={3}>Templates</Heading>
          <Text size="sm" tone="muted">
            {filtered.length === total
              ? `${total} template${total !== 1 ? "s" : ""}`
              : `${filtered.length} of ${total} template${total !== 1 ? "s" : ""}`}
          </Text>
        </div>
        <Button
          variant="primary"
          leadingIcon={<Plus className="size-4" />}
          onClick={() => setCreateOpen(true)}
        >
          Create template
        </Button>
      </Inline>

      {/* Feedback alert */}
      {feedback && (
        <Alert
          tone={feedback.tone}
          title={feedback.tone === "danger" ? "Error" : "Success"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Search */}
      <SearchInput
        placeholder="Search templates by name or ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch("")}
        className="w-72"
      />

      {/* Table or empty state */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No templates found"
          description={
            search
              ? "Try adjusting your search."
              : "There are no templates in this account yet. Create one to get started."
          }
          action={
            !search ? (
              <Button
                variant="primary"
                leadingIcon={<Plus className="size-4" />}
                onClick={() => setCreateOpen(true)}
              >
                Create template
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Image</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Container disk</TableHeaderCell>
              <TableHeaderCell>Volume</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell className="w-12">
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Link
                    href={`/integrations/runpod/templates/${template.id}`}
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {template.name ?? template.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-neutral-600">{template.imageName ?? "—"}</code>
                </TableCell>
                <TableCell>{template.category ?? "—"}</TableCell>
                <TableCell>{formatGb(template.containerDiskInGb)}</TableCell>
                <TableCell>{formatGb(template.volumeInGb)}</TableCell>
                <TableCell>
                  {template.isServerless ? (
                    <Badge tone="info">Serverless</Badge>
                  ) : template.isRunpod ? (
                    <Badge tone="primary">Runpod</Badge>
                  ) : (
                    <Badge tone="neutral">Standard</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/integrations/runpod/templates/${template.id}`}>
                          <ExternalLink className="size-4" />
                          View details
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setEditTemplate(template)}>
                        <FilePenLine className="size-4" />
                        Edit template
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-danger-600"
                        onClick={() => setDeleteTemplateId(template.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete template
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
            Showing {(page - 1) * pageSize + 1}&ndash;
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </Text>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </Inline>
      )}

      {/* ---------- Create dialog ---------- */}
      <TemplateCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        registryAuths={registryAuths}
      />

      {/* ---------- Edit dialog ---------- */}
      {editTemplate && (
        <TemplateEditDialog
          open={!!editTemplate}
          onOpenChange={(open) => {
            if (!open) setEditTemplate(null);
          }}
          template={editTemplate}
          registryAuths={registryAuths}
        />
      )}

      {/* ---------- Delete confirmation ---------- */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTemplateId(null);
        }}
      >
        <AlertDialogContent
          title="Delete template"
          description="Are you sure you want to delete this template? This action cannot be undone."
          cancelLabel="Cancel"
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          tone="danger"
          onConfirm={handleDelete}
        />
      </AlertDialog>
    </Stack>
  );
}
