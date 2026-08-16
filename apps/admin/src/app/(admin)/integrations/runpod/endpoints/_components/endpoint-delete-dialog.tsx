"use client";

import * as React from "react";
import { deleteEndpointAction } from "@/integrations/runpod/server/mutations";
import {
  AlertDialog, AlertDialogContent,
} from "@/components/ui/overlay";
import { useI18n } from "@/i18n/client";
import type { EndpointSummary } from "@/integrations/runpod/types";

interface EndpointDeleteDialogProps {
  endpoint: EndpointSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EndpointDeleteDialog({
  endpoint,
  open,
  onOpenChange,
  onSuccess,
}: EndpointDeleteDialogProps) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await deleteEndpointAction({ endpointId: endpoint.id });
      if (!result.ok) {
        setError(result.error.message);
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("runpod.common.unexpectedError"));
      setSubmitting(false);
    }
  };

  const name = endpoint.name ?? endpoint.id.slice(0, 8);

  return (
    <AlertDialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) setError(null); }}>
      <AlertDialogContent
        title={t("runpod.endpoints.delete.title")}
        description={
          error
            ? error
            : t("runpod.endpoints.delete.confirm", { name })
        }
        cancelLabel={t("common.cancel")}
        confirmLabel={submitting ? t("runpod.endpoints.delete.deleting") : t("runpod.common.delete")}
        tone="danger"
        onConfirm={handleConfirm}
      />
    </AlertDialog>
  );
}
