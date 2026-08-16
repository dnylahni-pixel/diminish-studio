"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Field } from "@/components/ui/inputs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select-combobox";
import { Stack } from "@/components/ui/layout";
import { createNetworkVolumeAction } from "@/integrations/runpod/server/mutations";
import { RUNPOD_DATA_CENTER_OPTIONS, localizeReferenceOptions } from "@/integrations/runpod/reference-data";
import { useI18n } from "@/i18n/client";

export function NetworkVolumeCreateDialog() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [size, setSize] = useState<number>(10);
  const [dataCenterId, setDataCenterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dataCenterId) return;
    setSubmitting(true);
    setError(null);

    const result = await createNetworkVolumeAction({
      name: name.trim(),
      size,
      dataCenterId,
    });

    if (!result.ok) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setName("");
    setSize(10);
    setDataCenterId("");
    setError(null);
    setSubmitting(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setError(null); } }}>
      <DialogTrigger asChild>
        <Button leadingIcon={<Plus className="size-4" />}>{t("runpod.networkVolumes.create.button")}</Button>
      </DialogTrigger>
      <DialogContent
        title={t("runpod.networkVolumes.create.title")}
        description={t("runpod.networkVolumes.create.description")}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Field label={t("runpod.common.name")} required>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("runpod.networkVolumes.create.namePlaceholder")}
                required
              />
            </Field>
            <Field label={t("runpod.networkVolumes.sizeLabel")} required helper={t("runpod.networkVolumes.sizeHelper")}>
              <NumberInput
                value={size}
                onChange={setSize}
                min={1}
                max={100000}
              />
            </Field>
            <Field label={t("runpod.common.dataCenter")} required>
              <Select
                options={localizeReferenceOptions(RUNPOD_DATA_CENTER_OPTIONS, t)}
                placeholder={t("runpod.common.selectDataCenter")}
                value={dataCenterId}
                onValueChange={setDataCenterId}
              />
            </Field>
            {error && (
              <p className="text-sm text-danger-600">{error}</p>
            )}
            <div className="flex justify-end gap-2.5 pt-2">
              <DialogTrigger asChild>
                <Button type="button" variant="secondary" disabled={submitting}>{t("common.cancel")}</Button>
              </DialogTrigger>
              <Button type="submit" loading={submitting}>{t("runpod.common.create")}</Button>
            </div>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
