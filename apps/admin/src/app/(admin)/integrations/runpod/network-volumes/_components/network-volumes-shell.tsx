"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, FilePenLine, Trash2, HardDrive } from "lucide-react";
import { IconButton } from "@/components/ui/actions";
import { SearchInput } from "@/components/ui/inputs";
import {
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
} from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Heading, Text } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Pagination,
} from "@/components/ui/navigation";
import {
  AlertDialog, AlertDialogContent,
} from "@/components/ui/overlay";
import { formatGb } from "@/integrations/runpod/formatters";
import { deleteNetworkVolumeAction } from "@/integrations/runpod/server/mutations";
import { RUNPOD_ROUTE_PREFIX } from "@/integrations/runpod/contract";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { NetworkVolumeSummary } from "@/integrations/runpod/types";
import { NetworkVolumeCreateDialog } from "./network-volume-create-dialog";
import { NetworkVolumeEditDialog } from "./network-volume-edit-dialog";

interface NetworkVolumesShellProps {
  items: NetworkVolumeSummary[];
  total: number;
  truncated: boolean;
}

const PAGE_SIZE = 10;

export function NetworkVolumesShell({
  items,
  total,
  truncated,
}: NetworkVolumesShellProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editVolume, setEditVolume] = useState<NetworkVolumeSummary | null>(null);
  const [deleteVolume, setDeleteVolume] = useState<NetworkVolumeSummary | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const needle = search.toLowerCase();
    return items.filter(
      (v) =>
        v.id.toLowerCase().includes(needle) ||
        (v.name ?? "").toLowerCase().includes(needle),
    );
  }, [items, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deleteVolume) return;
    const result = await deleteNetworkVolumeAction({
      networkVolumeId: deleteVolume.id,
    });
    if (result.ok) {
      setDeleteVolume(null);
      router.refresh();
    }
  };

  return (
    <Stack gap="md">
      <Inline gap="md" align="center" justify="between">
        <div>
          <Heading level={3}>{t("runpod.networkVolumes.title")}</Heading>
          <Text size="sm" tone="muted">
            {total !== 1
              ? t("runpod.networkVolumes.count", { count: total })
              : t("runpod.networkVolumes.countOne", { count: total })}
          </Text>
        </div>
        <NetworkVolumeCreateDialog />
      </Inline>

      <SearchInput
        placeholder={t("runpod.networkVolumes.searchPlaceholder")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setPage(1);
        }}
      />

      {filtered.length === 0 ? (
        search ? (
          <EmptyState
            title={t("runpod.networkVolumes.empty.noMatchesTitle")}
            description={t("runpod.networkVolumes.empty.noMatchesDesc")}
          />
        ) : (
          <EmptyState
            icon={<HardDrive className="size-5" />}
            title={t("runpod.networkVolumes.empty.noDataTitle")}
            description={t("runpod.networkVolumes.empty.noDataDesc")}
          />
        )
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("runpod.networkVolumes.col.name")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.networkVolumes.col.size")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.networkVolumes.col.dataCenter")}</TableHeaderCell>
                <TableHeaderCell>{t("runpod.networkVolumes.col.volumeId")}</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((volume) => (
                <TableRow key={volume.id}>
                  <TableCell>
                    <LocalizedLink
                      href={`${RUNPOD_ROUTE_PREFIX}/network-volumes/${volume.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {volume.name ?? t("runpod.common.unnamed")}
                    </LocalizedLink>
                  </TableCell>
                  <TableCell>{formatGb(volume.size)}</TableCell>
                  <TableCell>{volume.dataCenterId ?? "—"}</TableCell>
                  <TableCell>
                    <code className="text-xs text-neutral-500">
                      {volume.id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          label={t("runpod.networkVolumes.volumeActions")}
                          variant="ghost"
                          size="sm"
                        >
                          <MoreHorizontal className="size-4" />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setEditVolume(volume)}
                        >
                          <FilePenLine className="size-4" />
                          {t("runpod.common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger-600"
                          onSelect={() => setDeleteVolume(volume)}
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

          <Inline gap="md" align="center" justify="between">
            <Text size="sm" tone="muted">
              {t("runpod.networkVolumes.showingRange", {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </Text>
            {pageCount > 1 && (
              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            )}
          </Inline>
        </>
      )}

      {truncated && (
        <Alert tone="neutral" title={t("runpod.networkVolumes.truncated.title")}>
          {t("runpod.networkVolumes.truncated.body", {
            shown: items.length,
            total,
          })}
        </Alert>
      )}

      {/* Edit dialog */}
      {editVolume && (
        <NetworkVolumeEditDialog
          volume={editVolume}
          open={!!editVolume}
          onOpenChange={(open) => {
            if (!open) setEditVolume(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteVolume}
        onOpenChange={(open) => {
          if (!open) setDeleteVolume(null);
        }}
      >
        <AlertDialogContent
          title={t("runpod.networkVolumes.delete.title")}
          description={t("runpod.networkVolumes.delete.confirm", {
            name: deleteVolume?.name ?? t("runpod.common.unnamed"),
          })}
          confirmLabel={t("runpod.common.delete")}
          tone="danger"
          onConfirm={handleDeleteConfirm}
        />
      </AlertDialog>
    </Stack>
  );
}
