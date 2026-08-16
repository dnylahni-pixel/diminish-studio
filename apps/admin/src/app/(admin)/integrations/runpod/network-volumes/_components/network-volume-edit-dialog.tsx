"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Field } from "@/components/ui/inputs";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Stack } from "@/components/ui/layout";
import { updateNetworkVolumeAction } from "@/integrations/runpod/server/mutations";
import { useI18n } from "@/i18n/client";
import type { NetworkVolumeSummary } from "@/integrations/runpod/types";

interface NetworkVolumeEditDialogProps {
  volume: NetworkVolumeSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NetworkVolumeEditDialog({
  volume,
  open,
  onOpenChange,
}: NetworkVolumeEditDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState(volume.name ?? "");
  const [size, setSize] = useState<number>(volume.size ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await updateNetworkVolumeAction({
      networkVolumeId: volume.id,
      ...(name.trim() !== volume.name ? { name: name.trim() } : {}),
      ...(size !== volume.size ? { size } : {}),
    });

    if (!result.ok) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    onOpenChange(false);
    setError(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleCancel = () => {
    setName(volume.name ?? "");
    setSize(volume.size ?? 10);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent
        title={t("runpod.networkVolumes.edit.title")}
        description={t("runpod.networkVolumes.edit.description", {
          name: volume.name ?? t("runpod.common.unnamed"),
        })}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Field label={t("runpod.common.name")} optional>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={volume.name ?? t("runpod.common.unnamed")}
              />
            </Field>
            <Field label={t("runpod.networkVolumes.sizeLabel")} optional helper={t("runpod.networkVolumes.sizeHelper")}>
              <NumberInput
                value={size}
                onChange={setSize}
                min={1}
                max={100000}
              />
            </Field>
            {error && (
              <p className="text-sm text-danger-600">{error}</p>
            )}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={submitting}>
                {t("common.save")}
              </Button>
            </div>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
