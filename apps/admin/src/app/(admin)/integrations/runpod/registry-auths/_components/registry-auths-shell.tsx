"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteContainerRegistryAuthAction } from "@/integrations/runpod/server/mutations";
import type { ContainerRegistryAuthSummary } from "@/integrations/runpod/types";
import { IconButton } from "@/components/ui/actions";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/navigation";
import { Text, Heading } from "@/components/ui/typography";
import { AlertDialog, AlertDialogContent } from "@/components/ui/overlay";
import { Stack } from "@/components/ui/layout";
import { MoreHorizontal, Trash2, KeyRound } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { RegistryAuthCreateDialog } from "./registry-auth-create-dialog";

interface RegistryAuthsShellProps {
  items: ContainerRegistryAuthSummary[];
}

export function RegistryAuthsShell({ items }: RegistryAuthsShellProps) {
  const router = useRouter();
  const { t } = useI18n();

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<ContainerRegistryAuthSummary | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Success feedback
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Auto-dismiss success alert
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteContainerRegistryAuthAction({
      containerRegistryAuthId: deleteTarget.id,
    });

    if (result.ok) {
      setDeleteTarget(null);
      setDeleting(false);
      setSuccessMessage(t("runpod.registryAuths.deletedSuccess"));
      router.refresh();
    } else {
      setDeleteError(result.error.message);
      setDeleting(false);
    }
  };

  return (
    <Stack gap="md">
      {/* Success feedback */}
      {successMessage && (
        <Alert tone="success" title={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}

      {/* Delete error feedback */}
      {deleteError && (
        <Alert tone="danger" title={deleteError} onDismiss={() => setDeleteError(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={3}>{t("runpod.registryAuths.title")}</Heading>
          <Text size="sm" tone="muted">
            {items.length !== 1
              ? t("runpod.registryAuths.count", { count: items.length })
              : t("runpod.registryAuths.countOne", { count: items.length })}
          </Text>
        </div>
        <RegistryAuthCreateDialog
          onSuccess={() => setSuccessMessage(t("runpod.registryAuths.createdSuccess"))}
        />
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="size-5" />}
          title={t("runpod.registryAuths.empty.title")}
          description={t("runpod.registryAuths.empty.description")}
          action={
            <RegistryAuthCreateDialog
              onSuccess={() => setSuccessMessage(t("runpod.registryAuths.createdSuccess"))}
            />
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("runpod.registryAuths.col.name")}</TableHeaderCell>
              <TableHeaderCell>{t("runpod.registryAuths.col.authId")}</TableHeaderCell>
              <TableHeaderCell className="w-16">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((auth) => (
              <TableRow key={auth.id}>
                <TableCell>
                  <span className="font-medium text-neutral-800">{auth.name ?? t("runpod.common.unnamed")}</span>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-neutral-500">{auth.id}</code>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton label={t("common.actions")} variant="ghost" size="sm">
                        <MoreHorizontal className="size-4" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(auth)}
                        className="text-danger-600"
                      >
                        <Trash2 className="size-4" />
                        {t("runpod.common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent
          title={t("runpod.registryAuths.delete.title")}
          description={t("runpod.registryAuths.delete.confirm")}
          tone="danger"
          confirmLabel={deleting ? t("runpod.registryAuths.delete.deleting") : t("runpod.common.delete")}
          onConfirm={handleDelete}
        />
      </AlertDialog>
    </Stack>
  );
}
