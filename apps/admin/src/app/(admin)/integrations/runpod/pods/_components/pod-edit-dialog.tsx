"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Field } from "@/components/ui/inputs";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Alert } from "@/components/ui/feedback";
import { Stack, Inline } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { updatePodAction } from "@/integrations/runpod/server/mutations";
import { useI18n } from "@/i18n/client";
import type { PodSummary } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface PodEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pod: PodSummary;
}

type EnvEntry = { key: string; value: string };

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function PodEditDialog({ open, onOpenChange, pod }: PodEditDialogProps) {
  const { t } = useI18n();

  /* ----- Form state ----- */
  const [name, setName] = useState(pod.name ?? "");
  const [imageName, setImageName] = useState(pod.imageName ?? "");
  const [containerDiskInGb, setContainerDiskInGb] = useState<number | undefined>(undefined);
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([{ key: "", value: "" }]);

  /* ----- Interaction state ----- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----- Re-initialize when pod changes ----- */
  useEffect(() => {
    setName(pod.name ?? "");
    setImageName(pod.imageName ?? "");
    setContainerDiskInGb(undefined);
    setEnvEntries([{ key: "", value: "" }]);
    setError(null);
  }, [pod.id, pod.name, pod.imageName]);

  /* ----- Handlers ----- */

  function resetForm() {
    setName(pod.name ?? "");
    setImageName(pod.imageName ?? "");
    setContainerDiskInGb(undefined);
    setEnvEntries([{ key: "", value: "" }]);
    setError(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  function addEnvRow() {
    setEnvEntries([...envEntries, { key: "", value: "" }]);
  }

  function removeEnvRow(index: number) {
    if (envEntries.length > 1) {
      setEnvEntries(envEntries.filter((_, i) => i !== index));
    }
  }

  function updateEnvKey(index: number, key: string) {
    const updated = envEntries.map((entry, i) => (i === index ? { ...entry, key } : entry));
    setEnvEntries(updated);
  }

  function updateEnvValue(index: number, value: string) {
    const updated = envEntries.map((entry, i) => (i === index ? { ...entry, value } : entry));
    setEnvEntries(updated);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    // Build env record from non-empty key entries
    const env: Record<string, string> = {};
    for (const entry of envEntries) {
      if (entry.key.trim()) {
        env[entry.key.trim()] = entry.value;
      }
    }

    const input: Record<string, unknown> = { podId: pod.id };

    if (name.trim() !== (pod.name ?? "")) {
      input.name = name.trim() || undefined;
    }
    if (imageName.trim() !== (pod.imageName ?? "")) {
      input.imageName = imageName.trim() || undefined;
    }
    if (containerDiskInGb !== undefined) {
      input.containerDiskInGb = containerDiskInGb;
    }

    // Only send env if entries were actually added
    const hasUserEnv = envEntries.some((e) => e.key.trim());
    if (hasUserEnv) {
      input.env = env;
    }

    const result = await updatePodAction(input);
    setLoading(false);

    if (result.ok) {
      handleOpenChange(false);
    } else {
      setError(result.error.message);
    }
  }

  /* ----- Render ----- */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="md"
        title={t("runpod.pods.edit.title")}
        description={t("runpod.pods.edit.description")}
        footer={
          <Inline gap="sm">
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              {t("runpod.common.saveChanges")}
            </Button>
          </Inline>
        }
      >
        <Stack gap="md">
          {error && <Alert tone="danger" title={t("runpod.pods.errorTitle")}>{error}</Alert>}

          <Field label={t("runpod.common.name")} htmlFor="edit-name" optional>
            <TextInput
              id="edit-name"
              placeholder={t("runpod.pods.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label={t("runpod.pods.imageName")} htmlFor="edit-image" optional>
            <TextInput
              id="edit-image"
              placeholder="nvidia/cuda:12.1-base"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
            />
          </Field>

          <Field label={t("runpod.pods.create.containerDisk")} optional>
            <NumberInput
              min={1}
              max={9000}
              value={containerDiskInGb}
              onChange={setContainerDiskInGb}
              placeholder={t("runpod.common.leaveUnchanged")}
            />
          </Field>

          {/* Environment variables */}
          <Stack gap="xs">
            <Inline justify="between" align="center">
              <Text weight="medium" size="sm">{t("runpod.common.environmentVariables")}</Text>
              <Button variant="ghost" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addEnvRow}>
                {t("runpod.common.addVariable")}
              </Button>
            </Inline>
            {envEntries.map((entry, index) => (
              <Inline key={index} gap="sm">
                <TextInput
                  className="flex-1"
                  placeholder={t("runpod.common.envKey")}
                  value={entry.key}
                  onChange={(e) => updateEnvKey(index, e.target.value)}
                />
                <TextInput
                  className="flex-[2]"
                  placeholder={t("runpod.common.envValue")}
                  value={entry.value}
                  onChange={(e) => updateEnvValue(index, e.target.value)}
                />
                {envEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-neutral-400 hover:text-danger-600"
                    onClick={() => removeEnvRow(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </Inline>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
